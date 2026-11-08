/* ============================================================
   启动初始化
   ============================================================ */

var greetingTexts = [
  "准备接受音符的包裹了吗？", "今天想听点什么？", "戴上耳机，世界与你无关。",
  "让旋律治愈你的疲惫。", "音乐是灵魂的避风港。", "遇见一首好歌，就像遇见一个老朋友。",
  "开启你的专属听觉漫游。", "愿音乐与你同在。"
];
$('mainLine').textContent = greetingTexts[Math.floor(Math.random() * greetingTexts.length)];

audio.volume = 0.8;
syncMode(); syncVolIcon(); syncPlayIcon(); updateFsIcon();
MediaSession.init();

var hasRestored = Store.restorePlaylist();
if (hasRestored) {
  syncMode();
  syncVolIcon();
  updateNowPlaying();
  renderQueue();
  switchTab(0);
  switchSearchTab(0);
} else {
  switchTab(0);
  switchSearchTab(0);
}

loadHomeContent();
renderSearchGrid();

$('searchBtn').addEventListener('click', doSearch);

var metaLine = $('metaLine'), weatherLine = $('weatherLine');
var locText = $('locText'), tempText = $('tempText'), descText = $('descText'), iconText = $('iconText');

function reveal(el, delay) { if(el) setTimeout(() => el.classList.add('show'), delay); }
function parseWeather(code) {
  if (code === 0) return { desc: '晴朗无云', icon: '☀️', rain: false };
  if (code >= 1 && code <= 3) return { desc: '多云转晴', icon: '⛅', rain: false };
  if (code >= 45 && code <= 48) return { desc: '有雾', icon: '🌫️', rain: false };
  if (code >= 51 && code <= 67) return { desc: '有雨', icon: '🌧️', rain: true };
  if (code >= 71 && code <= 77) return { desc: '下雪', icon: '❄️', rain: false };
  if (code >= 80 && code <= 82) return { desc: '阵雨', icon: '🌦️', rain: true };
  if (code >= 95) return { desc: '雷阵雨', icon: '⛈️', rain: true };
  return { desc: '宜听歌', icon: '🎵', rain: false };
}

async function initWeather() {
  reveal(metaLine, 100); reveal($('mainLine'), 200); reveal(weatherLine, 400);
  if (hasRestored && cur >= 0) reveal($('resumeCard'), 500);

  try {
    const ipRes = await fetch('https://api.ip.sb/geoip');
    if (!ipRes.ok) throw new Error('IP failed');
    const ipData = await ipRes.json();
    let city = ipData.city || ipData.region || '远方';
    city = city.replace('市', '').replace('省', '');

    const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${ipData.latitude}&longitude=${ipData.longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto`);
    if (!wRes.ok) throw new Error('Weather failed');
    const wData = await wRes.json();
    const maxT = Math.round(wData.daily.temperature_2m_max[0]);
    const minT = Math.round(wData.daily.temperature_2m_min[0]);
    const code = wData.daily.weather_code[0];
    const wInfo = parseWeather(code);

    locText.classList.remove('skeleton'); locText.textContent = city;
    tempText.classList.remove('skeleton'); tempText.textContent = `${minT}° ~ ${maxT}°`;
    descText.classList.remove('skeleton'); descText.textContent = `${wInfo.desc} · ${wInfo.rain ? '记得带伞' : '适合听歌'}`;
    iconText.textContent = wInfo.icon;
  } catch (e) {
    locText.classList.remove('skeleton'); locText.textContent = '地球';
    tempText.classList.remove('skeleton'); tempText.textContent = '舒适';
    descText.classList.remove('skeleton'); descText.textContent = '信号不好，但音乐还在';
  }
}
initWeather();

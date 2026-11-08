/* ============================================================
   全局引用 & 状态（$ / audio / 状态变量 / ICON / 工具函数）
   ============================================================ */

var $ = id => document.getElementById(id);
var audio = $('audio');
var DEFAULT_API_BASE = 'https://api.replow.org';
var API_BASE = DEFAULT_API_BASE;
var userCookie = '';

var songs = [], cur = -1, mode = 'loop', targetSongId = null, dragging = false, lyricIdx = -1, uid = 0;
var currentGlobalOffset = 0;
var currentTabIndex = 0;
var bgMode = 'cover';
var customBgUrl = '';
var searchType = 'song';
var currentSearchIndex = 0;
var currentRandomBgUrl = '';
var currentDetailCover = '';
var enableYrcChar = true; 

var homeList = [];
var toplistData = [];
var searchResults = { song: [], playlist: [], album: [], artist: [], mv: [] };

var detailSongs = [];
var prevView = 'lib';
var qrKey = null, qrTimer = null, isLoggedIn = false;
var flatSuggestList = [];
var activeSuggestIndex = -1;
var suggestDebounce = null;
var suggestAbort = null;
var artistSongs = [], artistAlbums = [], artistMVs = [];
var playHistory = [];

var ICON = {
  play:'<svg viewBox="0 0 24 24"><path d="M7 6.5v11a1.5 1.5 0 0 0 2.3 1.3l8.5-5.5a1.5 1.5 0 0 0 0-2.6L9.3 5.2A1.5 1.5 0 0 0 7 6.5z" fill="currentColor"/></svg>',
  pause:'<svg viewBox="0 0 24 24"><rect x="7" y="5" width="3.6" height="14" rx="1.5" fill="currentColor"/><rect x="13.4" y="5" width="3.6" height="14" rx="1.5" fill="currentColor"/></svg>',
  lyric:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 6.5h11M4 12h16M4 17.5h8"/></svg>',
  image:'<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 15.5l-5-5L5 20"/></svg>',
  trash:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>',
  loop:'<svg class="ic" viewBox="0 0 24 24"><path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 12V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12v2.5a3.5 3.5 0 0 1-3.5 3.5H3.5"/></svg>',
  one:'<svg class="ic" viewBox="0 0 24 24"><path d="M17 2.5l3.5 3.5L17 9.5"/><path d="M3.5 12V9.5A3.5 3.5 0 0 1 7 6h13.5"/><path d="M7 21.5L3.5 18 7 14.5"/><path d="M20.5 12v2.5a3.5 3.5 0 0 1-3.5 3.5H3.5"/><text x="12" y="15.2" font-size="8.5" font-weight="700" fill="currentColor" stroke="none" text-anchor="middle">1</text></svg>',
  shuffle:'<svg class="ic" viewBox="0 0 24 24"><path d="M3 6.5h3.4c2 0 3.1 1.3 4.5 3.6l2 3.3c1.4 2.3 2.5 3.6 4.5 3.6H21"/><path d="M17.5 3.5L21 6.5l-3.5 3"/><path d="M3 17.5h3.4c2 0 3.1-1.3 4.5-3.6"/><path d="M17.5 13.5L21 17.5l-3.5 3"/></svg>',
  mute:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M15 9.5l5 5M20 9.5l-5 5"/></svg>',
  sound:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9.5v5h3l4 3.5v-12L7 9.5H4z" fill="currentColor" stroke="none"/><path d="M14.5 9a4 4 0 0 1 0 6"/></svg>',
  fs:'<svg class="ic" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  fsExit:'<svg class="ic" viewBox="0 0 24 24"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'
};

var libView = $('libView'), detailView=$('detailView'), artistView=$('artistView'), playerView=$('playerView'), mini=$('mini');
var lyricInner = $('lyricInner'), lyricWrap=$('lyricWrap');
var barFill = $('barFill'), barDot=$('barDot'), bgLayer=$('bgLayer'), outroCredit=$('outroCredit');

function fmt(s){if(!s||!isFinite(s)||s<0)return '0:00';s=Math.floor(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function esc(str){return String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function baseName(n){return n.replace(/\.[^.]+$/,'').trim().toLowerCase();}
function formatNum(n) { if (!n) return '0'; if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿'; if (n >= 10000) return (n / 10000).toFixed(1) + '万'; return n.toString(); }
function normalizePic(url, size = 300) { if (!url) return ''; let u = url.replace(/^http:/, 'https:'); if (u.startsWith('//')) u = 'https:' + u; return `${u}?param=${size}y${size}`; }

var toastTimer = null;
function toast(msg){
  let el=document.querySelector('.toast');
  if(!el){ el=document.createElement('div'); el.className='toast'; document.body.appendChild(el); }
  el.textContent=msg; requestAnimationFrame(()=>el.classList.add('on'));
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('on'),2000);
}

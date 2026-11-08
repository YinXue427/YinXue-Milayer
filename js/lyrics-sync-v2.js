/* ============================================================
   歌词同步高亮
   ============================================================ */

/* [性能优化] 跟踪当前被修改的行与正在唱的字符索引，实现增量更新 */
var _yrcSingingLine = -1;
var _yrcSingingChar = -1;
/* [性能优化] 只对活跃行附近 N 行应用 blur，远处行不 blur 减少 GPU paint */
var _BLUR_RANGE = 5;

function renderLyrics(){
  const s=songs[cur]; lyricIdx=-1; lyricInner.innerHTML='';
  $('breathAnim').classList.remove('on'); $('outroCredit').classList.remove('show'); currentGlobalOffset = 0;
  _yrcSingingLine = -1; _yrcSingingChar = -1;

  if(!s||!s.lyrics || !s.lyrics.length){
    lyricInner.innerHTML='<div class="lyric-empty">暂无歌词<span>网易云歌曲自动加载，本地歌曲可导入同名 .lrc 文件</span></div>';
    lyricInner.style.transform='translateY(0)';return;
  }

  const isYRC = s.lyricsType === 'yrc' && enableYrcChar;

  s.lyrics.forEach((l) => {
    const d=document.createElement('div');
    d.className='lyric-line';

    if (isYRC && l.chars) {
      /* [性能优化] 预解析 start/dur 为数值并缓存 DOM 引用 + lastP 追踪，避免每帧 querySelectorAll + parseFloat + 无变化写入 */
      const cache = [];
      l.chars.forEach(ch => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = ch.text.trim() === '' ? '\u00A0' : ch.text;
        /* 不设 inline backgroundImage — 使用 CSS 默认渐变（全白初始态） */
        d.appendChild(span);
        cache.push({ el: span, start: ch.start, dur: ch.dur, lastP: -1 });
      });
      d._charCache = cache;
    } else {
      d.textContent = l.text;
    }

    d.addEventListener('click',()=>{audio.currentTime=l.t;});
    lyricInner.appendChild(d);
  });
  requestAnimationFrame(()=>{ centerFirst(); applyLineEffects(-2, 0); });
}

function applyLineEffects(activeIdx, nextIdx = 0) {
  const lines = lyricInner.children; if (!lines.length) return;
  for (let i = 0; i < lines.length; i++) {
    const el = lines[i]; if (!el.classList.contains('lyric-line')) continue;
    el.classList.remove('active');
    if (activeIdx === -3) { el.style.opacity = '0'; el.style.filter = ''; el.style.transform = 'scale(0.9)'; continue; }
    if (activeIdx === -2) {
      if (i < nextIdx) { el.style.opacity = '0'; el.style.filter = ''; el.style.transform = 'scale(0.9)'; }
      else { const delta = i - nextIdx; el.style.opacity = Math.max(0.2, 0.6 - delta * 0.1); el.style.filter = delta <= _BLUR_RANGE ? `blur(${Math.min(8, delta * 1.5 + 2)}px)` : ''; el.style.transform = 'scale(0.92)'; }
      continue;
    }
    if (i < activeIdx) { el.style.opacity = '0'; el.style.filter = (activeIdx - i) <= _BLUR_RANGE ? 'blur(8px)' : ''; el.style.transform = 'scale(0.9)'; }
    else if (i === activeIdx) { el.classList.add('active'); el.style.opacity = '1'; el.style.filter = ''; el.style.transform = 'none'; }
    else { const delta = i - activeIdx; el.style.opacity = Math.max(0.15, 0.6 - delta * 0.1); el.style.filter = delta <= _BLUR_RANGE ? `blur(${Math.min(6, delta * 1.5)}px)` : ''; el.style.transform = 'scale(0.92)'; }
  }
}

function centerFirst(extraOffset = 0){
  if(!lyricWrap.clientHeight)return; const el=lyricInner.firstElementChild;if(!el)return;
  lyricInner.style.transform=`translateY(${lyricWrap.clientHeight/2 - (el.offsetTop+el.offsetHeight/2) + extraOffset - 20}px)`;
}

function scrollToLine(idx, extraOffset = 0){
  const el=lyricInner.children[idx]; if(!el||!lyricWrap.clientHeight)return;
  lyricInner.style.transform=`translateY(${lyricWrap.clientHeight/2 - (el.offsetTop+el.offsetHeight/2) + extraOffset - 20}px)`;
}

/* [性能优化] 用 CSS 变量设置字符渐变位置，避免每帧拼接 linear-gradient 字符串 */
function _setCharGradient(charObj, p1, p2) {
  charObj.el.style.setProperty('--p1', p1 + '%');
  charObj.el.style.setProperty('--p2', p2 + '%');
}
function _setCharSung(charObj) {
  charObj.el.style.setProperty('--p1', '100%');
  charObj.el.style.setProperty('--p2', '100%');
}
function _resetChar(charObj) {
  charObj.el.style.setProperty('--p1', '0%');
  charObj.el.style.setProperty('--p2', '0%');
  charObj.lastP = -1;
}

function updateLyric(){
  const s = (cur >= 0 && cur < songs.length) ? songs[cur] : null;
  if(!s || !s.lyrics || !s.lyrics.length) return;
  const t = audio.currentTime;
  const lines = s.lyrics;
  let idx = -1;

  // 严格判断行时间，不提前切行
  for(let i=0;i<lines.length;i++){
    if(lines[i].t <= t) idx = i;
    else break;
  }

  let isInterlude = false, isOutro = false, displayIdx = idx, nextFocusIdx = 0;
  if(idx === -1){
    if(t < lines[0].t - 1){ isInterlude = true; displayIdx = -2; nextFocusIdx = 0; }
    else { displayIdx = 0; }
  } else if(idx >= 0){
    let isCurrentInterlude = false;
    const isLastLine = (idx === lines.length - 1);
    const nextT = isLastLine ? (audio.duration || Infinity) : lines[idx+1].t;

    if (isLastLine) {
      const lineEnd = lines[idx].endT || (lines[idx].t + 10);
      if (t > lineEnd) { isCurrentInterlude = true; isOutro = true; }
    } else {
      const isMark = lines[idx].text && (lines[idx].text.includes('间奏') || lines[idx].text.includes('纯音乐'));
      const gap = nextT - lines[idx].t;
      if (isMark || gap > 20) {
        let interludeStartT = lines[idx].endT || (lines[idx].t + 10);
        if (t > interludeStartT && t < nextT - 1) { isCurrentInterlude = true; nextFocusIdx = idx + 1; }
      }
    }

    if (isCurrentInterlude) { isInterlude = true; displayIdx = isOutro ? -3 : -2; }
    else { displayIdx = idx; }
  }

  const breathEl = $('breathAnim'), outroEl = $('outroCredit');
  if (isInterlude) breathEl.classList.add('on'); else breathEl.classList.remove('on');
  if (isOutro) outroEl.classList.add('show'); else outroEl.classList.remove('show');

  if(displayIdx !== lyricIdx) {
    lyricIdx = displayIdx;
    if(lyricIdx === -3){ applyLineEffects(-3, lines.length - 1); scrollToLine(lines.length - 1, 0); }
    else if (lyricIdx === -2){ applyLineEffects(-2, nextFocusIdx); scrollToLine(nextFocusIdx, 80); }
    else { applyLineEffects(lyricIdx); if(lyricIdx >= 0) scrollToLine(lyricIdx, 0); }

    /* [性能优化] 行切换时只重置上一行（被修改过的行），替代原全量遍历所有行 */
    if (_yrcSingingLine >= 0) {
      const oldLineEl = lyricInner.children[_yrcSingingLine];
      if (oldLineEl && oldLineEl._charCache) {
        for (let i = 0; i < oldLineEl._charCache.length; i++) {
          const c = oldLineEl._charCache[i];
          if (c.el.classList.contains('singing') || c.el.classList.contains('sung')) {
            c.el.classList.remove('singing', 'sung');
            _resetChar(c);
          }
        }
      }
    }
    _yrcSingingLine = -1;
    _yrcSingingChar = -1;
  }

  // [优化] 针对 A15 极速渲染的平滑渐变算法
  if (displayIdx >= 0 && s.lyricsType === 'yrc' && enableYrcChar) {
    const lineEl = lyricInner.children[displayIdx];
    const cache = lineEl && lineEl._charCache;
    if (!cache || !cache.length) return;

    /* [性能优化] 用索引查找当前正在唱的字符，替代原整行全量遍历 */
    let singingIdx = -1;
    for (let i = 0; i < cache.length; i++) {
      const start = cache[i].start;
      if (t < start) break;
      if (t < start + cache[i].dur) { singingIdx = i; break; }
    }

    /* [性能优化] 增量更新：仅在演唱字符索引变化时修改 DOM */
    if (singingIdx !== _yrcSingingChar) {
      if (_yrcSingingLine === displayIdx && _yrcSingingChar >= 0) {
        /* 旧字符唱完 */
        const oldObj = cache[_yrcSingingChar];
        if (!oldObj.el.classList.contains('sung')) {
          oldObj.el.classList.remove('singing');
          oldObj.el.classList.add('sung');
          _setCharSung(oldObj);
          oldObj.lastP = -1;
        }
        /* 处理跳过的中间字符（拖动进度条等）——设为 sung */
        if (singingIdx > _yrcSingingChar) {
          for (let i = _yrcSingingChar + 1; i < singingIdx; i++) {
            const obj = cache[i];
            if (!obj.el.classList.contains('sung')) {
              obj.el.classList.remove('singing');
              obj.el.classList.add('sung');
              _setCharSung(obj);
              obj.lastP = -1;
            }
          }
        } else if (singingIdx >= 0 && singingIdx < _yrcSingingChar) {
          /* 回退场景：重置新位置之后到旧位置之间的字符 */
          for (let i = singingIdx + 1; i <= _yrcSingingChar; i++) {
            const obj = cache[i];
            if (obj.el.classList.contains('singing') || obj.el.classList.contains('sung')) {
              obj.el.classList.remove('singing', 'sung');
              _resetChar(obj);
            }
          }
        }
      }
      if (singingIdx >= 0) {
        const newEl = cache[singingIdx].el;
        newEl.classList.remove('sung');
        newEl.classList.add('singing');
        cache[singingIdx].lastP = -1;
      }
      _yrcSingingChar = singingIdx;
    }

    _yrcSingingLine = displayIdx;

    /* [性能优化] 每帧只更新正在唱的 1 个字符 — CSS 变量 + 量化到 1% 跳过无变化帧 */
    if (singingIdx >= 0) {
      const charObj = cache[singingIdx];
      const elapsed = t - charObj.start;
      const pct = (elapsed / charObj.dur) * 100;
      /* 量化到整数 1% — 视觉无差别但跳过约 50% 的无变化帧 */
      var rp = Math.round(Math.min(100, pct));
      if (rp !== charObj.lastP) {
        var rp1 = Math.max(0, rp - 30);
        _setCharGradient(charObj, rp1, rp);
        charObj.lastP = rp;
      }
    }
  }
}

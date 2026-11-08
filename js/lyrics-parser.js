/* ============================================================
   歌词解析（LRC / YRC）
   ============================================================ */

function parseLrc(text){
  const out=[];
  text.split(/\r?\n/).forEach(raw=>{
    const stamps=[...raw.matchAll(/\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g)];
    if(!stamps.length)return;
    const content=raw.replace(/\[[^\]]*\]/g,'').trim();
    if(!content)return;
    const startM = stamps[0];
    const t = (+startM[1])*60 + (+startM[2]) + (startM[3] ? parseInt(startM[3].padEnd(3,'0'),10)/1000 : 0);
    let endT = null;
    if (stamps.length > 1) { const endM = stamps[1]; endT = (+endM[1])*60 + (+endM[2]) + (endM[3] ? parseInt(endM[3].padEnd(3,'0'),10)/1000 : 0); }
    out.push({ t, text: content, endT });
  });
  return out.sort((a,b)=>a.t-b.t);
}

function parseYRC(rawText) {
  const lines = [];
  if (!rawText) return lines;
  const rows = rawText.split(/\r?\n/);
  const lineRe = /^\[(\d+),(\d+)\](.*)$/;
  const charRe = /\((\d+),(\d+),(\d+)\)([^()]*)/g;

  for (const row of rows) {
    const trimmed = row.trim();
    if (!trimmed || trimmed.startsWith('{')) continue; 
    const lineMatch = trimmed.match(lineRe);
    if (!lineMatch) continue;

    const lineStartMs = parseInt(lineMatch[1], 10);
    const lineDurMs = parseInt(lineMatch[2], 10);
    const body = lineMatch[3];

    const chars = [];
    let charMatch;
    charRe.lastIndex = 0;
    while ((charMatch = charRe.exec(body)) !== null) {
      const sylStartMs = parseInt(charMatch[1], 10);
      const sylDurMs = parseInt(charMatch[2], 10);
      const type = parseInt(charMatch[3], 10); 
      const text = charMatch[4];
      if (!text || type !== 0) continue; 
      
      chars.push({ start: sylStartMs / 1000, dur: sylDurMs / 1000, text });
    }

    for (let i = 0; i < chars.length; i++) {
      if (i < chars.length - 1) {
        const maxDur = chars[i + 1].start - chars[i].start;
        if (chars[i].dur > maxDur || chars[i].dur <= 0) chars[i].dur = maxDur;
      } else {
        const maxDur = (lineStartMs + lineDurMs) / 1000 - chars[i].start;
        if (chars[i].dur > maxDur || chars[i].dur <= 0) chars[i].dur = maxDur;
      }
      if (chars[i].dur < 0.05) chars[i].dur = 0.05;
    }

    if (chars.length) {
      lines.push({
        t: lineStartMs / 1000,
        endT: (lineStartMs + lineDurMs) / 1000,
        text: chars.map(c=>c.text).join(''),
        chars
      });
    }
  }
  return lines;
}

async function loadNeteaseLyric(song) {
  if (!song || song.source !== 'netease' || song._lyricLoaded) return;
  song._lyricLoaded = true;
  try {
    const res = await API.fetch(`${API_BASE}/lyric/new?id=${song.nid}`);
    const data = await res.json();
    
    if (data && data.yrc && data.yrc.lyric) {
      const yrcLines = parseYRC(data.yrc.lyric);
      if (yrcLines.length) {
        song.lyrics = yrcLines;
        song.lyricsType = 'yrc';
        return;
      }
    }
    
    if (data && data.lrc && data.lrc.lyric) {
      const lines = parseLrc(data.lrc.lyric);
      if (lines.length) {
        song.lyrics = lines;
        song.lyricsType = 'lrc';
      }
    }
  } catch(e) { song._lyricLoaded = false; }
}

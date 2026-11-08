/* ============================================================
   本地音乐导入
   ============================================================ */

var importMask = $('importMask'), modalBody=$('modalBody');
var pending = {audio:[],lyric:[],cover:[]};
var AUDIO_EXT = ['mp3','flac','wav','ogg','oga','m4a','aac','opus','webm','aiff','aif'],IMG_EXT=['jpg','jpeg','png','webp','gif','bmp','avif'];

function classify(files){
  const r={audio:[],lyric:[],cover:[]};
  [...files].forEach(f=>{
    const ext=(f.name.split('.').pop()||'').toLowerCase();
    if(f.type.startsWith('audio/')||AUDIO_EXT.includes(ext))r.audio.push(f);
    else if(ext==='lrc')r.lyric.push(f);
    else if(f.type.startsWith('image/')||IMG_EXT.includes(ext))r.cover.push(f);
  });
  return r;
}
var DESC_DEFAULT = {audio:'MP3 / FLAC / WAV / M4A / OGG…',lyric:'.lrc 歌词，按文件名匹配',cover:'JPG / PNG / WEBP，留空读取内嵌封面'};
function updatePendingUI(){
  ['audio','lyric','cover'].forEach(kind=>{
    const row=modalBody.querySelector(`[data-kind="${kind}"]`),desc=modalBody.querySelector(`[data-desc="${kind}"]`),arr=pending[kind];
    row.classList.toggle('has',arr.length>0);
    if(!arr.length)desc.textContent=DESC_DEFAULT[kind];
    else if(arr.length===1)desc.textContent=arr[0].name;
    else desc.textContent=`${arr[0].name} 等 ${arr.length} 个文件`;
  });
}
function openModal(){pending={audio:[],lyric:[],cover:[]};updatePendingUI();modalBody.classList.remove('drag');importMask.classList.add('on');}
function closeModal(){importMask.classList.remove('on');}

$('openImport').addEventListener('click',openModal);
$('modalClose').addEventListener('click',closeModal);
$('modalCancel').addEventListener('click',closeModal);
importMask.addEventListener('click',e=>{if(e.target===importMask)closeModal();});

modalBody.addEventListener('click',e=>{
  const pickBtn=e.target.closest('[data-pick]');
  if(pickBtn){
    const kind=pickBtn.dataset.pick;
    const map={audio:'audioPickInput',lyric:'lyricPickInput',cover:'coverPickInput'};
    if(map[kind]) $(map[kind]).click();
    return;
  }
  const clearBtn=e.target.closest('[data-clear]');
  if(clearBtn){pending[clearBtn.dataset.clear]=[];updatePendingUI();}
});

$('audioPickInput').addEventListener('change',e=>{const c=classify(e.target.files);pending.audio.push(...c.audio);pending.lyric.push(...c.lyric);pending.cover.push(...c.cover);e.target.value='';updatePendingUI();});
$('lyricPickInput').addEventListener('change',e=>{pending.lyric.push(...e.target.files);e.target.value='';updatePendingUI();});
$('coverPickInput').addEventListener('change',e=>{pending.cover.push(...e.target.files);e.target.value='';updatePendingUI();});

modalBody.addEventListener('dragover',e=>{e.preventDefault();modalBody.classList.add('drag');});
modalBody.addEventListener('dragleave',e=>{if(!modalBody.contains(e.relatedTarget))modalBody.classList.remove('drag');});
modalBody.addEventListener('drop',e=>{e.preventDefault();modalBody.classList.remove('drag');const c=classify(e.dataTransfer.files);pending.audio.push(...c.audio);pending.lyric.push(...c.lyric);pending.cover.push(...c.cover);updatePendingUI();});

$('modalConfirm').addEventListener('click',async()=>{
  const {audio:audios,lyric:lrcs,cover:imgs}=pending;
  if(!audios.length&&!lrcs.length&&!imgs.length){toast('请至少选择一个文件');return;}
  closeModal();await doImport(audios,lrcs,imgs);
});

async function doImport(audios,lrcs,imgs){
  const created=[];
  for(const af of audios){
    const song={ id: ++uid, name: baseName(af.name) || af.name, artist: '本地音乐', url: URL.createObjectURL(af), cover: null, hasExternalCover: false, lyrics: [], dur: 0, base: baseName(af.name), source: 'local', lyricsType: 'lrc' };
    songs.push(song);created.push(song);
    const probe=new Audio();probe.preload='metadata';probe.src=song.url;
    probe.addEventListener('loadedmetadata',()=>{song.dur=probe.duration;probe.src='';refreshAllGrids();},{once:true});
  }

  const assignCover=(song,url)=>{if(!song)return;song.cover=url;song.hasExternalCover=true;};

  if(created.length===1){
    const only=created[0];
    if(imgs.length)assignCover(only,URL.createObjectURL(imgs[0]));
    for(const lf of lrcs){try{const lines=parseLrc(await lf.text());if(lines.length){only.lyrics=lines;break;}}catch{}}
  } else {
    for(const imf of imgs){const b=baseName(imf.name),s=created.find(x=>x.base===b&&!x.hasExternalCover);if(s)assignCover(s,URL.createObjectURL(imf));}
    for(const lf of lrcs){const b=baseName(lf.name),s=created.find(x=>x.base===b&&!x.lyrics.length);if(!s)continue;try{const lines=parseLrc(await lf.text());if(lines.length)s.lyrics=lines;}catch{}}
  }

  if(!audios.length&&cur>=0){
    const cs=songs[cur];
    if(imgs.length&&!cs.hasExternalCover)assignCover(cs,URL.createObjectURL(imgs[0]));
    if(!cs.lyrics.length){for(const lf of lrcs){try{const lines=parseLrc(await lf.text());if(lines.length){cs.lyrics=lines;break;}}catch{}}}
  }

  refreshAllGrids();
  if(cur===-1&&created.length) playSong(songs.indexOf(created[0]),false);
  else if(cur>=0){updateNowPlaying();renderLyrics();}
  const added=created.length;
  if(added)toast(`已导入 ${added} 首歌曲`);else toast('已更新当前歌曲');
}

$('lyricInput').addEventListener('change',e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  const song=songs.find(s=>s.id===targetSongId);if(!song)return;
  const reader=new FileReader();
  reader.onload=()=>{
    const lines=parseLrc(String(reader.result));
    if(!lines.length){toast('没有解析到有效的歌词行');return;}
    song.lyrics=lines; song.lyricsType='lrc';
    if(songs[cur]&&songs[cur].id===song.id)renderLyrics();
    refreshAllGrids();toast('歌词已更新');
  };
  reader.readAsText(f,'utf-8');
});

$('coverInput').addEventListener('change',e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  const song=songs.find(s=>s.id===targetSongId);if(!song)return;
  const reader=new FileReader();
  reader.onload=()=>{
    song.cover=reader.result; song.hasExternalCover=true;
    if(songs[cur]&&songs[cur].id===song.id)updateNowPlaying();
    refreshAllGrids();toast('封面已更新');
  };
  reader.readAsDataURL(f);
});

$('backBtn').addEventListener('click',()=>{ if (prevView === 'detail') setView('detail'); else if (prevView === 'artist') setView('artist'); else setView('lib'); });
$('playBtn').addEventListener('click',togglePlay);
$('miniPlay').addEventListener('click',e=>{e.stopPropagation();togglePlay();});
$('prevBtn').addEventListener('click',()=>step(-1));
$('nextBtn').addEventListener('click',()=>step(1));
$('miniNext').addEventListener('click',e=>{e.stopPropagation();step(1);});
mini.addEventListener('click',e=>{if(e.target.closest('button'))return;if(cur>=0)setView('player');});

/* ============================================================
   设置 / 背景 / 主题
   ============================================================ */

function loadSettings() {
  try {
    API_BASE = Store.get('api_base', DEFAULT_API_BASE);
    $('apiBaseInput').value = API_BASE;
    userCookie = Store.get('netease_cookie', '');
    if (userCookie) { isLoggedIn = true; updateLoginUI(); verifyCookie(); }

    const savedColor = Store.get('accent', '#ffffff');
    document.documentElement.style.setProperty('--accent', savedColor);
    document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('active', d.dataset.color === savedColor));
    const savedBlur = Store.get('blur', 50);
    $('sliderBlur').value = savedBlur; $('valBlur').textContent = savedBlur + 'px';
    document.documentElement.style.setProperty('--bg-blur', savedBlur + 'px');
    const savedDark = Store.get('dark', 25);
    $('sliderDark').value = savedDark; $('valDark').textContent = savedDark + '%';
    document.documentElement.style.setProperty('--bg-dark', (savedDark / 100).toFixed(2));
    const saved3D = Store.get('toggle3D', true);
    $('toggle3D').checked = saved3D; document.body.classList.toggle('no-3d', !saved3D);
    
    enableYrcChar = Store.get('enableYrcChar', true);
    $('toggleYrcChar').checked = enableYrcChar;
    
    const savedSize = Store.get('lyricSize', 32);
    $('sliderLyricSize').value = savedSize; $('valLyricSize').textContent = savedSize + 'px';
    document.documentElement.style.setProperty('--lyric-size', savedSize + 'px');
    const savedSpacing = Store.get('lyricSpacing', 1.5);
    $('sliderLyricSpacing').value = savedSpacing * 10; $('valLyricSpacing').textContent = savedSpacing;
    document.documentElement.style.setProperty('--lyric-spacing', savedSpacing);
    const savedScale = Store.get('lyricScale', 1.05);
    $('sliderLyricScale').value = savedScale * 10; $('valLyricScale').textContent = savedScale;
    document.documentElement.style.setProperty('--lyric-scale', savedScale);
    bgMode = Store.get('bg_mode', 'cover');
    updateBgModeUI(bgMode); toggleCustomBgUI(bgMode);
    customBgUrl = Store.get('custom_bg', '');
  } catch(e) { console.warn(e); }
}
loadSettings();

$('apiBaseInput').addEventListener('change', (e) => {
  let val = e.target.value.trim(); if (!val) val = DEFAULT_API_BASE;
  val = val.replace(/\/+$/, ''); API_BASE = val; Store.set('api_base', API_BASE); e.target.value = API_BASE;
  toast('API 地址已保存'); loadHomeContent();
});

$('resetApiBtn').addEventListener('click', () => {
  API_BASE = DEFAULT_API_BASE; Store.set('api_base', API_BASE); $('apiBaseInput').value = API_BASE;
  toast('API 已恢复默认'); loadHomeContent();
});

function toggleCustomBgUI(mode) { $('customBgLabel').style.display = mode === 'custom' ? 'flex' : 'none'; }
function updateBgModeUI(mode) {
  const btns = document.querySelectorAll('.bg-mode-btn'); const indicator = $('bgModeIndicator');
  let idx = 0; btns.forEach((b, i) => { if (b.dataset.mode === mode) idx = i; b.classList.toggle('active', b.dataset.mode === mode); });
  indicator.style.transform = `translateX(${idx * 100}%)`;
}

function updateGlobalBg(coverUrl) {
  const fluidCanvas = $('fluidBg');
  
  if (bgMode === 'fluid') {
    bgLayer.style.opacity = '0';
    fluidCanvas.style.opacity = '1';
    FluidBg.start();
    if (coverUrl) FluidBg.setImage(coverUrl);
    return;
  } else {
    bgLayer.style.opacity = '0.6';
    fluidCanvas.style.opacity = '0';
    FluidBg.stop();
  }

  let finalUrl = 'none';
  if (bgMode === 'cover') finalUrl = coverUrl ? `url("${coverUrl}")` : 'none';
  else if (bgMode === 'random') {
    if (!currentRandomBgUrl) currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
    finalUrl = `url("${currentRandomBgUrl}")`;
  } else if (bgMode === 'custom' && customBgUrl) finalUrl = `url("${customBgUrl}")`;
  document.documentElement.style.setProperty('--current-bg', finalUrl);
}

document.querySelectorAll('.bg-mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    bgMode = btn.dataset.mode; Store.set('bg_mode', bgMode); updateBgModeUI(bgMode); toggleCustomBgUI(bgMode);
    if (bgMode === 'random' && !currentRandomBgUrl) currentRandomBgUrl = `https://api.yppp.net/pc.php?t=${Date.now()}`;
    if (detailView.classList.contains('on')) updateGlobalBg(currentDetailCover);
    else if (artistView.classList.contains('on') && $('aCover').src) updateGlobalBg($('aCover').src);
    else { const s = (cur >= 0 && songs[cur]) ? songs[cur] : null; updateGlobalBg(s ? s.cover : null); }
  });
});

$('customBgInput').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f);
    });
    const maxW = 1920;
    const ratio = Math.min(1, maxW / img.width);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    try {
      Store.set('custom_bg', dataUrl);
      customBgUrl = dataUrl;
    } catch (storageErr) {
      toast('背景过大无法持久保存，仅本次有效');
      customBgUrl = URL.createObjectURL(f);
    }
    if (bgMode !== 'custom') { bgMode = 'custom'; Store.set('bg_mode', bgMode); updateBgModeUI(bgMode); toggleCustomBgUI(bgMode); }
    updateGlobalBg((cur >= 0 && songs[cur]) ? songs[cur].cover : null);
    toast('背景图片已应用');
  } catch (err) { toast('图片加载失败'); }
});

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active'); document.documentElement.style.setProperty('--accent', dot.dataset.color);
    Store.set('accent', dot.dataset.color);
  });
});

$('extractColor').addEventListener('click', () => {
  if (cur < 0 || !songs[cur] || !songs[cur].cover) { toast('当前播放歌曲暂无封面'); return; }
  const img = new Image(); img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      let r = data[0] / 255, g = data[1] / 255, b = data[2] / 255;
      let max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
      if (max === min) h = s = 0;
      else {
        let d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; }
        h /= 6;
      }
      l = 0.8; s = Math.min(s, 0.6);
      const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p; };
      let newR, newG, newB;
      if (s === 0) newR = newG = newB = l;
      else { let q = l < 0.5 ? l * (1 + s) : l + s - l * s; let p = 2 * l - q; newR = hue2rgb(p, q, h + 1/3); newG = hue2rgb(p, q, h); newB = hue2rgb(p, q, h - 1/3); }
      const hex = '#' + [newR, newG, newB].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
      document.documentElement.style.setProperty('--accent', hex); Store.set('accent', hex); toast('已提取并提亮主题色');
    } catch(e) { toast('无法提取颜色'); }
  };
  img.onerror = () => toast('提取颜色失败'); img.src = songs[cur].cover;
});

$('toggle3D').addEventListener('change', (e) => { document.body.classList.toggle('no-3d', !e.target.checked); Store.set('toggle3D', e.target.checked); });
$('toggleYrcChar').addEventListener('change', (e) => { enableYrcChar = e.target.checked; Store.set('enableYrcChar', enableYrcChar); renderLyrics(); });

$('sliderBlur').addEventListener('input', e => { $('valBlur').textContent = e.target.value + 'px'; document.documentElement.style.setProperty('--bg-blur', e.target.value + 'px'); Store.set('blur', e.target.value); });
$('sliderDark').addEventListener('input', e => { $('valDark').textContent = e.target.value + '%'; document.documentElement.style.setProperty('--bg-dark', (e.target.value / 100).toFixed(2)); Store.set('dark', e.target.value); });
$('sliderLyricSize').addEventListener('input', e => { $('valLyricSize').textContent = e.target.value + 'px'; document.documentElement.style.setProperty('--lyric-size', e.target.value + 'px'); Store.set('lyricSize', e.target.value); });
$('sliderLyricSpacing').addEventListener('input', e => { const v = (+e.target.value / 10).toFixed(1); $('valLyricSpacing').textContent = v; document.documentElement.style.setProperty('--lyric-spacing', v); Store.set('lyricSpacing', v); });
$('sliderLyricScale').addEventListener('input', e => { const v = (+e.target.value / 10).toFixed(2); $('valLyricScale').textContent = v; document.documentElement.style.setProperty('--lyric-scale', v); Store.set('lyricScale', v); });

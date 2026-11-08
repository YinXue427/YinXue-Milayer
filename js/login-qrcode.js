/* ============================================================
   网易云扫码登录
   ============================================================ */

function updateLoginUI() {
  const btn = $('navLoginBtn');
  if (btn) {
    btn.textContent = isLoggedIn ? '退出登录' : '登录';
    btn.classList.toggle('primary', isLoggedIn);
  }
}
async function verifyCookie() {
  try {
    const res = await API.fetch(`${API_BASE}/login/status`);
    const data = await res.json();
    if (data.data?.profile?.userId || data.profile?.userId) {
      isLoggedIn = true;
    } else {
      isLoggedIn = false; userCookie = ''; Store.set('netease_cookie', '');
    }
  } catch(e) { isLoggedIn = false; }
  updateLoginUI();
}
$('navLoginBtn').addEventListener('click', () => {
  if (isLoggedIn) {
    if (confirm('确定要退出当前网易云账号吗？')) {
      userCookie = ''; isLoggedIn = false; Store.set('netease_cookie', ''); updateLoginUI();
      toast('已退出登录'); loadHomeContent();
    }
  } else {
    $('loginMask').classList.add('on'); startQrLogin();
  }
});
$('loginClose').addEventListener('click', () => { $('loginMask').classList.remove('on'); stopQrPolling(); });
$('loginMask').addEventListener('click', e => { if (e.target === $('loginMask')) { $('loginMask').classList.remove('on'); stopQrPolling(); } });
$('qrRefreshBtn').addEventListener('click', startQrLogin);
function stopQrPolling() { if (qrTimer) { clearInterval(qrTimer); qrTimer = null; } }

async function startQrLogin() {
  stopQrPolling();
  $('qrStatus').textContent = '正在获取二维码...'; $('qrStatus').className = ''; $('qrRefreshBtn').style.display = 'none';
  $('qrContainer').innerHTML = '<span style="color:#999;font-size:14px;">加载中...</span>';
  try {
    const keyRes = await fetch(`${API_BASE}/login/qr/key?timestamp=${Date.now()}`);
    const keyData = await keyRes.json();
    if (!keyData.data || !keyData.data.unikey) throw new Error('获取 key 失败');
    qrKey = keyData.data.unikey;
    const createRes = await fetch(`${API_BASE}/login/qr/create?key=${qrKey}&qrimg=true&timestamp=${Date.now()}`);
    const createData = await createRes.json();
    if (!createData.data || !createData.data.qrimg) throw new Error('生成二维码失败');
    $('qrContainer').innerHTML = `<img src="${createData.data.qrimg}" alt="QR" style="width:100%;height:100%;object-fit:contain;">`;
    $('qrStatus').textContent = '请使用网易云音乐 App 扫码';
    startQrPolling();
  } catch (e) {
    $('qrStatus').textContent = '加载失败，请重试'; $('qrStatus').className = 'error'; $('qrRefreshBtn').style.display = 'inline-flex';
  }
}

function startQrPolling() {
  stopQrPolling();
  qrTimer = setInterval(async () => {
    if (!qrKey) return;
    try {
      const res = await fetch(`${API_BASE}/login/qr/check?key=${qrKey}&timestamp=${Date.now()}`);
      const data = await res.json();
      const code = data.code || data.body?.code;
      if (code === 800) {
        stopQrPolling(); $('qrStatus').textContent = '二维码已过期，请刷新'; $('qrStatus').className = 'error'; $('qrRefreshBtn').style.display = 'inline-flex';
      } else if (code === 801) {
        $('qrStatus').textContent = '等待扫码...';
      } else if (code === 802) {
        $('qrStatus').textContent = '已扫码，请在手机上确认'; $('qrStatus').className = 'success';
      } else if (code === 803) {
        stopQrPolling(); $('qrStatus').textContent = '登录成功！'; $('qrStatus').className = 'success';
        const ck = data.cookie || data.body?.cookie;
        if (ck) {
          userCookie = Array.isArray(ck) ? ck.join('; ') : ck;
          Store.set('netease_cookie', userCookie); isLoggedIn = true; updateLoginUI();
          toast('登录成功'); setTimeout(() => { $('loginMask').classList.remove('on'); loadHomeContent(); }, 1000);
        }
      }
    } catch(e) {}
  }, 2000);
}

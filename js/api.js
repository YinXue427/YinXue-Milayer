/* ============================================================
   接口封装 API
   ============================================================ */

var API = {
  fetch(url, options = {}) {
    let finalUrl = url;
    if (userCookie) {
      const sep = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${sep}cookie=${encodeURIComponent(userCookie)}`;
    }
    const sep2 = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${sep2}timestamp=${Date.now()}`;
    return fetch(finalUrl, options);
  },
  async getToplist() {
    const res = await this.fetch(`${API_BASE}/toplist`);
    const data = await res.json();
    return data.list || [];
  },
  async getRecommend() {
    const res = await this.fetch(`${API_BASE}/personalized?limit=30`);
    const data = await res.json();
    return data.result || [];
  }
};

/* ============================================================
   流体背景引擎 (Fluid Palette)
   ============================================================ */
const FluidBg = (function() {
  let canvas = null, gl = null, prog = null;
  let uRes, uTime, uColors, uWeights, uSoftness, uContrast, uGrain, uMouse, uMouseOn, uBurst;
  let running = false, rafId = null;
  let flowTime = 0, lastTime = 0;
  
  const MAXC = 8;
  const curColors  = new Float32Array(MAXC * 3);
  const tgtColors  = new Float32Array(MAXC * 3);
  const curWeights = new Float32Array(MAXC);
  const tgtWeights = new Float32Array(MAXC);
  let firstSync = true;
  
  const defaultColors = [
    { r: 78,  g: 132, b: 255, ratio: 1 },
    { r: 150, g: 96,  b: 255, ratio: 1 },
    { r: 255, g: 112, b: 168, ratio: 1 },
    { r: 88,  g: 220, b: 230, ratio: 1 }
  ];

  const VERT = `attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;
  const FRAG = `
    precision highp float;
    uniform vec2 u_res; uniform float u_time;
    uniform vec3 u_colors[8]; uniform float u_weights[8];
    uniform float u_softness; uniform float u_contrast; uniform float u_grain;
    uniform vec2 u_mouse; uniform float u_mouseOn; uniform float u_burst;

    float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float vnoise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
      float a = hash21(i); float b = hash21(i + vec2(1.0, 0.0));
      float c = hash21(i + vec2(0.0, 1.0)); float d = hash21(i + vec2(1.0, 1.0));
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0; float a = 0.5; mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
      for(int i = 0; i < 3; i++){ v += a * vnoise(p); p = rot * p * 2.03; a *= 0.5; }
      return v;
    }
    void main(){
      vec2 frag = gl_FragCoord.xy;
      vec2 p = (frag - 0.5 * u_res) / min(u_res.x, u_res.y);
      p *= 0.90;
      float t = u_time * 0.5;
      float n1 = fbm(p * 1.55 + vec2(0.0, t * 0.55));
      float n2 = fbm(p * 1.55 + vec2(5.2, 1.3) - vec2(t * 0.45, 0.0));
      vec2 warp = vec2(n1, n2) - 0.5;
      vec2 wp = p + warp * (0.35 + u_softness * 1.05);
      
      vec3 col = vec3(0.0); float wsum = 0.0;
      for(int i = 0; i < 8; i++){
        float fi = float(i); float w = u_weights[i];
        vec2 c = vec2(
          sin(t * 0.90 + fi * 1.70) * 0.42 + sin(t * 0.37 + fi * 2.90) * 0.20,
          cos(t * 0.80 + fi * 2.10) * 0.42 + cos(t * 0.43 + fi * 1.10) * 0.20
        );
        c *= 1.0 + u_burst * 0.55;
        float d = length(wp - c);
        float inf = exp(-d * d * 2.60) * w;
        inf = pow(max(inf, 0.0), 1.45);
        col += u_colors[i] * inf; wsum += inf;
      }
      if(wsum > 1e-6) col /= wsum; else col = u_colors[0] * 0.5;
      col *= 1.10;
      col = clamp(col, 0.0, 1.0);
      vec3 sc = smoothstep(vec3(0.0), vec3(1.0), col);
      col = mix(col, sc, u_contrast);
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(luma), col, 1.18); col = max(col, 0.0);
      if(u_mouseOn > 0.5){
        float md = length(p - u_mouse); col *= 1.0 + 0.26 * exp(-md * md * 6.0);
      }
      float vig = length(p); col *= 1.0 - 0.34 * smoothstep(0.32, 1.15, vig);
      float g = hash21(frag + fract(u_time) * 137.0); col += (g - 0.5) * u_grain;
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `;

  function initWebGL() {
    try { gl = canvas.getContext('webgl', { alpha: false, antialias: false }); } catch (e) { return false; }
    if (!gl) return false;

    const mk = (type, src) => {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    };
    const vs = mk(gl.VERTEX_SHADER, VERT); const fs = mk(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;

    prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    uRes = gl.getUniformLocation(prog, 'u_res'); uTime = gl.getUniformLocation(prog, 'u_time');
    uColors = gl.getUniformLocation(prog, 'u_colors[0]'); uWeights = gl.getUniformLocation(prog, 'u_weights[0]');
    uSoftness = gl.getUniformLocation(prog, 'u_softness'); uContrast = gl.getUniformLocation(prog, 'u_contrast');
    uGrain = gl.getUniformLocation(prog, 'u_grain'); uMouse = gl.getUniformLocation(prog, 'u_mouse');
    uMouseOn = gl.getUniformLocation(prog, 'u_mouseOn'); uBurst = gl.getUniformLocation(prog, 'u_burst');
    return true;
  }

  function resize() {
    if (!canvas) return;
    const W = window.innerWidth, H = window.innerHeight;
    const maxSide = 1100;
    const s = Math.min(1, maxSide / Math.max(W, H));
    const w = Math.max(2, Math.round(W * s)), h = Math.max(2, Math.round(H * s));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      if (gl) { gl.viewport(0, 0, w, h); gl.uniform2f(uRes, w, h); }
    }
  }

  function updateColors(colorArr) {
    for (let i = 0; i < MAXC; i++) {
      const c = colorArr[i % colorArr.length];
      tgtColors[i * 3] = c.r / 255; tgtColors[i * 3 + 1] = c.g / 255; tgtColors[i * 3 + 2] = c.b / 255;
      tgtWeights[i] = 1.0;
    }
    if (firstSync) { curColors.set(tgtColors); curWeights.set(tgtWeights); firstSync = false; }
  }

  function extractColors(img) {
    try {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, 32, 32);
      const data = ctx.getImageData(0, 0, 32, 32).data;
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
        if (a < 128) continue;
        const key = `${r>>4}_${g>>4}_${b>>4}`;
        if (!buckets.has(key)) buckets.set(key, { r: 0, g: 0, b: 0, n: 0 });
        const bkt = buckets.get(key); bkt.r += r; bkt.g += g; bkt.b += b; bkt.n++;
      }
      const list = [...buckets.values()].map(x => ({ r: Math.round(x.r/x.n), g: Math.round(x.g/x.n), b: Math.round(x.b/x.n), n: x.n }));
      list.sort((a, b) => b.n - a.n);
      return list.slice(0, 4);
    } catch(e) { return defaultColors; }
  }

  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now; flowTime += dt * 1.0;
    
    const kk = 1 - Math.pow(0.0015, dt);
    for (let i = 0; i < MAXC * 3; i++) curColors[i] += (tgtColors[i] - curColors[i]) * kk;
    for (let i = 0; i < MAXC; i++) curWeights[i] += (tgtWeights[i] - curWeights[i]) * kk;

    if (gl) {
      gl.uniform1f(uTime, flowTime);
      gl.uniform3fv(uColors, curColors);
      gl.uniform1fv(uWeights, curWeights);
      gl.uniform1f(uSoftness, 0.45);
      gl.uniform1f(uContrast, 0.55);
      gl.uniform1f(uGrain, 0.03);
      gl.uniform1f(uBurst, 0.0);
      gl.uniform1f(uMouseOn, 0.0); 
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    rafId = requestAnimationFrame(frame);
  }

  return {
    init: function() {
      canvas = document.getElementById('fluidBg');
      if (!canvas || !initWebGL()) return;
      resize();
      window.addEventListener('resize', resize);
      updateColors(defaultColors);
    },
    start: function() {
      if (running) return;
      running = true; lastTime = performance.now();
      rafId = requestAnimationFrame(frame);
    },
    stop: function() {
      running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null;
    },
    setImage: function(url) {
      if (!url) { updateColors(defaultColors); return; }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const colors = extractColors(img);
        updateColors(colors.length > 0 ? colors : defaultColors);
      };
      img.onerror = () => updateColors(defaultColors);
      img.src = url;
    }
  };
})();

window.addEventListener('DOMContentLoaded', () => { FluidBg.init(); });

/* =====================================================================
   VOIDWAVE — hero black-hole shader (progressive enhancement)
   ---------------------------------------------------------------------
   A single fullscreen WebGL fragment shader that lenses the hero gameplay
   clip around a black hole, draws the cyan accretion ring + pink/purple
   core, and adds a VHS chromatic glitch — the in-game look, "almost".

   It is OPTIONAL: if WebGL is missing, the shader fails to compile, the
   user prefers reduced motion, or the device looks low-powered, we simply
   don't mount it and the pure-CSS .void-ring stays as the fallback.

   Cost controls: render resolution is capped (DPR ≤ 1.5, longest side ≤
   1920), the loop pauses when the hero scrolls off-screen or the tab is
   hidden, and it bails on prefers-reduced-motion.
   ===================================================================== */
(function () {
  'use strict';

  var dbg = { mounted: false, reason: '' };
  window.__VOIDSHADER = dbg;

  function bail(reason) { dbg.reason = reason; return false; }

  function init() {
    var canvas = document.getElementById('heroShader');
    var video = document.querySelector('.hero-video');
    var hero = document.getElementById('hero');
    if (!canvas || !hero) { return bail('no canvas/hero'); }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return bail('reduced-motion'); }
    if (navigator.deviceMemory && navigator.deviceMemory < 2) { return bail('low device-memory'); }

    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false })
          || canvas.getContext('experimental-webgl');
    if (!gl) { return bail('no webgl'); }

    var VERT = 'attribute vec2 a_pos; void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }';

    var FRAG = [
      '#ifdef GL_FRAGMENT_PRECISION_HIGH',
      'precision highp float;',
      '#else',
      'precision mediump float;',
      '#endif',
      'uniform vec2  u_res;',
      'uniform float u_time;',
      'uniform sampler2D u_video;',
      'uniform float u_hasVideo;',
      '',
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float noise(vec2 p){',
      '  vec2 i = floor(p), f = fract(p);',
      '  float a = hash(i), b = hash(i + vec2(1.0,0.0)), c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));',
      '  vec2 u = f*f*(3.0-2.0*f);',
      '  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);',
      '}',
      'vec3 starfield(vec2 uv){',
      '  float n = noise(uv * 140.0);',
      '  float s = smoothstep(0.92, 1.0, n);',
      '  return vec3(0.55, 0.78, 1.0) * s;',
      '}',
      '',
      'void main(){',
      '  vec2 frag = gl_FragCoord.xy;',
      '  vec2 uv = frag / u_res;',
      '  float aspect = u_res.x / u_res.y;',
      '  vec2 c = vec2(0.5, 0.54);',          // hole slightly above centre
      '  vec2 p = uv - c; p.x *= aspect;',
      '  float r = length(p);',
      '  vec2 dir = (r > 0.0001) ? p / r : vec2(0.0);',
      '',
      // --- glitch driver (occasional VHS bursts) ---
      '  float gt = fract(u_time * 0.07);',
      '  float burst = step(gt, 0.05);',
      '  float band = step(0.55, noise(vec2(floor(uv.y * 90.0), floor(u_time * 16.0))));',
      '  float glitch = burst * band;',
      '',
      // --- lensed, swirling sample of the gameplay clip ---
      '  float ang = u_time * 0.13 + 0.80 / (r + 0.13);',
      '  float ca = cos(ang), sa = sin(ang);',
      '  vec2 sp = mat2(ca, -sa, sa, ca) * p;',
      '  sp *= (1.0 - 0.11 / (r + 0.30));',   // contract toward hole = lensing
      '  vec2 vuv = vec2(sp.x / aspect, sp.y) + c;',
      '  float chro = 0.0035 + glitch * 0.03;',
      '  vec3 bg;',
      '  if (u_hasVideo > 0.5) {',
      '    bg = vec3(',
      '      texture2D(u_video, vuv + dir * chro).r,',
      '      texture2D(u_video, vuv).g,',
      '      texture2D(u_video, vuv - dir * chro).b);',
      '    bg *= 0.30;',                       // keep backdrop dark
      '  } else {',
      '    bg = starfield(vuv) * 0.6;',
      '  }',
      '',
      // --- accretion ring + core + event horizon ---
      '  vec3 cyan  = vec3(0.30, 0.90, 1.00);',
      '  vec3 white = vec3(0.92, 0.99, 1.00);',
      '  float orad = 0.30;',
      '  float oring = exp(-pow((r - orad) / 0.012, 2.0));',
      '  float oglow = exp(-pow((r - orad) / 0.055, 2.0)) * 0.6;',
      '  float core  = exp(-pow(r / 0.10, 2.0));',
      '  vec3 coreCol = mix(vec3(1.0,0.45,0.78), vec3(0.62,0.28,1.0), smoothstep(0.0,0.12,r));',
      '  coreCol = mix(white, coreCol, smoothstep(0.0,0.045,r));',
      '  float hole = smoothstep(0.032, 0.020, r);',
      '',
      '  vec3 col = bg;',
      '  col += coreCol * core * 1.1;',
      '  col += white * oring + cyan * oglow;',
      '  col = mix(col, vec3(0.0), hole);',
      '  col *= smoothstep(1.15, 0.12, r);',  // vignette into page bg
      '',
      // glitch + faint scanlines
      '  col += cyan * glitch * 0.15;',
      '  col *= 1.0 - 0.22 * glitch;',
      '  col *= 0.95 + 0.05 * sin(frag.y * 1.5 + u_time * 2.0);',
      '',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        dbg.shaderError = gl.getShaderInfoLog(s);
        gl.deleteShader(s); return null;
      }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT);
    var fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) { return bail('shader compile failed'); }

    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      dbg.linkError = gl.getProgramInfoLog(prog); return bail('link failed');
    }
    gl.useProgram(prog);

    // fullscreen triangle
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uHasVideo = gl.getUniformLocation(prog, 'u_hasVideo');
    var uVideo = gl.getUniformLocation(prog, 'u_video');

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // 1px placeholder so the sampler is always valid
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([8, 6, 18]));
    gl.uniform1i(uVideo, 0);

    var hasVideo = false;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = canvas.clientWidth || hero.clientWidth;
      var h = canvas.clientHeight || hero.clientHeight;
      var cw = Math.floor(w * dpr), ch = Math.floor(h * dpr);
      var maxSide = 1920;
      var longest = Math.max(cw, ch);
      if (longest > maxSide) { var k = maxSide / longest; cw = Math.floor(cw * k); ch = Math.floor(ch * k); }
      cw = Math.max(1, cw); ch = Math.max(1, ch);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw; canvas.height = ch; gl.viewport(0, 0, cw, ch);
      }
    }

    function render(tMs) {
      resize();
      if (video && video.readyState >= 2) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); hasVideo = true; }
        catch (e) { hasVideo = false; }
      }
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, tMs * 0.001);
      gl.uniform1f(uHasVideo, hasVideo ? 1.0 : 0.0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ---- run / pause lifecycle ----
    var running = false, raf = 0, inView = true, visible = true;
    function loop(t) { if (!running) { return; } render(t); raf = window.requestAnimationFrame(loop); }
    function update() {
      var should = inView && visible;
      if (should && !running) { running = true; raf = window.requestAnimationFrame(loop); }
      else if (!should && running) { running = false; if (raf) { window.cancelAnimationFrame(raf); } }
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { inView = es[0].isIntersecting; update(); }, { threshold: 0.01 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { visible = !document.hidden; update(); });
    window.addEventListener('resize', resize);

    // graceful degradation if the GPU drops the context
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); running = false; document.body.classList.remove('shader-on');
    }, false);

    document.body.classList.add('shader-on');
    dbg.mounted = true;
    dbg.tick = function (t) { render(t || 16); }; // debug: drive one frame
    update();
    return true;
  }

  function ready(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
  }
  ready(function () { try { init(); } catch (e) { dbg.reason = 'exception: ' + e; } });
})();

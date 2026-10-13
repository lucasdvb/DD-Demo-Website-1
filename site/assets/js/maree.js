/* ==========================================================================
   MARÉE — motion runtime
   · Loader → gate → staggered reveal (GetLayers reveal choreography)
   · Lenis smooth scroll (one clock), parallax plates, scroll-lit manifesto
   · Header hide/solid, mobile menu
   · Lagoon band: GetLayers gradient "Mere" (WebGL2), tinted to the house
     palette through CONFIG only — the shader itself is untouched.
   Everything is progressive: without JS the page renders fully visible.
   ========================================================================== */

const html = document.documentElement
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
html.classList.add('mr-js')

function onReady(fn) {
  if (document.readyState !== 'loading') fn()
  else document.addEventListener('DOMContentLoaded', fn, { once: true })
}

async function init() {
  const page = document.querySelector('.mr-page')
  if (!page) return

  /* ---------- smooth scroll (optional dependency) ---------- */
  let lenis = null
  if (!reduceMotion) {
    try {
      const mod = await import('lenis')
      const Lenis = mod.default || mod.Lenis
      lenis = new Lenis({ duration: 1.25, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true })
    } catch (e) { lenis = null }
  }
  const scrollY = () => (lenis ? lenis.scroll : window.scrollY)

  /* ---------- split text: words inside line masks ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/)
    el.setAttribute('aria-label', el.textContent.trim())
    el.innerHTML = words.map((w, i) => `<span class="mr-w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ')
  })

  /* ---------- scroll-lit manifesto ---------- */
  const lit = []
  document.querySelectorAll('[data-scrolllit]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/)
    el.innerHTML = words.map(w => `<span class="mr-lw">${w}</span>`).join(' ')
    lit.push({ el, spans: [...el.querySelectorAll('.mr-lw')], last: -1 })
  })

  /* ---------- loader + gate ---------- */
  const loader = document.querySelector('.mr-loader')
  const MIN_VISIBLE = reduceMotion ? 300 : 1500
  const HARD_CAP = 4200
  const t0 = performance.now()
  const lock = on => { document.body.classList.toggle('mr-locked', on); if (lenis) on ? lenis.stop() : lenis.start() }

  const heroImg = document.querySelector('.mr-hero__media img')
  const assetsReady = Promise.all([
    heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
    document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve()
  ])
  const capped = new Promise(r => setTimeout(r, HARD_CAP))

  if (loader) lock(true)
  Promise.race([assetsReady, capped]).then(() => {
    const wait = Math.max(0, MIN_VISIBLE - (performance.now() - t0))
    setTimeout(openGate, wait)
  })

  function openGate() {
    // the gate flips at the START of the curtain's exit, so content rises through it
    html.classList.add('mr-ready')
    document.querySelectorAll('[data-gated]').forEach(el => { el.style.setProperty('--base', '260ms'); el.classList.add('is-in') })
    setTimeout(() => { html.classList.add('mr-done'); lock(false) }, reduceMotion ? 100 : 1250)
  }

  /* ---------- viewport reveals (once) ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return
      e.target.classList.add('is-in')
      io.unobserve(e.target)
    })
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
  document.querySelectorAll('[data-reveal], [data-split]:not([data-gated]), .mr-wordmark').forEach(el => io.observe(el))

  /* ---------- header: solid after hero lip, hide on the way down ---------- */
  const header = document.querySelector('.mr-header')
  let lastY = 0

  /* ---------- parallax plates ---------- */
  const plates = [...document.querySelectorAll('[data-parallax]')].map(img => ({ img, k: parseFloat(img.dataset.parallax) || 0.1 }))

  function frame() {
    const y = scrollY()
    const vh = window.innerHeight

    if (header) {
      header.classList.toggle('is-solid', y > 60)
      const menuOpen = html.classList.contains('mr-menu-open')
      if (!menuOpen) header.classList.toggle('is-hidden', y > 420 && y > lastY + 2)
      if (y < lastY - 2) header.classList.remove('is-hidden')
      lastY = y
    }

    if (!reduceMotion) {
      for (const p of plates) {
        const r = p.img.parentElement.getBoundingClientRect()
        if (r.bottom < -100 || r.top > vh + 100) continue
        const off = (r.top + r.height / 2 - vh / 2) * -p.k
        const max = r.height * 0.09
        p.img.style.transform = `translate3d(0, ${Math.max(-max, Math.min(max, off))}px, 0)`
      }
    }

    for (const L of lit) {
      const r = L.el.getBoundingClientRect()
      const start = vh * 0.88, end = vh * 0.3
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)))
      const n = reduceMotion ? L.spans.length : Math.round(p * L.spans.length)
      if (n !== L.last) {
        L.spans.forEach((s, i) => s.classList.toggle('is-lit', i < n))
        L.last = n
      }
    }
  }

  if (lenis) {
    lenis.on('scroll', frame)
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
  } else {
    window.addEventListener('scroll', () => requestAnimationFrame(frame), { passive: true })
  }
  window.addEventListener('resize', frame, { passive: true })
  frame()

  /* ---------- anchors through the scroll clock ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href')
      const target = id.length > 1 ? document.querySelector(id) : document.body
      if (!target) return
      e.preventDefault()
      closeMenu()
      if (lenis) lenis.scrollTo(target, { offset: id === '#top' ? 0 : -60, duration: 1.6 })
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' })
    })
  })

  /* ---------- mobile menu ---------- */
  const burger = document.querySelector('.mr-burger')
  function closeMenu() {
    if (!html.classList.contains('mr-menu-open')) return
    html.classList.remove('mr-menu-open')
    burger && burger.setAttribute('aria-expanded', 'false')
    lock(false)
  }
  burger && burger.addEventListener('click', () => {
    const open = !html.classList.contains('mr-menu-open')
    html.classList.toggle('mr-menu-open', open)
    burger.setAttribute('aria-expanded', String(open))
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    lock(open)
  })
  window.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu() })

  /* ---------- newsletter (standalone only; Instatic forms post themselves) ---------- */
  const form = document.querySelector('.mr-news__form')
  if (form && !form.hasAttribute('data-instatic-form-id')) {
    form.addEventListener('submit', e => {
      e.preventDefault()
      const btn = form.querySelector('button')
      if (btn) btn.textContent = 'Thank you'
    })
  }

  /* ---------- lagoon band ---------- */
  document.querySelectorAll('[data-lagoon]').forEach(mountLagoon)
}

/* ==========================================================================
   GetLayers · gradient "Mere" — five directional waves summed in closed form
   plus a pointer swell. Source: getlayers.ai/?layer=mere (contract: skin
   mutable, motion preserved). Only CONFIG colours are changed (tint).
   ========================================================================== */
const MERE_CONFIG = {
  // tint → house palette (night ground, umber, taupe-panel, lagoon slate, bone)
  bgColor: '#0e0c0b', colorA: '#211e1c', colorB: '#4b443c', colorC: '#8f9a93', colorD: '#edecea',
  // motion + field: the asset's own defaults, untouched
  scale: 0.20, speed: 0.33, angle: -1.71, freq: 6, freqStep: 2.27, amp: 0.045, ampStep: 0.44, waveSpeed: 2.26,
  relief: 1.65, lightX: 0.44, lightY: 0.06, lightZ: 1.49, ambient: 0.12, diffuse: 0.47, specular: 0.94, gloss: 43.5, sky: 0.23,
  ringFreq: 0.9, ringSpeed: 0.38, contrast: 0.91, midpoint: 0.6, sink: 0.37, glow: 0.31,
  grain: 0, grainAnim: 0, dither: 1.58, vignette: 0.26, cursor: 1,
  pointerRadius: 0.95, pointerStrength: 0.026, pointerSheen: 0.22, parallax: 0.005, maxDpr: 1.0
}

const MERE_VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const MERE_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uAngle, uFreq, uFreqStep, uAmp, uAmpStep, uWaveSpeed;
uniform float uRelief, uLightX, uLightY, uLightZ, uAmbient, uDiffuse, uSpecular, uGloss, uSky;
uniform float uRingFreq, uRingSpeed;
uniform float uContrast, uMidpoint, uSink, uGlow;
uniform float uGrain, uDither, uVignette;
uniform float uPointerRadius, uPointerStrength, uPointerSheen, uParallax;
#define WAVES 5
vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
uniform float uGrainAnim;
float houseGrain(vec2 fc) {
  uvec2 q = uvec2(fc) * uvec2(1597334677u, 3812015801u)
          + uint(floor(iTime * 24.0 * uGrainAnim)) * 2654435769u;
  uint n = q.x ^ q.y; n = n * 1664525u + 1013904223u; n ^= n >> 16u; n *= 2246822519u; n ^= n >> 13u;
  float a = float(n & 0xffffu) / 65535.0;
  n *= 3266489917u; n ^= n >> 16u;
  float b = float(n & 0xffffu) / 65535.0;
  return a + b - 1.0;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 p = (uv - iMouse * uParallax) * uScale;
  float h = 0.0;
  vec2 slope = vec2(0.0);
  for (int i = 0; i < WAVES; i++) {
    float fi = float(i);
    float ang = uAngle + fi * 2.39996;
    vec2 dir = vec2(cos(ang), sin(ang));
    float k = uFreq * pow(uFreqStep, fi);
    float a = uAmp * pow(uAmpStep, fi);
    float ph = dot(p, dir) * k + t * uWaveSpeed * (1.0 + 0.17 * fi);
    h += a * sin(ph);
    slope += dir * (a * k * cos(ph));
  }
  vec2 rv = uv - iMouse;
  float R2 = max(1e-4, uPointerRadius * uPointerRadius);
  float q = dot(rv, rv) / R2;
  float env = exp(-q);
  float ph = q * uRingFreq - t * uRingSpeed;
  h += uPointerStrength * env * cos(ph);
  slope -= uPointerStrength * env * (2.0 * rv / R2) * (cos(ph) + uRingFreq * sin(ph));
  vec3 n = normalize(vec3(-slope * uRelief, 1.0));
  vec3 L = normalize(vec3(uLightX, uLightY, max(0.05, uLightZ)) - vec3(rv * (uPointerSheen * 1.5 * env), 0.0));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float diff = max(dot(n, L), 0.0);
  float spec = pow(max(dot(n, H), 0.0), max(1.0, uGloss));
  float skyv = clamp(0.5 + (uv.y + n.y * 0.6) * 0.9, 0.0, 1.0) * uSky;
  float f = clamp(uAmbient + diff * uDiffuse + spec * uSpecular + skyv, 0.0, 1.0);
  float shade = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(shade);
  col += uColorD * uGlow * pow(shade, 5.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), shade) * 0.90 + 0.10);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`

function mountLagoon(host) {
  const C = MERE_CONFIG
  const canvas = document.createElement('canvas')
  host.appendChild(canvas)
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' })
  if (!gl) { host.style.background = `radial-gradient(120% 90% at 70% 40%, ${C.colorB}, ${C.bgColor})`; return }

  const compile = (type, src) => {
    const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh))
    return sh
  }
  const program = gl.createProgram()
  gl.attachShader(program, compile(gl.VERTEX_SHADER, MERE_VERT))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, MERE_FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
  gl.useProgram(program)
  gl.bindVertexArray(gl.createVertexArray())

  const LOC = {}
  const loc = n => (n in LOC ? LOC[n] : (LOC[n] = gl.getUniformLocation(program, n)))
  const u1f = (n, v) => gl.uniform1f(loc(n), v)
  const u2f = (n, x, y) => gl.uniform2f(loc(n), x, y)
  const hex = h => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] }
  const u3c = (n, h) => { const c = hex(h); gl.uniform3f(loc(n), c[0], c[1], c[2]) }

  u3c('uBg', C.bgColor); u3c('uColorA', C.colorA); u3c('uColorB', C.colorB); u3c('uColorC', C.colorC); u3c('uColorD', C.colorD)
  const map = { uScale: 'scale', uSpeed: 'speed', uAngle: 'angle', uFreq: 'freq', uFreqStep: 'freqStep', uAmp: 'amp', uAmpStep: 'ampStep', uWaveSpeed: 'waveSpeed', uRelief: 'relief', uLightX: 'lightX', uLightY: 'lightY', uLightZ: 'lightZ', uAmbient: 'ambient', uDiffuse: 'diffuse', uSpecular: 'specular', uGloss: 'gloss', uSky: 'sky', uRingFreq: 'ringFreq', uRingSpeed: 'ringSpeed', uContrast: 'contrast', uMidpoint: 'midpoint', uSink: 'sink', uGlow: 'glow', uGrain: 'grain', uGrainAnim: 'grainAnim', uDither: 'dither', uVignette: 'vignette', uPointerRadius: 'pointerRadius', uPointerStrength: 'pointerStrength', uPointerSheen: 'pointerSheen', uParallax: 'parallax' }
  for (const u in map) u1f(u, C[map[u]])

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, C.maxDpr)
    const w = Math.max(1, Math.round(host.clientWidth * dpr))
    const h = Math.max(1, Math.round(host.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h }
    gl.viewport(0, 0, w, h)
    u2f('iResolution', w, h)
  }
  resize()
  new ResizeObserver(resize).observe(host)

  // pointer, measured against the band rather than the window
  const mouse = { x: 0.35, y: 0, ax: 0.35, ay: 0, tx: 0.35, ty: 0 }
  const aim = e => {
    const r = host.getBoundingClientRect()
    const a = r.width / r.height
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * a
    mouse.ty = 0.5 - (e.clientY - r.top) / r.height
  }
  host.parentElement.addEventListener('pointermove', aim, { passive: true })
  host.parentElement.addEventListener('pointerdown', aim, { passive: true })

  let visible = false, prevT = performance.now(), clock = 0
  new IntersectionObserver(es => { visible = es[0].isIntersecting }, { rootMargin: '120px 0px' }).observe(host)

  const draw = () => { u1f('iTime', clock); u2f('iMouse', mouse.x, mouse.y); gl.drawArrays(gl.TRIANGLES, 0, 3) }
  draw()
  canvas.classList.add('is-on')
  if (reduceMotion) return // one still frame: the canvas loop is not covered by CSS, so stop it ourselves

  function frame(now) {
    requestAnimationFrame(frame)
    const raw = now - prevT
    prevT = now
    if (!visible || document.hidden) return
    const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw
    const s = ms > 36.7 ? 2.2 : ms * 0.06
    clock += ms * 0.001
    const kLead = 0.105 * s, kBody = 0.043 * s
    mouse.ax += (mouse.tx - mouse.ax) * kLead
    mouse.ay += (mouse.ty - mouse.ay) * kLead
    mouse.x += (mouse.ax - mouse.x) * kBody
    mouse.y += (mouse.ay - mouse.y) * kBody
    draw()
  }
  requestAnimationFrame(frame)
}

// run last: every const above (shader sources, CONFIG) must exist before init touches them
onReady(init)

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
// Ambient scroll films rendered with Remotion (motion/). Locally they sit next to the page;
// on Instatic they are served from the repository through jsDelivr (see tools/build_instatic.py).
const MOTION_BASE = 'assets/motion/'
const FILMS = [
  { sel: '.mr-intro', film: 'breath', a: 1, cls: 'mr-ambient--contain' },
  { sel: '#experiences', film: 'tide', a: 0.8, cls: 'mr-ambient--top' },
  { sel: '#membership', film: 'motes', a: 0.9 },
  { sel: '.mr-ticker', film: 'tide', a: 0.6 },
  { sel: '.mr-footer', film: 'motes', a: 0.55 }
]
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

  const heroVideo = document.querySelector('.mr-hero__media video')
  const heroImg = document.querySelector('.mr-hero__media img')
  const assetsReady = Promise.all([
    heroVideo ? heroReady(heroVideo) : heroImg && heroImg.decode ? heroImg.decode().catch(() => {}) : Promise.resolve(),
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

  /* ---------- hero scroll-out ---------- */
  const heroInner = document.querySelector('.mr-hero__inner')
  const heroHud = document.querySelector('.mr-hero__hud')
  const heroMedia = document.querySelector('.mr-hero__media')

  /* ---------- scroll films: scroll position picks the frame ---------- */
  const films = mountFilms()

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

    if (!reduceMotion && heroInner) {
      // the hero recedes as you leave it: copy lifts and fades, the film drifts closer
      const k = Math.min(1, Math.max(0, y / (vh * 0.75)))
      heroInner.style.transform = `translate3d(0, ${(-k * 60).toFixed(1)}px, 0)`
      heroInner.style.opacity = String(1 - k * 0.95)
      if (heroHud) heroHud.style.opacity = String(1 - Math.min(1, k * 2))
      if (heroMedia) heroMedia.style.transform = `scale(${(1 + k * 0.08).toFixed(4)})`
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
  document.querySelectorAll('a[href^="#"]:not([href="#book"])').forEach(a => {
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

  /* ---------- booking pop-up (every Book / Reserve / Reservations / Enquire) ---------- */
  setupBooking({ lock, closeMenu })

  /* ---------- pointer spotlight on glass and photographs ---------- */
  let spotRaf = 0, spotEv = null
  document.addEventListener('pointermove', e => {
    spotEv = e
    if (spotRaf) return
    spotRaf = requestAnimationFrame(() => {
      spotRaf = 0
      const el = spotEv.target.closest && spotEv.target.closest('.mr-card, .mr-exp__card, .mr-plate')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${spotEv.clientX - r.left}px`)
      el.style.setProperty('--my', `${spotEv.clientY - r.top}px`)
    })
  }, { passive: true })
}

/* Scroll films: each video is all-intra (every frame a keyframe) so seeking is instant.
   The section's progress through the viewport sets a target time; a damped follower
   eases the playhead toward it, so the film glides with the scroll rather than ticking. */
function mountFilms() {
  const films = []
  for (const cfg of FILMS) {
    const host = document.querySelector(cfg.sel)
    if (!host || host.querySelector(':scope > .mr-ambient')) continue
    host.classList.add('mr-has-ambient')
    const wrap = document.createElement('div')
    wrap.className = `mr-ambient ${cfg.cls || ''}`
    wrap.style.setProperty('--a', cfg.a)
    wrap.setAttribute('aria-hidden', 'true')
    const v = document.createElement('video')
    v.muted = true; v.playsInline = true; v.preload = 'auto'
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '')
    v.innerHTML = `<source src="${MOTION_BASE}${cfg.film}.mp4" type="video/mp4"><source src="${MOTION_BASE}${cfg.film}.webm" type="video/webm">`
    wrap.appendChild(v)
    host.prepend(wrap)
    const f = { host, wrap, v, target: 0, cur: 0, ready: false, visible: false, primed: false }
    v.addEventListener('loadeddata', () => {
      f.ready = true
      if (reduceMotion) v.currentTime = v.duration * 0.5
      wrap.classList.add('is-on')
    }, { once: true })
    films.push(f)
  }
  if (!films.length) return films

  const io = new IntersectionObserver(es => es.forEach(e => {
    const f = films.find(x => x.host === e.target)
    if (!f) return
    f.visible = e.isIntersecting
    // iOS only buffers after a play gesture-free play(); pause straight away
    if (f.visible && !f.primed) { f.primed = true; f.v.play().then(() => f.v.pause()).catch(() => {}) }
  }), { rootMargin: '200px 0px' })
  films.forEach(f => io.observe(f.host))

  if (!reduceMotion) {
    const tick = () => {
      requestAnimationFrame(tick)
      const vh = window.innerHeight
      for (const f of films) {
        if (!f.visible || !f.ready || !f.v.duration) continue
        const r = f.wrap.getBoundingClientRect()
        f.target = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)))
        f.cur += (f.target - f.cur) * 0.12
        const t = f.cur * (f.v.duration - 0.05)
        if (!f.v.seeking && Math.abs(f.v.currentTime - t) > 1 / 45) f.v.currentTime = t
      }
    }
    requestAnimationFrame(tick)
  }
  return films
}

/* hero film: muted inline loop; ready = first frame decoded (or it fails and we move on) */
function heroReady(video) {
  video.muted = true
  video.playsInline = true
  if (reduceMotion) { video.removeAttribute('autoplay'); video.pause() }
  else video.play().catch(() => {})
  return new Promise(resolve => {
    if (video.readyState >= 2) return resolve()
    video.addEventListener('loadeddata', resolve, { once: true })
    video.addEventListener('error', resolve, { once: true })
  }).then(() => video.classList.add('is-ready'))
}

/* ==========================================================================
   GetLayers · gradient "Mere" — five directional waves summed in closed form
   plus a pointer swell. Source: getlayers.ai/?layer=mere (contract: skin
   mutable, motion preserved). Only CONFIG colours are changed (tint).
   ========================================================================== */
const MERE_CONFIG = {
  // tint → house palette (night ground, umber, taupe-panel, lagoon slate, bone)
  bgColor: '#070605', colorA: '#14120f', colorB: '#4b443c', colorC: '#8f9a93', colorD: '#edecea',
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

/* ==========================================================================
   Booking pop-up — calendar, arrival times and a guest form.
   Test only: nothing is sent anywhere; submitting shows a confirmation.
   ========================================================================== */
const RITUALS = [
  ['Basalt Stone Massage', '90 min'],
  ['Bourbon Vanilla Ritual', '75 min'],
  ['Sugarcane & Sea-Salt Polish', '60 min'],
  ['Chamarel Earth Facial', '75 min'],
  ['Ylang-Ylang Aromatherapy', '60 min'],
  ['Ayurvedic Shirodhara', '90 min'],
  ['Lagoon Contrast Circuit', '60 min'],
  ['Salt Bath & Steam', '45 min'],
  ['Lymphatic Drainage', '60 min'],
  ['Sunrise Breathwork', '45 min'],
  ['Sound Bath at Dusk', '50 min'],
  ['Couples Pavilion', '120 min'],
  ['Day Ritual', 'Full day'],
  ['Island Member enquiry', 'Consultation'],
  ['Resident enquiry', 'Consultation']
]
const SLOTS = ['07:00', '08:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00']
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
// a believable, stable pattern of taken slots (same answer for the same day every time)
const taken = (day, slot) => {
  let h = 0
  for (const c of day + slot) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % 4 === 0
}

function setupBooking({ lock, closeMenu }) {
  const today = startOfDay(new Date())
  const lastDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 120)
  const state = { view: new Date(today.getFullYear(), today.getMonth(), 1), date: null, time: null, ritual: RITUALS[0][0], guests: 1 }
  let lastFocus = null

  const root = document.createElement('div')
  root.className = 'mr-book'
  root.setAttribute('aria-hidden', 'true')
  root.innerHTML = `
    <div class="mr-book__scrim" data-close></div>
    <div class="mr-book__panel" role="dialog" aria-modal="true" aria-labelledby="mr-book-title">
      <button class="mr-book__x" type="button" data-close aria-label="Close booking"><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1 1 13" stroke="currentColor" fill="none"/></svg></button>
      <div class="mr-book__view mr-book__view--form">
        <section class="mr-book__cal" aria-label="Choose a date and time">
          <p class="mr-eyebrow">Reservations · Grand Baie</p>
          <h2 class="mr-display mr-book__title" id="mr-book-title">Reserve your ritual</h2>
          <div class="mr-cal">
            <div class="mr-cal__head">
              <button class="mr-cal__nav" type="button" data-month="-1" aria-label="Previous month"><svg viewBox="0 0 8 12" aria-hidden="true"><path d="M7 1 2 6l5 5" fill="none" stroke="currentColor"/></svg></button>
              <span class="mr-cal__month" aria-live="polite"></span>
              <button class="mr-cal__nav" type="button" data-month="1" aria-label="Next month"><svg viewBox="0 0 8 12" aria-hidden="true"><path d="m1 1 5 5-5 5" fill="none" stroke="currentColor"/></svg></button>
            </div>
            <div class="mr-cal__week">${WEEKDAYS.map(d => `<span>${d}</span>`).join('')}</div>
            <div class="mr-cal__grid" role="grid"></div>
          </div>
          <div class="mr-slots">
            <p class="mr-book__label">Arrival time</p>
            <div class="mr-slots__list"><p class="mr-slots__hint">Choose a day to see open times.</p></div>
          </div>
        </section>
        <form class="mr-book__form" novalidate>
          <div class="mr-field">
            <label class="mr-book__label" for="mr-b-ritual">Ritual</label>
            <select id="mr-b-ritual" name="ritual">${RITUALS.map(([n, d]) => `<option value="${n}">${n} · ${d}</option>`).join('')}</select>
          </div>
          <div class="mr-field mr-field--row">
            <span class="mr-book__label" id="mr-b-guests-l">Guests</span>
            <div class="mr-stepper" role="group" aria-labelledby="mr-b-guests-l">
              <button type="button" data-guests="-1" aria-label="Fewer guests">−</button>
              <output class="mr-stepper__val" aria-live="polite">1</output>
              <button type="button" data-guests="1" aria-label="More guests">+</button>
            </div>
          </div>
          <div class="mr-field-pair">
            <div class="mr-field"><label class="mr-book__label" for="mr-b-name">Full name</label><input id="mr-b-name" name="name" autocomplete="name" placeholder="Your name" required></div>
            <div class="mr-field"><label class="mr-book__label" for="mr-b-phone">Phone</label><input id="mr-b-phone" name="phone" type="tel" autocomplete="tel" placeholder="+230"></div>
          </div>
          <div class="mr-field"><label class="mr-book__label" for="mr-b-email">Email</label><input id="mr-b-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required></div>
          <div class="mr-field"><label class="mr-book__label" for="mr-b-notes">Anything we should know?</label><textarea id="mr-b-notes" name="notes" rows="2" placeholder="Pressure, allergies, a celebration…"></textarea></div>
          <div class="mr-summary" aria-live="polite"></div>
          <p class="mr-book__error" role="alert"></p>
          <button class="mr-btn mr-btn--solid mr-book__submit" type="submit">Request reservation</button>
          <p class="mr-book__note">Test booking — nothing is sent or charged.</p>
        </form>
      </div>
      <div class="mr-book__view mr-book__view--done" hidden>
        <svg class="mr-done__mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30"/><path d="M20 33l8 8 16-17"/></svg>
        <p class="mr-eyebrow">Request received</p>
        <h2 class="mr-display mr-book__title">Your ritual is held</h2>
        <p class="mr-done__text"></p>
        <button class="mr-btn mr-btn--ghost" type="button" data-close>Return to Marée</button>
      </div>
    </div>`
  document.body.appendChild(root)

  const $ = s => root.querySelector(s)
  const panel = $('.mr-book__panel')
  const grid = $('.mr-cal__grid')
  const monthEl = $('.mr-cal__month')
  const slotsEl = $('.mr-slots__list')
  const form = $('.mr-book__form')
  const select = $('#mr-b-ritual')
  const guestsOut = $('.mr-stepper__val')
  const summary = $('.mr-summary')
  const error = $('.mr-book__error')
  const viewForm = $('.mr-book__view--form')
  const viewDone = $('.mr-book__view--done')

  function renderMonth() {
    const y = state.view.getFullYear(), m = state.view.getMonth()
    monthEl.textContent = `${MONTHS[m]} ${y}`
    const lead = (new Date(y, m, 1).getDay() + 6) % 7 // Monday-first
    const days = new Date(y, m + 1, 0).getDate()
    let cells = ''
    for (let i = 0; i < lead; i++) cells += '<span class="mr-day mr-day--pad" aria-hidden="true"></span>'
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d)
      const key = iso(date)
      const off = date < today || date > lastDay || SLOTS.every(s => taken(key, s))
      const cls = ['mr-day', key === iso(today) ? 'is-today' : '', key === state.date ? 'is-selected' : ''].join(' ')
      cells += `<button type="button" class="${cls}" data-date="${key}" ${off ? 'disabled' : ''} aria-pressed="${key === state.date}" aria-label="${DAY_NAMES[date.getDay()]} ${d} ${MONTHS[m]}">${d}</button>`
    }
    grid.innerHTML = cells
    $('[data-month="-1"]').disabled = y === today.getFullYear() && m === today.getMonth()
    $('[data-month="1"]').disabled = new Date(y, m + 1, 1) > lastDay
  }

  function renderSlots() {
    if (!state.date) { slotsEl.innerHTML = '<p class="mr-slots__hint">Choose a day to see open times.</p>'; return }
    const now = new Date()
    slotsEl.innerHTML = SLOTS.map(s => {
      const [h, mi] = s.split(':').map(Number)
      const [Y, M, D] = state.date.split('-').map(Number)
      const past = new Date(Y, M - 1, D, h, mi) < now
      const off = past || taken(state.date, s)
      return `<button type="button" class="mr-slot${state.time === s ? ' is-selected' : ''}" data-time="${s}" ${off ? 'disabled' : ''} aria-pressed="${state.time === s}">${s}</button>`
    }).join('')
  }

  function prettyDate() {
    if (!state.date) return null
    const [Y, M, D] = state.date.split('-').map(Number)
    const d = new Date(Y, M - 1, D)
    return `${DAY_NAMES[d.getDay()]} ${D} ${MONTHS[M - 1]}`
  }

  function renderSummary() {
    const dur = (RITUALS.find(r => r[0] === state.ritual) || [])[1]
    const rows = [
      ['Ritual', `${state.ritual}${dur ? ` · ${dur}` : ''}`],
      ['Date', prettyDate() || '—'],
      ['Arrival', state.time || '—'],
      ['Guests', String(state.guests)]
    ]
    summary.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`).join('')
    guestsOut.textContent = state.guests
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('button, [data-close]')
    if (!t) return
    if (t.hasAttribute('data-close')) return close()
    if (t.dataset.month) {
      state.view = new Date(state.view.getFullYear(), state.view.getMonth() + Number(t.dataset.month), 1)
      renderMonth()
    } else if (t.dataset.date) {
      state.date = t.dataset.date
      if (state.time && (taken(state.date, state.time))) state.time = null
      renderMonth(); renderSlots(); renderSummary()
      const first = slotsEl.querySelector('.mr-slot:not([disabled])')
      if (first && !state.time) first.focus({ preventScroll: true })
    } else if (t.dataset.time) {
      state.time = t.dataset.time
      renderSlots(); renderSummary()
    } else if (t.dataset.guests) {
      const max = state.ritual === 'Couples Pavilion' ? 2 : 6
      state.guests = Math.min(max, Math.max(1, state.guests + Number(t.dataset.guests)))
      renderSummary()
    }
  })
  select.addEventListener('change', () => {
    state.ritual = select.value
    if (state.ritual === 'Couples Pavilion') state.guests = 2
    renderSummary()
  })

  form.addEventListener('submit', e => {
    e.preventDefault()
    const missing = []
    if (!state.date) missing.push('a date')
    if (!state.time) missing.push('an arrival time')
    if (!$('#mr-b-name').value.trim()) missing.push('your name')
    if (!/^\S+@\S+\.\S+$/.test($('#mr-b-email').value.trim())) missing.push('a valid email')
    if (missing.length) {
      error.textContent = `Please add ${missing.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`
      return
    }
    error.textContent = ''
    $('.mr-done__text').textContent = `${state.ritual} for ${state.guests} on ${prettyDate()} at ${state.time}. We'll confirm with ${$('#mr-b-email').value.trim()} shortly.`
    viewForm.hidden = true
    viewDone.hidden = false
    root.classList.add('is-done')
    $('.mr-book__view--done .mr-btn').focus({ preventScroll: true })
  })

  function open(ritual) {
    closeMenu()
    lastFocus = document.activeElement
    if (ritual) {
      const match = RITUALS.find(([n]) => n.toLowerCase().startsWith(ritual.toLowerCase()) || ritual.toLowerCase().startsWith(n.toLowerCase().replace(' enquiry', '')))
      if (match) { state.ritual = match[0]; select.value = match[0] }
    }
    if (state.ritual === 'Couples Pavilion') state.guests = Math.max(2, state.guests)
    viewForm.hidden = false
    viewDone.hidden = true
    root.classList.remove('is-done')
    renderMonth(); renderSlots(); renderSummary()
    root.setAttribute('aria-hidden', 'false')
    root.classList.add('is-open')
    lock(true)
    setTimeout(() => { const d = grid.querySelector('button.mr-day:not([disabled])'); (d || panel).focus({ preventScroll: true }) }, 60)
  }

  function close() {
    if (!root.classList.contains('is-open')) return
    root.classList.remove('is-open')
    root.setAttribute('aria-hidden', 'true')
    lock(false)
    if (root.classList.contains('is-done')) {
      // start fresh next time
      form.reset(); Object.assign(state, { date: null, time: null, guests: 1, ritual: RITUALS[0][0] })
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true })
  }

  // focus stays inside the dialog
  root.addEventListener('keydown', e => {
    if (e.key === 'Escape') return close()
    if (e.key !== 'Tab') return
    const f = [...panel.querySelectorAll('button:not([disabled]), input, select, textarea')].filter(el => el.offsetParent !== null)
    if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  })

  // every Book / Reserve / Reservations / Enquire control opens the pop-up
  document.addEventListener('click', e => {
    const trigger = e.target.closest('a[href="#book"], [data-book]')
    if (!trigger || root.contains(trigger)) return
    e.preventDefault()
    const card = trigger.closest('.mr-exp__card, .mr-plate')
    const title = card && card.querySelector('.mr-h3')
    open(trigger.dataset.ritual || (title ? title.textContent.trim() : ''))
  })
}

// run last: every const above (shader sources, CONFIG) must exist before init touches them
onReady(init)

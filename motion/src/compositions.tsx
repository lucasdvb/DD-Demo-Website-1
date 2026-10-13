import React from 'react'
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig, Easing } from 'remotion'

/* Every film is light on black. On the site they sit on the page with
   mix-blend-mode: screen, so the black disappears and only the light remains,
   and the scroll position chooses the frame. */
const BONE = '237, 232, 222'
const SAND = '214, 196, 168'
const ease = Easing.bezier(0.45, 0, 0.55, 1)

/* ---------- Tide: hairlines that settle from swell to stillness ---------- */
export const Tide: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const p = frame / (durationInFrames - 1)
  const lines = 22
  const amp = interpolate(p, [0, 1], [26, 3], { easing: ease })
  const spread = interpolate(p, [0, 1], [0.32, 0.9], { easing: ease })
  const reveal = interpolate(p, [0, 0.35], [0, 1], { extrapolateRight: 'clamp', easing: ease })

  const paths = Array.from({ length: lines }, (_, i) => {
    const t = i / (lines - 1) - 0.5
    const y0 = height / 2 + t * height * spread
    const phase = random(`ph${i}`) * Math.PI * 2 + p * Math.PI * 2 * (0.6 + random(`sp${i}`) * 0.5)
    const k = (Math.PI * 2) / (width * (0.55 + random(`k${i}`) * 0.5))
    const a = amp * (0.5 + random(`a${i}`) * 0.8) * (1 - Math.abs(t) * 0.8)
    let d = ''
    for (let x = -20; x <= width + 20; x += 16) {
      const y = y0 + Math.sin(x * k + phase) * a + Math.sin(x * k * 2.3 + phase * 0.7) * a * 0.25
      d += `${x === -20 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(2)}`
    }
    const centre = 1 - Math.min(1, Math.abs(t) * 2)
    const vis = Math.max(0, Math.min(1, reveal * 1.6 - Math.abs(t) * 1.2))
    const alpha = (0.06 + centre * 0.32) * vis
    return { d, alpha, w: 0.6 + centre * 0.9 }
  })

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="fade" x1="0" x2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.25" stopColor="#fff" stopOpacity="1" />
            <stop offset="0.75" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="m"><rect width={width} height={height} fill="url(#fade)" /></mask>
          <filter id="glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        <g mask="url(#m)">
          <g filter="url(#glow)">
            {paths.map((l, i) => <path key={`g${i}`} d={l.d} fill="none" stroke={`rgba(${SAND},${l.alpha * 0.9})`} strokeWidth={l.w * 3} />)}
          </g>
          {paths.map((l, i) => <path key={i} d={l.d} fill="none" stroke={`rgba(${BONE},${l.alpha})`} strokeWidth={l.w} />)}
        </g>
      </svg>
    </AbsoluteFill>
  )
}

/* ---------- Breath: concentric rings that inhale and exhale once ---------- */
export const Breath: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const p = frame / (durationInFrames - 1)
  // inhale 0→0.5, exhale 0.5→1 — one slow breath across the section
  const breath = p < 0.5 ? ease(p / 0.5) : 1 - ease((p - 0.5) / 0.5)
  const cx = width / 2, cy = height / 2
  const base = Math.min(width, height) * 0.1
  const rings = 9
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <svg width={width} height={height}>
        <defs>
          <radialGradient id="orb">
            <stop offset="0" stopColor={`rgba(${SAND},${0.32 + breath * 0.3})`} />
            <stop offset="0.45" stopColor={`rgba(${SAND},${0.08 + breath * 0.08})`} />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={base * (2.2 + breath * 1.6)} fill="url(#orb)" />
        {Array.from({ length: rings }, (_, i) => {
          const f = i / rings
          const r = base * (1 + f * (3.2 + breath * 2.4)) + breath * base * 0.6
          const alpha = (0.24 - f * 0.2) * (0.55 + breath * 0.45)
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={`rgba(${BONE},${alpha})`} strokeWidth={1} />
        })}
      </svg>
    </AbsoluteFill>
  )
}

/* ---------- Motes: warm specks rising like steam over still water ---------- */
export const Motes: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const p = frame / (durationInFrames - 1)
  const count = 90
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <svg width={width} height={height}>
        <defs>
          <radialGradient id="mote">
            <stop offset="0" stopColor={`rgba(${BONE},1)`} />
            <stop offset="0.35" stopColor={`rgba(${SAND},.55)`} />
            <stop offset="1" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
        </defs>
        {Array.from({ length: count }, (_, i) => {
          const depth = random(`d${i}`) // 0 far → 1 near
          const speed = 0.25 + depth * 0.75
          const yStart = random(`y${i}`)
          const travel = (yStart + p * speed) % 1
          const y = height * (1.05 - travel * 1.1)
          const x = width * random(`x${i}`) + Math.sin(p * Math.PI * 2 * (0.4 + random(`w${i}`)) + i) * (12 + depth * 30)
          const r = 1.2 + depth * 5
          const life = Math.sin(travel * Math.PI) // fade in and out along the climb
          const alpha = life * (0.15 + depth * 0.55)
          return <circle key={i} cx={x} cy={y} r={r * 3} fill="url(#mote)" opacity={alpha} />
        })}
      </svg>
    </AbsoluteFill>
  )
}

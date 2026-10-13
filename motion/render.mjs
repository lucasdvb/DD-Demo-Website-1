// Renders every composition with Remotion, then re-encodes each one as all-intra
// H.264 (every frame a keyframe) so the browser can seek to any frame instantly
// while the page scrubs it with the scroll position.
import { execFileSync } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'

const BROWSER = process.env.REMOTION_BROWSER || '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'
const OUT = '../site/assets/motion'
mkdirSync('out', { recursive: true })
mkdirSync(OUT, { recursive: true })

for (const [id, scale] of [['Tide', 0.75], ['Breath', 0.6], ['Motes', 0.75]]) {
  const raw = `out/${id}.mp4`
  execFileSync('npx', ['remotion', 'render', 'src/index.ts', id, raw, `--browser-executable=${BROWSER}`, '--crf=14', '--log=error'], { stdio: 'inherit' })
  const final = `${OUT}/${id.toLowerCase()}.mp4`
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `scale=iw*${scale}:-2,format=yuv420p`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-g', '1', '-tune', 'grain', '-an', '-movflags', '+faststart', final], { stdio: 'inherit' })
  // VP9 twin for Chrome/Firefox (smaller, and playable in open-source Chromium)
  const webm = `${OUT}/${id.toLowerCase()}.webm`
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', raw, '-vf', `scale=iw*${scale}:-2,format=yuv420p`, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '40', '-g', '1', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-an', webm], { stdio: 'inherit' })
  console.log(final, (statSync(final).size / 1024).toFixed(0) + ' KB', webm, (statSync(webm).size / 1024).toFixed(0) + ' KB')
}

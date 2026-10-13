// Local visual QA: serves site/ (tools/serve.js) with /uploads read from a local media mirror,
// then captures desktop + mobile frames at scroll stops.
// usage: node tools/preview.js <outDir> [url]
const fs = require('fs')
const { chromium } = require(process.env.PW_PATH || '/opt/node-tools/node_modules/playwright')

const { createServer } = require('./serve')

function serve() {
  return new Promise(resolve => { const srv = createServer().listen(0, () => resolve(srv)) })
}

;(async () => {
  const out = process.argv[2] || 'shots'
  fs.mkdirSync(out, { recursive: true })
  const srv = process.argv[3] ? null : await serve()
  const base = process.argv[3] || `http://127.0.0.1:${srv.address().port}/`
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
  const logs = []
  for (const [name, vp] of [['desk', { width: 1440, height: 900 }], ['mob', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: name === 'mob', hasTouch: name === 'mob' })
    const page = await ctx.newPage()
    page.on('console', m => logs.push(`[${name}] ${m.type()}: ${m.text()}`))
    page.on('pageerror', e => logs.push(`[${name}] pageerror: ${e.message}`))
    await page.goto(base, { waitUntil: 'networkidle', timeout: 90000 })
    await page.screenshot({ path: `${out}/${name}-00-loader.png` })
    await page.waitForTimeout(3600)
    await page.mouse.move(vp.width * 0.6, vp.height * 0.5)
    const H = await page.evaluate(() => document.documentElement.scrollHeight)
    let i = 1
    for (let y = 0; y < H; y += Math.round(vp.height * 0.9)) {
      await page.evaluate(v => window.scrollTo(0, v), y)
      await page.mouse.wheel(0, 1)
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${out}/${name}-${String(i++).padStart(2, '0')}.png` })
    }
    logs.push(`[${name}] height ${H}, overflowX ${await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)}`)
    await ctx.close()
  }
  await browser.close()
  srv && srv.close()
  fs.writeFileSync(`${out}/log.txt`, logs.join('\n'))
  console.log(logs.join('\n'))
})()

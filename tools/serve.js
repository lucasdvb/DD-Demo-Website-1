// Tiny static server for QA: serves site/, maps /uploads/* to a local media mirror
// (UPLOADS_DIR) and honours Range requests so video seeking works like on a real CDN.
const http = require('http')
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', 'site')
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm' }

function createServer() {
  return http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0])
    const file = url.startsWith('/uploads/')
      ? path.join(process.env.UPLOADS_DIR || 'uploads', path.basename(url))
      : path.join(ROOT, url === '/' ? 'index.html' : url)
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) { res.writeHead(404); res.end(); return }
      const type = TYPES[path.extname(file)] || 'application/octet-stream'
      const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '')
      if (m) {
        const start = m[1] ? Number(m[1]) : 0
        const end = m[2] ? Number(m[2]) : st.size - 1
        res.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 })
        fs.createReadStream(file, { start, end }).pipe(res)
      } else {
        res.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': st.size })
        fs.createReadStream(file).pipe(res)
      }
    })
  })
}

module.exports = { createServer }
if (require.main === module) createServer().listen(Number(process.argv[2]) || 8765)

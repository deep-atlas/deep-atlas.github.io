// A tiny static server for dist/ (no dependencies). Rebuilds on every request for index.html so edits show on reload.
// Usage: node serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url)), DIST = path.join(ROOT, 'dist');
const port = +process.argv[2] || 5173;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

const SHOTS = path.join(ROOT, '.shots');
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // development only: the page can post a PNG of its canvas here (window.__deep.save) to be looked at outside the browser
  if (req.method === 'POST' && p.startsWith('/__shot/')) {
    const name = p.slice(8).replace(/[^\w.-]/g, '_') || 'shot.png', parts = [];
    req.on('data', c => parts.push(c));
    req.on('end', () => { fs.mkdirSync(SHOTS, { recursive: true }); fs.writeFileSync(path.join(SHOTS, name), Buffer.concat(parts)); res.writeHead(200); res.end('ok'); });
    return;
  }
  if (p === '/') p = '/index.html';
  if (p === '/index.html') {
    try { execFileSync(process.execPath, [path.join(ROOT, 'build.mjs')], { stdio: 'pipe' }); }
    catch (e) { res.writeHead(500, { 'content-type': 'text/plain' }); res.end(String(e.stderr || e)); return; }
  }
  const f = path.join(DIST, path.normalize(p));
  if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log(`deepatlas on http://localhost:${port}`));

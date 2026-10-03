// deepatlas build: concatenates src/ into one self-contained page, dist/index.html.
// Usage: node build.mjs   (no dependencies; Node 18+)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src'), DIST = path.join(ROOT, 'dist');
const read = f => fs.readFileSync(path.join(SRC, f), 'utf8');

// scripts load in name order: 00-core opens the bundle's one scope, 99-main closes it
const list = fs.readdirSync(path.join(SRC, 'js')).filter(f => f.endsWith('.js')).sort().map(f => 'js/' + f);
const js = list.map(f => `\n// ---- ${f}\n` + read(f)).join('');
try { new vm.Script(js, { filename: 'deepatlas.js' }); }
catch (e) { console.error('Syntax error in the bundled script:\n' + e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }

// one scope: two top-level functions with one name silently replace each other
{ const seen = new Map(), dup = [];
  for (const f of list) for (const m of read(f).matchAll(/^function\s+([A-Za-z_$][\w$]*)/gm)) { if (seen.has(m[1])) dup.push(`${m[1]} (${seen.get(m[1])} and ${f})`); else seen.set(m[1], f); }
  if (dup.length) { console.error('The same top-level function name twice:\n  ' + dup.join('\n  ')); process.exit(1); } }

const head = read('head.html'), body = read('body.html');
const icon = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#02060c"/><text x="16" y="23" font-family="monospace" font-size="20" font-weight="700" text-anchor="middle" fill="#5ce1ff">~</text></svg>');
const meta = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="An explorable ocean drawn entirely in ASCII: real creatures at their true depths, from the sunlit reef to the floor of the Challenger Deep.">
<meta name="theme-color" content="#02060c">
<meta property="og:type" content="website">
<meta property="og:title" content="deepatlas: the ocean in ASCII">
<meta property="og:description" content="An explorable ocean drawn entirely in characters: 124 real places and creatures at their true depths, from the sunlit reef to the floor of the Challenger Deep.">
<meta property="og:url" content="https://deep-atlas.github.io/">
<meta property="og:image" content="https://deep-atlas.github.io/preview.png">
<meta property="og:image:width" content="960">
<meta property="og:image:height" content="504">
<meta property="og:image:alt" content="An anglerfish drawn in ASCII characters, its lure glowing in the dark">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="data:image/svg+xml,${icon}">
`;
fs.mkdirSync(DIST, { recursive: true });
const html = `<!doctype html>\n<html lang="en">\n<head>\n${meta}${head}\n</head>\n<body>\n${body}\n<script>\n/* deepatlas ${new Date().toISOString().slice(0, 10)} */\n${js}\n</script>\n</body>\n</html>\n`;
fs.writeFileSync(path.join(DIST, 'index.html'), html);
fs.copyFileSync(path.join(SRC, 'preview.png'), path.join(DIST, 'preview.png'));   // (the picture shown when a link to the site is shared)
console.log(`dist/index.html  ${(html.length / 1024).toFixed(0)} KB  (${list.length} scripts)`);

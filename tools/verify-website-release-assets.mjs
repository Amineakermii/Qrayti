import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(process.argv[2] || 'website/site');
const read = (file) => fs.readFileSync(file, 'utf8');
const index = read(path.join(root, 'index.html'));
const app = read(path.join(root, 'assets', 'app.js'));
const sw = read(path.join(root, 'sw.js'));

const references = new Set();
const add = (raw) => {
  if (!raw || /^(?:https?:|data:|mailto:|tel:|#)/i.test(raw) || raw.startsWith('/api/')) return;
  const clean = raw.split('?')[0].replace(/^\.\//, '').replace(/^\//, '');
  if (clean && !clean.endsWith('/')) references.add(clean);
};

for (const match of index.matchAll(/(?:src|href)=["']([^"']+)["']/g)) add(match[1]);
for (const match of app.matchAll(/src:["']([^"']+)["']/g)) add(match[1]);
for (const match of sw.matchAll(/["']\.\/([^"']+)["']/g)) add(match[1]);

const failures = [];
for (const relative of [...references].sort()) {
  const file = path.join(root, ...relative.split('/'));
  if (!fs.existsSync(file)) {
    failures.push(relative + ': missing');
    continue;
  }
  if (/\.(?:js|css|json)$/i.test(relative)) {
    const head = fs.readFileSync(file, 'utf8').slice(0, 80).trimStart().toLowerCase();
    if (head.startsWith('<!doctype html') || head.startsWith('<html')) failures.push(relative + ': contains HTML fallback');
  }
}

const staticIndex = JSON.parse(read(path.join(root, 'admin', 'static-index.json')));
const routesPath = path.join(root, '_routes.json');
const routed = fs.existsSync(routesPath) ? new Set(JSON.parse(read(routesPath)).include || []) : new Set();
const pagesLimit = 25 * 1024 * 1024;
for (const item of staticIndex.items || []) {
  if (!item.path) continue;
  const file = path.join(root, ...item.path.split('/'));
  if (Number(item.size) > pagesLimit) {
    if (fs.existsSync(file)) failures.push(item.path + ': oversized file must be served by R2, not Pages');
    if (!routed.has('/' + item.path)) failures.push(item.path + ': missing R2 function route');
  } else if (!fs.existsSync(file)) failures.push(item.path + ': missing course binary');
  else if (Number.isFinite(item.size) && fs.statSync(file).size !== item.size) failures.push(item.path + ': size mismatch');
}

const listeners = {};
const puts = [];
const cache = { match: async () => undefined, put: async (...args) => { puts.push(args); } };
const context = {
  self: {
    location: { origin: 'https://qrayti.pages.dev' },
    addEventListener: (type, listener) => { listeners[type] = listener; },
    skipWaiting: () => {}
  },
  caches: { open: async () => cache, match: async () => undefined, keys: async () => [], delete: async () => true },
  fetch: async () => new Response('<!doctype html><title>fallback</title>', { status: 200, headers: { 'content-type': 'text/html' } }),
  URL, Request, Response, Promise, setTimeout, clearTimeout, console
};
vm.runInNewContext(sw, context);
let responsePromise;
listeners.fetch({
  request: new Request('https://qrayti.pages.dev/assets/data.js?v=24'),
  respondWith: (promise) => { responsePromise = Promise.resolve(promise); }
});
await responsePromise;
await new Promise((resolve) => setTimeout(resolve, 0));
if (puts.length) failures.push('sw.js: caches HTML fallback as a semester dataset');

if (failures.length) {
  console.error('Website release is incomplete (' + failures.length + ' failures):');
  for (const failure of failures.slice(0, 30)) console.error('- ' + failure);
  if (failures.length > 30) console.error('- ...and ' + (failures.length - 30) + ' more');
  process.exit(1);
}

console.log('Website release check passed (' + references.size + ' shell files, ' + staticIndex.items.length + ' course files, safe dataset cache).');

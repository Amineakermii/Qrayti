import {readFile, writeFile, mkdir, lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

export function validateEntry(entry) {
  if (!entry || typeof entry.path !== 'string' ||
      !/^content\/[^\\:%?#\x00-\x1f]+$/.test(entry.path) ||
      entry.path.split('/').some(part => !part || part === '.' || part === '..') ||
      !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > 25 * 1024 * 1024 ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)) throw Error('Invalid content manifest entry');
  return entry;
}
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function safeTarget(root, entry) {
  validateEntry(entry);
  let cursor = resolve(root);
  for (const part of ['', ...entry.path.split('/')]) {
    cursor = part ? join(cursor, part) : cursor;
    try {
      if ((await lstat(cursor)).isSymbolicLink()) throw Error(`Symlink not allowed: ${entry.path}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return cursor;
}
async function matches(file, entry) {
  const bytes = await readFile(file);
  if (bytes.length !== entry.size || digest(bytes) !== entry.sha256)
    throw Error(`Content integrity mismatch: ${entry.path}`);
}
export async function verifyFiles(root, entries) {
  for (const entry of entries) {
    const target = await safeTarget(root, entry);
    try { await matches(target, entry); }
    catch (error) {
      if (error.code === 'ENOENT') throw Error(`Missing course asset: ${entry.path}`);
      throw error;
    }
  }
}
export async function restoreFile(root, entry, fetcher = fetch) {
  const target = await safeTarget(root, entry);
  try { await matches(target, entry); return; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const url = 'https://qrayti.tn/' + entry.path.split('/').map(encodeURIComponent).join('/');
  const response = await fetcher(url, {redirect:'error', signal:AbortSignal.timeout(60000)});
  if (!response.ok || !response.body) throw Error(`Download failed (${response.status}): ${entry.path}`);
  const reader = response.body.getReader(), chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > entry.size) throw Error(`Content size mismatch: ${entry.path}`);
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const bytes = Buffer.concat(chunks);
  if (size !== entry.size || digest(bytes) !== entry.sha256)
    throw Error(`Content integrity mismatch: ${entry.path}`);
  await mkdir(dirname(target), {recursive:true});
  await safeTarget(root, entry);
  await writeFile(target, bytes, {flag:'wx'});
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const command = process.argv[2];
    if (!['restore','verify'].includes(command)) throw Error('Usage: node tools/cloud-content.mjs restore|verify [site-directory]');
    const root = resolve(process.argv[3] || fileURLToPath(new URL('../website/site/', import.meta.url)));
    const manifest = JSON.parse(await readFile(new URL('./course-content-manifest.json', import.meta.url), 'utf8'));
    if (!Array.isArray(manifest.files) || !manifest.files.length) throw Error('Empty content manifest');
    manifest.files.forEach(validateEntry);
    if (new Set(manifest.files.map(entry => entry.path)).size !== manifest.files.length) throw Error('Duplicate manifest paths');
    if (command === 'restore') {
      let next = 0, completed = 0;
      await Promise.all(Array.from({length:4}, async () => {
        while (next < manifest.files.length) {
          await restoreFile(root, manifest.files[next++]);
          completed++;
          if (completed % 100 === 0) console.log(`Restored/checked ${completed}/${manifest.files.length}`);
        }
      }));
    }
    await verifyFiles(root, manifest.files);
    console.log(`Verified ${manifest.files.length} course assets. R2-backed files remain remote.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

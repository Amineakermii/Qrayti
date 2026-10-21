const LARGE_FILES = new Set([
  'lcef10311.pdf',
  'y1s2f0090.pdf'
]);

function requestedKey(request) {
  const url = new URL(request.url);
  const prefix = '/content/';
  if (!url.pathname.startsWith(prefix)) return '';
  try { return decodeURIComponent(url.pathname.slice(prefix.length)); }
  catch { return url.pathname.slice(prefix.length); }
}

function baseHeaders(object) {
  const headers = new Headers();
  if (object?.writeHttpMetadata) object.writeHttpMetadata(headers);
  headers.set('Content-Type', headers.get('Content-Type') || 'application/pdf');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  if (object?.httpEtag) headers.set('ETag', object.httpEtag);
  return headers;
}

export async function onRequest(context) {
  const { request, env } = context;
  const key = requestedKey(request);
  if (!LARGE_FILES.has(key)) return context.next();
  if (!env.COURSE_FILES) return new Response('R2 binding missing', { status: 503 });

  if (request.method === 'HEAD') {
    const head = await env.COURSE_FILES.head(key);
    if (!head) return new Response('Not found', { status: 404 });
    const headers = baseHeaders(head);
    headers.set('Content-Length', String(head.size));
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const object = await env.COURSE_FILES.get(key, {
    onlyIf: request.headers,
    range: request.headers
  });
  if (!object) return new Response('Not found', { status: 404 });

  const headers = baseHeaders(object);
  if (!('body' in object)) return new Response(null, { status: 412, headers });

  let status = 200;
  if (object.range && Number.isFinite(object.range.offset) && Number.isFinite(object.range.length)) {
    const start = object.range.offset;
    const end = start + object.range.length - 1;
    headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
    headers.set('Content-Length', String(object.range.length));
    status = 206;
  } else {
    headers.set('Content-Length', String(object.size));
  }
  return new Response(object.body, { status, headers });
}

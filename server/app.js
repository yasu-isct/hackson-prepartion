import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { ApiError, generateLevel, loadConfig } from './gemini.js';

const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/game-core.js', ['game-core.js', 'text/javascript; charset=utf-8']]
]);
async function readJson(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new ApiError('CONTENT_TYPE', '请发送 application/json。', 415);
  let raw = '';
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 4096) throw new ApiError('BODY_TOO_LARGE', '请求内容过大。', 413);
    raw += chunk.toString();
  }
  try { return JSON.parse(raw); } catch { throw new ApiError('INVALID_JSON', '请求不是有效的 JSON。', 400); }
}
export function createApp({ config = loadConfig(), fetchFn = fetch } = {}) {
  let active = 0;
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'");
    res.setHeader('Cache-Control', 'no-store');
    const json = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && path === '/api/health') return json(200, { ok: true, mode: config.mode, model: config.model, keyConfigured: Boolean(config.apiKey) });
      if (req.method === 'POST' && path === '/api/level') {
        const origin = req.headers.origin;
        if (origin && origin !== `http://${req.headers.host}`) throw new ApiError('INVALID_ORIGIN', '请求来源不受支持。', 403);
        if (active >= 3) throw new ApiError('SERVER_BUSY', '出题请求较多，请稍后再试。', 429);
        active++;
        try { return json(200, await generateLevel(await readJson(req), config, fetchFn)); }
        finally { active--; }
      }
      if (req.method === 'GET' && assets.has(path)) {
        const [file, mime] = assets.get(path);
        const body = await readFile(new URL(`../public/${file}`, import.meta.url));
        res.writeHead(200, { 'Content-Type': mime }); return res.end(body);
      }
      json(404, { error: { code: 'NOT_FOUND', message: '页面或接口不存在。' } });
    } catch (error) {
      json(error instanceof ApiError ? error.status : 500, { error: { code: error instanceof ApiError ? error.code : 'INTERNAL_ERROR', message: error instanceof ApiError ? error.message : '服务器暂时不可用。' } });
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  return server;
}

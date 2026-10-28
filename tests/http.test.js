import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/gemini.js';
let server, base;
before(async () => {
  server = createApp({ config: loadConfig({}) });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const post = (body, headers = {}) => fetch(`${base}/api/level`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
test('serves the page and all browser modules with correct MIME', async () => {
  for (const [path, mime] of [['/', 'text/html'], ['/style.css', 'text/css'], ['/app.js', 'text/javascript'], ['/game-core.js', 'text/javascript']]) {
    const response = await fetch(`${base}${path}`); assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').includes(mime));
    assert.ok(response.headers.get('content-security-policy').includes("script-src 'self'"));
  }
});
test('health exposes configuration state but no secrets', async () => {
  const data = await (await fetch(`${base}/api/health`)).json();
  assert.deepEqual(data, { ok: true, mode: 'mock', model: 'gemini-3.8-flash', keyConfigured: false });
});
test('POST level follows public response contract', async () => {
  const response = await post(JSON.stringify({ theme: 'ocean', difficulty: 'easy' }));
  assert.equal(response.status, 200); const data = await response.json();
  assert.equal(data.source, 'mock'); assert.equal(data.level.durationSec, 45); assert.equal(data.level.words.length, 8);
});
test('invalid request and malformed JSON produce 400', async () => {
  assert.equal((await post('{}')).status, 400);
  const response = await post('{'); assert.equal(response.status, 400); assert.equal((await response.json()).error.code, 'INVALID_JSON');
});
test('oversized JSON produces 413', async () => { assert.equal((await post(JSON.stringify({ padding: 'x'.repeat(5000) }))).status, 413); });
test('unsupported content type produces 415', async () => { assert.equal((await post('{}', { 'Content-Type': 'text/plain' })).status, 415); });
test('cross-origin POST is rejected', async () => { assert.equal((await post('{}', { Origin: 'https://example.com' })).status, 403); });
test('static allowlist blocks credentials, source, traversal and unsupported methods', async () => {
  for (const path of ['/.env', '/.git/config', '/server/gemini.js', '/%2e%2e/.env', '/missing']) assert.equal((await fetch(`${base}${path}`)).status, 404);
  assert.equal((await fetch(`${base}/api/level`)).status, 404);
});
test('strict live errors use stable status and safe payload', async () => {
  const live = createApp({ config: { ...loadConfig({}), mode: 'live', fallback: false } });
  await new Promise(resolve => live.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${live.address().port}/api/level`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: 'space', difficulty: 'normal' }) });
    assert.equal(response.status, 503); assert.equal((await response.json()).error.code, 'MISSING_API_KEY');
  } finally { await new Promise(resolve => live.close(resolve)); }
});

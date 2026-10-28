import test from 'node:test';
import assert from 'node:assert/strict';
import { generateLevel, mockLevel, parseRequest, validateLevel, loadConfig } from '../server/gemini.js';
const input = { theme: 'space', difficulty: 'normal' };
const level = mockLevel(input);
const config = { mode: 'live', model: 'test-model', timeoutMs: 1000, apiKey: 'test-secret', fallback: false };
const envelope = data => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }] });
const success = data => async () => new Response(JSON.stringify(envelope(data)));
test('all nine Mock combinations validate and never access the network', async () => {
  for (const theme of ['space', 'ocean', 'forest']) for (const difficulty of ['easy', 'normal', 'hard']) {
    const result = await generateLevel({ theme, difficulty }, { mode: 'mock' }, () => { throw new Error('must not fetch'); });
    assert.equal(result.source, 'mock'); assert.equal(result.level.difficulty, difficulty); validateLevel(result.level);
  }
});
test('rejects unknown fields, invalid themes, missing values and nonobjects', () => {
  for (const bad of [null, [], 'space', {}, { ...input, theme: 'invalid' }, { ...input, difficulty: 'x' }, { ...input, prompt: 'injection' }]) {
    assert.throws(() => parseRequest(bad), { code: 'INVALID_REQUEST' });
  }
});
test('JSON schema rejects duplicate, unsafe, oversized and incomplete data', () => {
  for (const bad of [null, {}, { ...level, title: '' }, { ...level, extra: true }, { ...level, durationSec: 999 }, { ...level, words: ['a'] },
    { ...level, words: Array(8).fill('star') }, { ...level, words: ['<script>', ...level.words.slice(1)] }, { ...level, difficulty: 'hard' }]) {
    assert.throws(() => validateLevel(bad, 'normal'), { code: 'INVALID_MODEL_JSON' });
  }
});
test('live success validates JSON and sends a header key and schema', async () => {
  const result = await generateLevel(input, config, async (url, options) => {
    assert.ok(url.endsWith('/test-model:generateContent')); assert.ok(!url.includes(config.apiKey));
    assert.equal(options.headers['x-goog-api-key'], config.apiKey);
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.responseFormat.text.mimeType, 'APPLICATION_JSON');
    assert.equal(body.generationConfig.responseFormat.text.schema.type, 'object');
    return success(level)();
  });
  assert.equal(result.source, 'gemini'); assert.deepEqual(result.level, level);
});
for (const [status, code] of [[401, 'UPSTREAM_AUTH'], [403, 'UPSTREAM_AUTH'], [429, 'UPSTREAM_RATE_LIMIT'], [500, 'UPSTREAM_HTTP'], [404, 'UPSTREAM_HTTP']]) {
  test(`handles HTTP ${status} without leaking upstream text`, async () => {
    await assert.rejects(generateLevel(input, config, async () => new Response('test-secret', { status })), error => error.code === code && !error.message.includes('test-secret'));
  });
}
test('missing API key is explicit and does not fetch', async () => {
  await assert.rejects(generateLevel(input, { ...config, apiKey: '' }, () => { throw new Error('must not fetch'); }), { code: 'MISSING_API_KEY' });
});
test('network failure is sanitized', async () => {
  await assert.rejects(generateLevel(input, config, async () => { throw new Error('test-secret'); }), { code: 'UPSTREAM_NETWORK', message: '无法连接 Gemini 服务。' });
});
test('timeout aborts request even if injected transport never resolves', async () => {
  let signal;
  await assert.rejects(generateLevel(input, { ...config, timeoutMs: 20 }, (_, options) => { signal = options.signal; return new Promise(() => {}); }), { code: 'UPSTREAM_TIMEOUT' });
  assert.equal(signal.aborted, true);
});
test('rejects malformed provider JSON', async () => {
  await assert.rejects(generateLevel(input, config, async () => new Response('not json')), { code: 'INVALID_UPSTREAM_JSON' });
});
test('rejects fenced JSON, missing fields and difficulty mismatch', async () => {
  const fenced = { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '```json\n{}\n```' }] } }] };
  await assert.rejects(generateLevel(input, config, async () => new Response(JSON.stringify(fenced))), { code: 'INVALID_MODEL_JSON' });
  for (const invalid of [{}, { ...level, difficulty: 'hard' }]) await assert.rejects(generateLevel(input, config, success(invalid)), { code: 'INVALID_MODEL_JSON' });
});
for (const reason of ['SAFETY', 'MAX_TOKENS', undefined]) test(`rejects blocked or incomplete response: ${reason}`, async () => {
  const body = envelope(level); body.candidates[0].finishReason = reason;
  await assert.rejects(generateLevel(input, config, async () => new Response(JSON.stringify(body))), { code: 'UPSTREAM_BLOCKED' });
});
test('fallback is visible, valid and sanitizes errors', async () => {
  const result = await generateLevel(input, { ...config, fallback: true }, async () => { throw new Error('test-secret'); });
  assert.equal(result.source, 'fallback'); assert.equal(result.warning.code, 'UPSTREAM_NETWORK');
  assert.ok(!JSON.stringify(result).includes('test-secret')); validateLevel(result.level);
});
test('invalid requests never silently fallback', async () => {
  await assert.rejects(generateLevel({}, { ...config, fallback: true }), { code: 'INVALID_REQUEST' });
});
test('config defaults to mock and validates operational settings', () => {
  assert.equal(loadConfig({}).mode, 'mock');
  for (const bad of [{ GEMINI_MODE: 'auto' }, { GEMINI_MODEL: '../secret' }, { GEMINI_TIMEOUT_MS: 'NaN' }, { GEMINI_TIMEOUT_MS: '0' }, { GEMINI_FALLBACK: 'yes' }]) assert.throws(() => loadConfig(bad));
});

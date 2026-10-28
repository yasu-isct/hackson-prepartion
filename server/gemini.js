import Ajv from 'ajv';
import { readFileSync } from 'node:fs';

export const levelSchema = JSON.parse(readFileSync(new URL('../shared/level.schema.json', import.meta.url)));
const validate = new Ajv({ allErrors: true }).compile(levelSchema);
export class ApiError extends Error {
  constructor(code, message, status = 502) { super(message); this.code = code; this.status = status; }
}
export function validateLevel(level, difficulty) {
  if (!validate(level) || (difficulty && level.difficulty !== difficulty)) {
    throw new ApiError('INVALID_MODEL_JSON', 'AI 返回的关卡格式不符合约定。');
  }
  return level;
}
export function parseRequest(input) {
  if (!input || Array.isArray(input) || typeof input !== 'object' ||
      Object.keys(input).some(key => !['theme', 'difficulty'].includes(key)) ||
      !['space', 'ocean', 'forest'].includes(input.theme) ||
      !['easy', 'normal', 'hard'].includes(input.difficulty)) {
    throw new ApiError('INVALID_REQUEST', '请选择有效的主题与难度。', 400);
  }
  return input;
}
const dictionaries = {
  space: ['star', 'moon', 'orbit', 'comet', 'solar', 'nova', 'planet', 'rocket', 'cosmic', 'galaxy', 'asteroid', 'universe'],
  ocean: ['wave', 'fish', 'reef', 'tide', 'coral', 'shell', 'pearl', 'whale', 'dolphin', 'current', 'seaweed', 'seahorse'],
  forest: ['tree', 'leaf', 'fern', 'moss', 'pine', 'bird', 'root', 'bloom', 'canopy', 'badger', 'squirrel', 'woodland']
};
export function mockLevel({ theme, difficulty }) {
  const words = [...dictionaries[theme]].sort((a, b) => difficulty === 'hard' ? b.length - a.length : a.length - b.length).slice(0, 8);
  return validateLevel({ title: { space: '星际信号', ocean: '深海回声', forest: '森林密语' }[theme], difficulty,
    durationSec: { easy: 45, normal: 30, hard: 20 }[difficulty], words }, difficulty);
}
export function loadConfig(env = process.env) {
  const mode = env.GEMINI_MODE || 'mock';
  const timeoutMs = Number(env.GEMINI_TIMEOUT_MS || 10000);
  const model = env.GEMINI_MODEL || 'gemini-3.8-flash';
  if (!['mock', 'live'].includes(mode) || !Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 60000 ||
      !/^[a-zA-Z0-9._-]+$/.test(model) || (env.GEMINI_FALLBACK && !['true', 'false'].includes(env.GEMINI_FALLBACK))) {
    throw new Error('Gemini 配置无效：检查模式、模型、超时和 fallback。');
  }
  return { mode, timeoutMs, model, apiKey: env.GEMINI_API_KEY || '', fallback: env.GEMINI_FALLBACK !== 'false' };
}
async function liveLevel(request, config, fetchFn) {
  if (!config.apiKey) throw new ApiError('MISSING_API_KEY', '尚未配置 Gemini API 密钥。', 503);
  // JSON Schema is sent upstream AND validated locally. Never trust generated text.
  const { $schema, ...responseJsonSchema } = levelSchema;
  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => { controller.abort(); reject(new ApiError('UPSTREAM_TIMEOUT', 'AI 请求超时，请重试。', 504)); }, config.timeoutMs);
  });
  try {
    return await Promise.race([(async () => {
      const response = await fetchFn(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`, {
        method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': config.apiKey },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Generate a typing-game level. Theme: ${request.theme}. Difficulty must be ${request.difficulty}. Give 8 unique lowercase English words of 2-12 letters, a short Chinese title, durationSec ${ { easy: 45, normal: 30, hard: 20 }[request.difficulty] }. Output only the JSON object.` }] }],
          generationConfig: { responseFormat: { text: { mimeType: 'APPLICATION_JSON', schema: responseJsonSchema } }, temperature: 0.7 }
        })
      });
      if (!response.ok) {
        if ([401, 403].includes(response.status)) throw new ApiError('UPSTREAM_AUTH', 'Gemini 密钥无效或没有权限。', 503);
        if (response.status === 429) throw new ApiError('UPSTREAM_RATE_LIMIT', 'Gemini 配额不足或请求过快。', 503);
        throw new ApiError('UPSTREAM_HTTP', 'Gemini 服务暂时不可用。');
      }
      let envelope;
      try { envelope = await response.json(); } catch { throw new ApiError('INVALID_UPSTREAM_JSON', 'AI 服务返回了无效 JSON。'); }
      const candidate = envelope.candidates?.[0];
      if (envelope.promptFeedback?.blockReason || candidate?.finishReason !== 'STOP') {
        throw new ApiError('UPSTREAM_BLOCKED', 'AI 未能完整生成关卡。');
      }
      const raw = candidate.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join('');
      let level;
      try { level = JSON.parse(raw); } catch { throw new ApiError('INVALID_MODEL_JSON', 'AI 返回了无效的关卡 JSON。'); }
      return validateLevel(level, request.difficulty);
    })(), timeout]);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('UPSTREAM_NETWORK', '无法连接 Gemini 服务。');
  } finally { clearTimeout(timer); }
}
export async function generateLevel(input, config = loadConfig(), fetchFn = fetch) {
  const request = parseRequest(input);
  if (config.mode === 'mock') return { level: mockLevel(request), source: 'mock', warning: null };
  try { return { level: await liveLevel(request, config, fetchFn), source: 'gemini', warning: null }; }
  catch (error) {
    if (!config.fallback) throw error;
    return { level: mockLevel(request), source: 'fallback', warning: { code: error.code, message: `${error.message} 已切换到离线关卡。` } };
  }
}

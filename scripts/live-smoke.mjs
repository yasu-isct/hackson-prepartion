import { generateLevel, loadConfig } from '../server/gemini.js';
if (!process.env.GEMINI_API_KEY) {
  console.error('SKIPPED: 请在 .env 中配置 GEMINI_API_KEY；未发送请求。');
  process.exitCode = 1;
} else {
  try {
    const result = await generateLevel({ theme: 'space', difficulty: 'normal' }, { ...loadConfig(), mode: 'live', fallback: false });
    console.log(`PASS: Gemini real API returned a validated level (${result.level.words.length} words).`);
  } catch (error) { console.error(`FAIL: ${error.code || 'CONFIG'} — ${error.message}`); process.exitCode = 1; }
}

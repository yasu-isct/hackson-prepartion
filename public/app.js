import { createGame, tick, submitWord, secondsLeft } from './game-core.js';
const $ = id => document.getElementById(id);
let game = null;
let ticker;
let controller;
let loadId = 0;
function setStatus(text) { $('status').textContent = text; }
function render() {
  if (!game) return;
  const now = performance.now();
  game = tick(game, now);
  const playing = game.status === 'playing';
  $('score').textContent = String(game.score).padStart(3, '0');
  $('timer').textContent = `${secondsLeft(game, now)}s`;
  $('progress').textContent = `${game.index} / ${game.words.length}`;
  $('word').textContent = playing ? game.words[game.index] : game.status === 'won' ? 'COMPLETE!' : 'TIME UP';
  $('signal-label').textContent = playing ? `SIGNAL ${String(game.index + 1).padStart(2, '0')}` : 'MISSION REPORT';
  $('hint').textContent = playing ? '输入单词并按 Enter · 大小写均可' : `${game.score} 分 · ${game.mistakes} 次输入错误`;
  $('word-input').disabled = !playing;
  $('submit').disabled = !playing;
  if (!playing) { clearInterval(ticker); $('start').textContent = '再来一局 ↗'; setStatus(game.status === 'won' ? '任务完成！所有信号已成功接收。' : '时间到！可以再试一次。'); }
}
$('word-form').addEventListener('submit', event => {
  event.preventDefault();
  if (!game) return;
  const previous = game;
  game = submitWord(game, $('word-input').value, performance.now());
  if (game.index > previous.index) { $('word-input').value = ''; setStatus('信号接收成功，继续！'); }
  else if (game.mistakes > previous.mistakes) { setStatus('单词不匹配，再试一下。'); $('word-input').select(); }
  render();
});
async function start() {
  const currentId = ++loadId;
  controller?.abort();
  controller = new AbortController();
  clearInterval(ticker);
  game = null;
  $('word-input').value = '';
  $('word-input').disabled = true;
  $('submit').disabled = true;
  $('start').disabled = true;
  $('start').textContent = '接收信号中…';
  $('word').textContent = 'LOADING';
  $('signal-label').textContent = 'CONNECTING';
  setStatus('正在准备你的下一场任务…');
  const timeout = setTimeout(() => controller.abort(), 65000);
  try {
    const response = await fetch('/api/level', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: $('theme').value, difficulty: $('difficulty').value }), signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || '关卡加载失败。');
    if (currentId !== loadId) return;
    game = createGame(data.level, performance.now());
    $('source').textContent = { mock: '离线关卡', gemini: 'GEMINI AI', fallback: '离线回退' }[data.source];
    $('level-title').textContent = data.level.title;
    setStatus(data.warning?.message || '任务已开始，输入第一个单词吧！');
    $('start').textContent = '重新开始 ↗';
    render();
    $('word-input').focus();
    ticker = setInterval(render, 100);
  } catch (error) {
    if (currentId !== loadId) return;
    $('word').textContent = 'RETRY';
    $('hint').textContent = '点击开始任务重试';
    $('start').textContent = '重试任务 ↗';
    setStatus(error.name === 'AbortError' ? '请求超时，请重试。' : error.message);
  } finally { clearTimeout(timeout); if (currentId === loadId) $('start').disabled = false; }
}
$('start').addEventListener('click', start);
fetch('/api/health').then(response => response.json()).then(data => {
  if (!game && !controller) $('source').textContent = data.mode === 'live' ? 'GEMINI AI' : '离线关卡';
}).catch(() => { if (!game && !controller) $('source').textContent = '连接不可用'; });
document.addEventListener('visibilitychange', () => { if (game) render(); });

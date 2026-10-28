import { initialState, act, observation, legalActions, applyDecision } from './game.js';
const $ = id => document.getElementById(id);
let state = initialState();
let pending = null;
function cancelAI() { pending?.abort(); pending = null; }
function render() {
  $('state').textContent = `剩余回合：${state.turnsLeft} · ${ { playing: '进行中', won: '成功！', lost: '回合用尽，请重开' }[state.status] }`;
  $('board').replaceChildren();
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) {
    const cell = document.createElement('div');
    const isPlayer = state.player[0] === x && state.player[1] === y;
    const isGoal = state.goal[0] === x && state.goal[1] === y;
    cell.className = `cell ${isPlayer ? 'player' : isGoal ? 'goal' : x === 1 && y === 1 ? 'wall' : ''}`;
    cell.textContent = isPlayer ? '你' : isGoal ? '终点' : x === 1 && y === 1 ? '墙' : '·';
    $('board').append(cell);
  }
  for (const button of document.querySelectorAll('[data-action]')) button.disabled = !legalActions(state).includes(button.dataset.action);
  $('ai').disabled = Boolean(pending) || state.status !== 'playing';
  $('view').textContent = JSON.stringify(observation(state), null, 2);
}
for (const button of document.querySelectorAll('[data-action]')) button.addEventListener('click', () => {
  cancelAI(); state = act(state, button.dataset.action); $('message').textContent = '玩家行动已执行。'; render();
});
$('restart').addEventListener('click', () => {
  cancelAI(); state = initialState(state.revision + 1); $('message').textContent = '新的一局，旧 AI 响应将被丢弃。'; render();
});
$('ai').addEventListener('click', async () => {
  const controller = new AbortController(); pending = controller;
  const revision = state.revision;
  const timer = setTimeout(() => controller.abort(), 35000);
  $('message').textContent = 'AI 决策中…你仍可自己行动或重新开始。'; render();
  try {
    const response = await fetch('/api/decision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(observation(state)), signal: controller.signal });
    if (!response.ok) throw new Error('AI 接口不可用，你仍然可以手动行动。');
    const data = await response.json();
    if (pending !== controller || state.revision !== revision) return;
    const next = applyDecision(state, data.decision, revision);
    if (next === state) throw new Error('AI 行动无效，已忽略。');
    state = next;
    $('message').textContent = `${data.source} · ${data.decision.reason} ${data.warning?.message || ''}`;
  } catch (error) {
    if (pending === controller) $('message').textContent = error.name === 'AbortError' ? 'AI 超时，仍可手动操作或重试。' : error.message;
  } finally {
    clearTimeout(timer);
    if (pending === controller) { pending = null; render(); }
  }
});
render();

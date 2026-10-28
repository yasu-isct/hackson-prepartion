export const MOVES = Object.freeze({ up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] });
const WALL = [1, 1];
export function initialState(revision = 0) {
  return { player: [0, 0], goal: [2, 2], turnsLeft: 8, status: 'playing', revision };
}
export function legalActions(state) {
  if (state.status !== 'playing') return [];
  return Object.entries(MOVES).filter(([, [dx, dy]]) => {
    const x = state.player[0] + dx, y = state.player[1] + dy;
    return x >= 0 && x < 3 && y >= 0 && y < 3 && !(x === WALL[0] && y === WALL[1]);
  }).map(([name]) => name);
}
export function act(state, action) {
  if (!legalActions(state).includes(action)) return state;
  const [dx, dy] = MOVES[action];
  const player = [state.player[0] + dx, state.player[1] + dy];
  const turnsLeft = state.turnsLeft - 1;
  const won = player.every((value, i) => value === state.goal[i]);
  return { ...state, player, turnsLeft, status: won ? 'won' : turnsLeft === 0 ? 'lost' : 'playing', revision: state.revision + 1 };
}
export function observation(state) {
  return { player: [...state.player], goal: [...state.goal], turnsLeft: state.turnsLeft, legalActions: legalActions(state) };
}
export function applyDecision(state, decision, expectedRevision) {
  return state.revision === expectedRevision && decision && legalActions(state).includes(decision.action) ? act(state, decision.action) : state;
}

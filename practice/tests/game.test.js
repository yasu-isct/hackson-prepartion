import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, legalActions, act, observation, applyDecision } from '../public/game.js';
test('input updates state, preserves previous state and blocks walls', () => {
  const start = initialState(); const next = act(start, 'right');
  assert.deepEqual(start.player, [0, 0]); assert.deepEqual(next.player, [1, 0]);
  assert.equal(next.turnsLeft, 7); assert.equal(act(next, 'down'), next);
  assert.equal(act(start, 'up'), start); assert.equal(act(start, 'invented'), start);
});
test('success, terminal states and restart are deterministic', () => {
  let state = initialState();
  for (const move of ['right', 'right', 'down', 'down']) state = act(state, move);
  assert.equal(state.status, 'won'); assert.equal(act(state, 'up'), state);
  const reset = initialState(state.revision + 1); assert.equal(reset.turnsLeft, 8); assert.deepEqual(reset.player, [0, 0]);
});
test('eight legal moves without reaching goal lose the game', () => {
  let state = initialState(); for (let i = 0; i < 4; i++) { state = act(state, 'right'); state = act(state, 'left'); }
  assert.equal(state.status, 'lost'); assert.deepEqual(legalActions(state), []);
});
test('winning on the last turn takes precedence over loss', () => {
  const state = { ...initialState(), player: [2, 1], turnsLeft: 1 };
  assert.equal(act(state, 'down').status, 'won');
});
test('observation is a limited copy and stale AI cannot modify a restarted game', () => {
  const old = initialState(); const view = observation(old);
  assert.deepEqual(Object.keys(view).sort(), ['goal', 'legalActions', 'player', 'turnsLeft']);
  view.player[0] = 2; assert.deepEqual(old.player, [0, 0]);
  const fresh = initialState(old.revision + 1);
  assert.equal(applyDecision(fresh, { action: 'right' }, old.revision), fresh);
  assert.equal(applyDecision(old, { action: 'up' }, old.revision), old);
  assert.deepEqual(applyDecision(old, { action: 'right' }, old.revision).player, [1, 0]);
});

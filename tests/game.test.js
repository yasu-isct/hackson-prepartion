import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, submitWord, tick, secondsLeft } from '../public/game-core.js';
const level = { words: ['star', 'moon'], durationSec: 30 };
test('starts a new game without mutating level', () => {
  const game = createGame(level, 1000);
  assert.equal(game.deadline, 31000); assert.equal(game.score, 0);
  game.words.push('nova'); assert.equal(level.words.length, 2);
});
test('correct answers normalize case and surrounding spaces', () => {
  const first = createGame(level, 0);
  const next = submitWord(first, ' STAR ', 100);
  assert.equal(next.index, 1); assert.equal(next.score, 100); assert.equal(first.index, 0);
});
test('wrong and empty answers do not advance or award points', () => {
  const game = createGame(level, 0);
  assert.equal(submitWord(game, ' ', 10), game);
  const wrong = submitWord(game, 'wrong', 10);
  assert.equal(wrong.mistakes, 1); assert.equal(wrong.index, 0); assert.equal(wrong.score, 0);
});
test('all words complete the game and further input is ignored', () => {
  let game = createGame(level, 0);
  for (const word of level.words) game = submitWord(game, word, 100);
  assert.equal(game.status, 'won'); assert.equal(game.score, 200);
  assert.equal(submitWord(game, 'moon', 200), game);
});
test('deadline is strict, including a word submitted at exactly the deadline', () => {
  const game = createGame(level, 0);
  assert.equal(submitWord(game, 'star', 29999).score, 100);
  assert.equal(submitWord(game, 'star', 30000).score, 0);
  assert.equal(tick(game, 30000).status, 'timeout');
  assert.equal(secondsLeft(game, 40000), 0);
});
test('restart clears score, progress, mistakes and deadline', () => {
  const old = submitWord(createGame(level, 0), 'star', 10);
  const fresh = createGame(level, 10000);
  assert.equal(old.score, 100); assert.equal(fresh.score, 0);
  assert.equal(fresh.index, 0); assert.equal(fresh.mistakes, 0); assert.equal(fresh.deadline, 40000);
});

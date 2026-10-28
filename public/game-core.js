export function createGame(level, now) {
  return { words: [...level.words], index: 0, score: 0, mistakes: 0, deadline: now + level.durationSec * 1000, status: 'playing' };
}
export function tick(game, now) {
  if (game.status !== 'playing') return game;
  return now >= game.deadline ? { ...game, status: 'timeout' } : game;
}
export function submitWord(game, word, now) {
  const current = tick(game, now);
  if (current.status !== 'playing' || !word.trim()) return current;
  if (word.trim().toLowerCase() !== current.words[current.index]) return { ...current, mistakes: current.mistakes + 1 };
  const index = current.index + 1;
  return { ...current, index, score: current.score + 100, status: index === current.words.length ? 'won' : 'playing' };
}
export function secondsLeft(game, now) { return Math.max(0, Math.ceil((game.deadline - now) / 1000)); }

import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTask, scopeAllows, isSensitive, ensureFresh, assertNoCredential } from '../../scripts/workflow.mjs';
const task = '## Goal\nFix movement\n## Scope\n- practice/\n## Constraints\nNo deps\n## Acceptance Criteria\nWall blocked\n## Validation\nnode --test';
test('five-field tasks parse and incomplete tasks fail', () => {
  assert.deepEqual(parseTask(task).scope, ['practice/']);
  assert.throws(() => parseTask('## Goal\nx'));
  assert.throws(() => parseTask(task.replace('- practice/', '- ../outside/')));
});
test('scope boundaries do not allow similarly named directories', () => {
  assert.equal(scopeAllows('practice/game.js', ['practice/']), true);
  assert.equal(scopeAllows('practice-evil/game.js', ['practice/']), false);
  assert.equal(scopeAllows('package-lock.json', ['package.json']), false);
});
test('credentials and tool state cannot enter review packets', () => {
  for (const path of ['.env', 'practice/.env.local', 'practice\\.env.local', 'C:\\Users\\demo\\.env', '.tools/a.md', '.tools\\a.md', '.codex/auth.json', 'oauth_creds.json', 'key.pem']) assert.equal(isSensitive(path), true, path);
  assert.equal(isSensitive('.env.example'), false);
});
test('failed or stale evidence never authorizes review', () => {
  ensureFresh({ digest: 'a' }, { digest: 'a', status: 'passed' });
  assert.throws(() => ensureFresh({ digest: 'a' }, { digest: 'b', status: 'passed' }));
  assert.throws(() => ensureFresh({ digest: 'a' }, { digest: 'a', status: 'failed' }));
});
test('removed secrets in diffs are refused before model input', () => {
  const fakeKey = 'AIza' + 'X'.repeat(35);
  assert.throws(() => assertNoCredential(`-const removedKey = '${fakeKey}';`));
  assertNoCredential('diff containing ordinary source code');
});

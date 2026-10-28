import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectAgentConfig } from '../../scripts/agent-config.mjs';
test('installed Gemini loads shared/local rules, read-only agent and explicit deny policy', async () => {
  const result = await inspectAgentConfig();
  assert.equal(result.markers.length, 2); assert.equal(result.denied.length, 5);
});

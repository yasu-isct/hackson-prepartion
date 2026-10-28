// Offline verification against the installed Gemini 0.66.0 loader, not our own YAML imitation.
import { readdir, readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
export async function inspectAgentConfig() {
  process.env.GEMINI_CLI_HOME = resolve('.tools/gemini-home');
  const bundle = resolve('node_modules/@google/gemini-cli/bundle');
  const entry = (await readdir(bundle)).find(name => /^core-.*\.js$/.test(name));
  assert.ok(entry, 'Installed Gemini bundle missing');
  const core = await import(pathToFileURL(`${bundle}/${entry}`));
  const paths = await core.getEnvironmentMemoryPaths([resolve('practice')]);
  const memories = await core.readGeminiMdFiles(paths);
  const content = memories.map(memory => memory.content || '').join('\n');
  assert.ok(content.includes('workflow-rules-v1'), 'Shared rule was not imported');
  assert.ok(content.includes('practice-rules-v1'), 'Local rule was not imported');
  const agents = await core.parseAgentMarkdown(resolve('.gemini/agents/qa-reviewer.md'));
  assert.equal(agents[0].name, 'qa-reviewer');
  assert.equal(agents[0].model, 'inherit');
  assert.deepEqual(agents[0].tools, ['read_file', 'list_directory', 'glob', 'grep_search']);
  await mkdir('.tools/empty-policies', { recursive: true });
  const config = await core.createPolicyEngineConfig({ policyPaths: [resolve('.gemini/review-policy.toml')] }, 'plan', resolve('.tools/empty-policies'), false);
  assert.ok(config.rules.some(rule => rule.toolName === '*' && rule.decision === 'deny'), 'Explicit review policy did not load');
  const engine = new core.PolicyEngine(config);
  const denied = [];
  for (const name of ['run_shell_command', 'write_file', 'replace', 'read_file', 'google_web_search']) {
    const result = await engine.check({ name, args: {} });
    assert.equal(result.decision, 'deny', `${name} was not denied`);
    denied.push(name);
  }
  return { memoryPaths: paths, markers: ['workflow-rules-v1', 'practice-rules-v1'], agent: agents[0].name, denied };
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  console.log(JSON.stringify(await inspectAgentConfig(), null, 2));
}

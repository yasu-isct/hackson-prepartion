import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { parse } from 'yaml';
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${item.name}`;
    if (item.isDirectory()) await walk(path);
    else if (/\.(js|mjs)$/.test(path)) files.push(path);
  }
}
for (const dir of ['server', 'public', 'scripts', 'tests']) await walk(dir);
files.push('playwright.config.js');
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(result.status, 0, `${file}: ${result.stderr}`);
}
for (const file of ['package.json', 'shared/level.schema.json', '.gemini/settings.json']) JSON.parse(await readFile(file, 'utf8'));
const raw = await readFile('.gemini/agents/qa-reviewer.md', 'utf8');
const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
assert.ok(frontmatter, 'QA agent needs YAML frontmatter');
const agent = parse(frontmatter[1]);
assert.equal(agent.name, 'qa-reviewer');
assert.equal(agent.kind, 'local');
assert.ok(agent.tools.includes('run_shell_command'));
assert.equal(agent.model, 'inherit');
console.log(`PASS: ${files.length} JavaScript files, JSON and QA agent configuration.`);

import { spawnSync } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
const lab = resolve('.tools', `git-lab-${randomUUID()}`);
await mkdir(lab, { recursive: true });
function git(args, expected = 0) {
  console.log(`git ${args.join(' ')}`);
  const result = spawnSync('git', ['-c', `safe.directory=${lab}`, '-C', lab, ...args], { encoding: 'utf8' });
  if (result.status !== expected) throw new Error(result.stderr || result.stdout || 'Git lab failed');
  return result.stdout;
}
async function commit(text, message) {
  await writeFile(`${lab}/rules.txt`, text); git(['add', 'rules.txt']); git(['commit', '-m', message]);
}
git(['init', '-b', 'main']);
git(['config', '--local', 'user.name', 'Practice Student']);
git(['config', '--local', 'user.email', 'practice@example.invalid']);
git(['config', '--local', 'core.autocrlf', 'false']);
await commit('speed=1\n', 'baseline');
git(['switch', '-c', 'feature']); await commit('speed=2\n', 'feature changes speed');
git(['switch', 'main']); await commit('speed=3\n', 'main changes speed');
git(['merge', 'feature'], 1);
if (!(await readFile(`${lab}/rules.txt`, 'utf8')).includes('<<<<<<<')) throw new Error('Expected a real merge conflict');
console.log('Observed conflict. Resolving with an explicit combined policy.');
await commit('speed=3\nfeature=enabled\n', 'resolve conflict together');
await commit('speed=999\n', 'intentional bad change');
git(['revert', '--no-edit', 'HEAD']);
if (await readFile(`${lab}/rules.txt`, 'utf8') !== 'speed=3\nfeature=enabled\n') throw new Error('Revert did not restore behavior');
console.log(git(['log', '--oneline', '--graph', '--all']));
console.log(`PASS: branch, conflicting merge, resolution and revert. Isolated lab retained at ${lab}`);

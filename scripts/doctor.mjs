import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const commands = [
  ['Node.js', process.execPath, ['--version']],
  ['Git', 'git', ['--version']],
  ['Python', process.platform === 'win32' ? `${root}.venv/Scripts/python.exe` : 'python3', ['--version']],
  ['pip', process.platform === 'win32' ? `${root}.venv/Scripts/python.exe` : 'python3', ['-m', 'pip', '--version']],
  ['Gemini CLI', process.execPath, ['scripts/gemini.mjs', '--version']]
];
for (const [label, cmd, args] of commands) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', timeout: 30000 });
  console.log(`${label}: ${result.status === 0 ? result.stdout.trim() : 'UNAVAILABLE'}`);
  if (result.status !== 0) process.exitCode = 1;
}
console.log(`Local .env: ${existsSync(`${root}.env`) ? 'present (contents hidden)' : 'absent; default Mock mode'}`);
console.log(`Git repository: ${existsSync(`${root}.git`) ? 'ready' : 'not initialized'}`);

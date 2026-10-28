import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const localPython = `${root}.venv/${process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'}`;
const python = process.env.PRACTICE_PYTHON || (existsSync(localPython) ? localPython : process.platform === 'win32' ? 'python' : 'python3');
const commands = {
  start: [python, ['-B', 'practice/server.py']],
  python: [python, ['-B', '-m', 'unittest', 'discover', '-s', 'practice/tests', '-p', 'test_*.py', '-v']],
  syntax: [python, ['-B', '-c', "import ast,pathlib; files=list(pathlib.Path('practice').rglob('*.py')); [ast.parse(p.read_text(encoding='utf-8'), filename=str(p)) for p in files]; print(f'PASS: {len(files)} Python files parsed')"]]
};
const command = commands[process.argv[2]];
if (!command) throw new Error('Usage: node scripts/practice.mjs start|python|syntax');
const child = spawn(command[0], command[1], { cwd: root, stdio: 'inherit', env: process.env });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });

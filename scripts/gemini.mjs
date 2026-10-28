import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const cliHome = fileURLToPath(new URL('../.tools/gemini-home', import.meta.url));
mkdirSync(cliHome, { recursive: true });
// Project-local Gemini user state; no global HOME changes and no credentials in Git.
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/@google/gemini-cli/bundle/gemini.js', import.meta.url)), ...process.argv.slice(2)], {
  cwd: root, stdio: 'inherit', env: { ...process.env, GEMINI_CLI_HOME: cliHome }
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });

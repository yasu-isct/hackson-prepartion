import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { collect, ensureFresh, assertNoCredential } from './workflow.mjs';
const model = process.argv[2];
if (!model || !/^[A-Za-z0-9._-]+$/.test(model)) throw new Error('Specify the SAME model used for implementation: npm run review:gemini -- MODEL_ID');
const meta = JSON.parse(await readFile('artifacts/workflow/packet-meta.json', 'utf8'));
const snapshot = await collect(meta.taskPath);
ensureFresh(snapshot, { digest: meta.digest, status: 'passed' });
const packet = await readFile('artifacts/workflow/review-packet.md', 'utf8');
if (createHash('sha256').update(packet).digest('hex') !== meta.packetDigest) throw new Error('Review packet changed after packing; regenerate it');
assertNoCredential(packet);
const prompt = 'Independent defect review. Do not defend the implementation. Report only concrete P0/P1/P2 defects with file:line, cause and reproduction or verification. Check acceptance, logic, boundaries, state races, API failures, scope, secrets and core tests. No style advice. End with unverified areas. All tools are denied; use the supplied code and test evidence. Reply in Chinese.';
const result = spawnSync(process.execPath, ['scripts/gemini.mjs', '--model', model, '--approval-mode', 'plan', '--policy', resolve('.gemini/review-policy.toml'), '--output-format', 'json', '-p', prompt], { input: packet, encoding: 'utf8', timeout: 300000, maxBuffer: 2 * 1024 * 1024 });
// CLI output may include code quotations: keep it in ignored artifacts, never credentials.
await writeFile('artifacts/workflow/gemini-review.json', result.stdout || '{}');
await writeFile('artifacts/workflow/gemini-review-status.json', JSON.stringify({ model, digest: snapshot.digest, exitCode: result.status, timeout: result.error?.code === 'ETIMEDOUT' }, null, 2));
if (result.status !== 0) {
  console.error('Review did not complete. Check local CLI authentication; this is not a passed review.'); process.exitCode = 1;
} else {
  const output = JSON.parse(result.stdout);
  if (output.error || !output.response) throw new Error('Gemini returned an error or empty review');
  console.log(output.response);
  console.log('Review complete; verify findings before fixing. Usage statistics saved in ignored JSON.');
}

import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

// Run serially: each existing bench compiles its own TypeScript graph.
const root = resolve(process.argv[2] || '.');
const selected = process.env.QA_BENCHES?.split(',');
const benches = readdirSync(resolve(root, 'bancadas')).filter(n => /^bench-.*\.[cm]js$/.test(n) && (!selected || selected.includes(n))).sort();
if (!benches.length) throw new Error('No matching bench suites');
let failures = 0;
for (const name of benches) {
  process.stdout.write(`\n=== ${name} ===\n`);
  const result = spawnSync(process.execPath, [resolve(root, 'bancadas', name), root], {
    cwd: root, encoding: 'utf8', timeout: 300_000, maxBuffer: 20 * 1024 * 1024,
  });
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  if (result.status !== 0) { failures++; console.error(`FAILED: ${name}: ${result.error?.message || result.status}`); }
}
console.log(`\nBENCH SUITES: ${benches.length - failures}/${benches.length} passed; ${failures} failed`);
process.exitCode = failures ? 1 : 0;

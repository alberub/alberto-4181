import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const server = spawn(process.execPath, ['dist/api/apps/api/src/server.js'], {
  env: { ...process.env, PORT: '3002' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', (chunk) => {
  logs += chunk;
});
server.stderr.on('data', (chunk) => {
  logs += chunk;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (server.exitCode !== null) throw new Error(logs);
    try {
      const response = await fetch('http://127.0.0.1:3002/api/health');
      ready = response.ok;
    } catch {}
    if (ready) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready, 'Compiled server did not become ready');
  for (const path of ['/', '/dashboard', '/recargar']) {
    const response = await fetch(`http://127.0.0.1:3002${path}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Snail Club/);
  }
  assert.equal((await fetch('http://127.0.0.1:3002/api/missing')).status, 404);
  console.log('Compiled Express server: health, SPA routes and API 404 passed.');
} finally {
  server.kill('SIGTERM');
}

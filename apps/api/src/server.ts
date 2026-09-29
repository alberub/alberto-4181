import { createApp } from './app.js';
import express from 'express';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
const app = createApp();
const web = resolve('dist/web');
if (existsSync(web)) {
  app.use(express.static(web));
  app.get('/{*path}', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'not_found' });
    res.sendFile(resolve(web, 'index.html'));
  });
}
const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? '127.0.0.1';
app.listen(port, host, () => console.info(`Snail Club API: http://${host}:${port}`));

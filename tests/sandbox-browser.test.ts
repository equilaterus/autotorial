import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import {openBrowser} from '@remotion/renderer';
import {afterAll, describe, expect, it} from 'vitest';

const browserExecutable = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome'].find(existsSync);
const port = 43130;
let vite: ReturnType<typeof spawn> | undefined;

afterAll(() => vite?.kill('SIGTERM'));

describe.skipIf(!browserExecutable)('browser exercise sandbox', () => {
  it('returns feedback instead of timing out on the final exercise', async () => {
    vite = spawn(process.execPath, [path.resolve('node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {stdio: 'ignore'});
    for (let attempt = 0; attempt < 50; attempt++) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/tests/sandbox-browser.html`);
        if (response.ok) break;
      } catch { /* Vite is still starting. */ }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {headless: true}, logLevel: 'error'});
    try {
      const page = await browser.newPage({context: () => null, logLevel: 'error', indent: false, pageIndex: 0, onBrowserLog: null, onLog: () => undefined});
      await page.goto({url: `http://127.0.0.1:${port}/tests/sandbox-browser.html`, timeout: 10_000});
      let state = {status: '', incorrect: '', correct: '', message: ''};
      for (let attempt = 0; attempt < 50; attempt++) {
        state = await page.evaluate(() => ({
          status: document.body.dataset.status ?? '',
          incorrect: document.body.dataset.incorrect ?? '',
          correct: document.body.dataset.correct ?? '',
          message: document.body.textContent?.trim() ?? '',
        }));
        if (state.status !== 'running') break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      expect(state, state.message).toMatchObject({status: 'complete', incorrect: 'false', correct: 'true'});
    } finally {
      await browser.close({silent: true});
    }
  });
});

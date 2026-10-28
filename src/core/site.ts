import path from 'node:path';
import {cp, readFile, writeFile} from 'node:fs/promises';
import {build, createServer, type ViteDevServer} from 'vite';
import react from '@vitejs/plugin-react';
import {outputRoot} from './production';

function config(frameworkRoot: string, hostRoot: string, base: string) {
  return {
    root: path.join(frameworkRoot, 'src', 'web'),
    base,
    publicDir: path.join(outputRoot(hostRoot), 'public'),
    plugins: [react()],
    resolve: {alias: {'@shared': path.join(frameworkRoot, 'src')}},
    build: {
      outDir: path.join(outputRoot(hostRoot), 'site'),
      emptyOutDir: true,
      sourcemap: true,
    },
    server: {fs: {allow: [frameworkRoot, hostRoot]}},
  };
}

/**
 * GitHub Pages lets browsers cache index.html for ten minutes. Stamp every build with an id, publish it in
 * version.json and let the page reload itself once when it finds out it is stale.
 */
async function stampBuild(site: string): Promise<void> {
  const build = Date.now().toString(36);
  await writeFile(path.join(site, 'version.json'), JSON.stringify({build}));
  const file = path.join(site, 'index.html');
  const guard = `<meta name="autotorial-build" content="${build}"><script>(function(){var m=document.querySelector('meta[name=autotorial-build]');if(!m)return;fetch('./version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(v){var k='autotorial-reloaded:'+v.build;if(v.build&&v.build!==m.content){try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){return}location.reload()}}).catch(function(){})})()</script>`;
  let html = (await readFile(file, 'utf8')).replace('</head>', `${guard}</head>`);
  try {
    const course = JSON.parse(await readFile(path.join(site, 'course.json'), 'utf8')) as {title?: string};
    if (course.title) html = html.replace(/<title>[^<]*<\/title>/, `<title>${course.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`);
  } catch { /* no course title: keep the default */ }
  await writeFile(file, html);
}

export async function buildSite(frameworkRoot: string, hostRoot: string, base = './'): Promise<string> {
  await build({...config(frameworkRoot, hostRoot, base), logLevel: 'warn'});
  const root = outputRoot(hostRoot);
  const site = path.join(root, 'site');
  await stampBuild(site);
  try { await cp(path.join(root, 'video'), path.join(site, 'video'), {recursive: true}); } catch { /* MP4 export is optional */ }
  return site;
}

export async function previewSite(frameworkRoot: string, hostRoot: string, port = 4173, open = false): Promise<ViteDevServer> {
  const server = await createServer({...config(frameworkRoot, hostRoot, './'), server: {...config(frameworkRoot, hostRoot, './').server, host: '127.0.0.1', port, strictPort: true, open}});
  await server.listen();
  server.printUrls();
  return server;
}

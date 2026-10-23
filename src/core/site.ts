import path from 'node:path';
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

export async function buildSite(frameworkRoot: string, hostRoot: string, base = './'): Promise<string> {
  await build({...config(frameworkRoot, hostRoot, base), logLevel: 'warn'});
  return path.join(outputRoot(hostRoot), 'site');
}

export async function previewSite(frameworkRoot: string, hostRoot: string, port = 4173, open = false): Promise<ViteDevServer> {
  const server = await createServer({...config(frameworkRoot, hostRoot, './'), server: {...config(frameworkRoot, hostRoot, './').server, host: '127.0.0.1', port, strictPort: true, open}});
  await server.listen();
  server.printUrls();
  return server;
}

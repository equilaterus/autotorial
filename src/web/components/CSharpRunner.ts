import {CSHARP_RUNNER_URL} from '../../core/csharp';

export interface CSharpRunResult {
  success: boolean;
  stdOut: string | null;
  stdErr: string | null;
  diagnostics: Array<{id: string; message: string; severity: string}>;
}

const ORIGIN = new URL(CSHARP_RUNNER_URL).origin;

// The compiler runs on the page's main thread (no worker), so it lives in a disposable sandboxed iframe: when a
// program never ends, the iframe is discarded and the page stays responsive.
const FRAME_SOURCE = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' ${ORIGIN}; connect-src ${ORIGIN}">
<script type="module">
let runner;
addEventListener('message', async (event) => {
  const message = event.data;
  if (message.type === 'init') {
    try {
      const {init} = await import(message.url);
      runner = await init({onProgress: (loaded, total) => parent.postMessage({type: 'progress', loaded, total}, '*')});
      parent.postMessage({type: 'ready'}, '*');
    } catch (error) { parent.postMessage({type: 'init-error', error: String(error && error.message || error)}, '*'); }
  } else if (message.type === 'run') {
    const results = [];
    for (const program of message.programs) {
      try { results.push(await runner.run(program)); }
      catch (error) { results.push({success: false, stdOut: null, stdErr: String(error && error.message || error), diagnostics: []}); }
    }
    parent.postMessage({type: 'result', id: message.id, results}, '*');
  }
});
parent.postMessage({type: 'frame-ready'}, '*');
</script>`;

const INIT_TIMEOUT_MS = 180_000;

class CSharpSession {
  private frame?: HTMLIFrameElement;
  private ready?: Promise<void>;
  private progress?: (loaded: number, total: number) => void;

  private discard() {
    this.frame?.remove();
    this.frame = undefined;
    this.ready = undefined;
  }

  private start(): Promise<void> {
    if (this.ready) return this.ready;
    const frame = document.createElement('iframe');
    frame.sandbox.add('allow-scripts');
    // Not `hidden`, and not off-screen: Chromium throttles hidden or off-screen cross-origin frames and the .NET runtime
    // then times out while it loads the reference assemblies. A tiny, nearly transparent frame inside the viewport is not throttled.
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:4px;height:4px;border:0;opacity:0.01;pointer-events:none';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.srcdoc = FRAME_SOURCE;
    this.frame = frame;
    this.ready = new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => { window.removeEventListener('message', receive); clearTimeout(timer); if (error) { this.discard(); reject(error); } else resolve(); };
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;
        const message = event.data;
        if (message?.type === 'frame-ready') frame.contentWindow?.postMessage({type: 'init', url: CSHARP_RUNNER_URL}, '*');
        else if (message?.type === 'progress') this.progress?.(message.loaded, message.total);
        else if (message?.type === 'ready') finish();
        else if (message?.type === 'init-error') finish(new Error(`No se pudo cargar el compilador de C#: ${message.error}`));
      };
      const timer = window.setTimeout(() => finish(new Error('El compilador de C# tardó demasiado en cargar. Revisa tu conexión e inténtalo de nuevo.')), INIT_TIMEOUT_MS);
      window.addEventListener('message', receive);
    });
    document.body.append(frame);
    return this.ready;
  }

  /** Runs every program in order. `onProgress` reports the first download of the compiler (loaded/total files). */
  async run(programs: string[], onProgress?: (loaded: number, total: number) => void, timeoutMs = 20_000): Promise<CSharpRunResult[]> {
    this.progress = onProgress;
    await this.start();
    this.progress = undefined;
    const frame = this.frame;
    if (!frame) throw new Error('El compilador de C# no está disponible.');
    return new Promise<CSharpRunResult[]>((resolve, reject) => {
      const id = crypto.randomUUID();
      const done = () => { window.removeEventListener('message', receive); clearTimeout(timer); };
      const receive = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow || event.data?.type !== 'result' || event.data.id !== id) return;
        done();
        resolve(event.data.results as CSharpRunResult[]);
      };
      const timer = window.setTimeout(() => {
        done();
        this.discard();
        reject(new Error('El programa tardó demasiado y se detuvo. ¿Hay un bucle que no termina?'));
      }, timeoutMs * Math.max(1, programs.length));
      window.addEventListener('message', receive);
      frame.contentWindow?.postMessage({type: 'run', id, programs}, '*');
    });
  }
}

export const csharpSession = new CSharpSession();

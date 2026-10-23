import type {CodeTest} from '../../core/types';
import type {ExecutionResult} from '../../core/executor';

const FRAME_SOURCE = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' blob:; worker-src blob:; connect-src 'none'">
<script>
addEventListener('message', (event) => {
  const {token, code, tests} = event.data;
  const workerSource = \`
    self.onmessage = (event) => {
      const {token, code, tests} = event.data;
      const output = [];
      const safeConsole = {log: (...args) => output.push(args.map(String).join(' '))};
      try {
        const expressions = tests.map((test) => 'try { const actual=(' + test.expression + '); results.push({name:' + JSON.stringify(test.name) + ', expected:' + JSON.stringify(test.expected) + ', actual, passed:JSON.stringify(actual)===JSON.stringify(' + JSON.stringify(test.expected) + ')}); } catch(error) { results.push({name:' + JSON.stringify(test.name) + ', expected:' + JSON.stringify(test.expected) + ', passed:false, error:String(error && error.message || error)}); }').join('\\n');
        const run = new Function('console', '\"use strict\";\\n' + code + '\\nconst results=[];\\n' + expressions + '\\nreturn results;');
        const results = run(safeConsole);
        postMessage({token, result:{passed:results.every((test) => test.passed), output, tests:results}});
      } catch(error) { postMessage({token, result:{passed:false, output, tests:[], error:String(error && error.message || error)}}); }
    };
  \`;
  const worker = new Worker(URL.createObjectURL(new Blob([workerSource], {type:'text/javascript'})));
  worker.onmessage = (message) => parent.postMessage(message.data, '*');
  worker.postMessage({token, code, tests});
}, {once:true});
</script>`;

export function runInSandbox(code: string, tests: CodeTest[], timeoutMs = 1500): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    const token = crypto.randomUUID();
    const frame = document.createElement('iframe');
    frame.sandbox.add('allow-scripts');
    frame.hidden = true;
    frame.srcdoc = FRAME_SOURCE;
    document.body.append(frame);
    const cleanup = () => { window.removeEventListener('message', receive); frame.remove(); clearTimeout(timer); };
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.token !== token) return;
      cleanup();
      if (event.data.result?.error) reject(new Error(event.data.result.error));
      else resolve(event.data.result as ExecutionResult);
    };
    window.addEventListener('message', receive);
    const timer = window.setTimeout(() => { cleanup(); reject(new Error(`Execution exceeded ${timeoutMs}ms and was terminated`)); }, timeoutMs);
    frame.addEventListener('load', () => frame.contentWindow?.postMessage({token, code, tests}, '*'), {once: true});
  });
}

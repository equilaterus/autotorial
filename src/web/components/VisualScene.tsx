import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {VisualItem, VisualScene as VisualSceneData} from '../../core/types';

const c = {bg: '#141413', panel: '#242421', raised: '#2c2c28', text: '#f0eee6', muted: '#a8a79f', border: '#3a3a36', accent: '#d97757', soft: '#e8a78f', code: '#10100f', ok: '#a8c49a', blue: '#4a90d9'};
const mono = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

/** Progress 0..1 of the scene, and a helper that fades an element in once `at` (0..1) has been reached. */
function useStage() {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const show = (at: number): React.CSSProperties => {
    const t = interpolate(p, [at, at + 0.05], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
    return {opacity: t, transform: `translateY(${(1 - t) * 18}px)`};
  };
  return {p, show};
}

const Title = ({children}: {children: React.ReactNode}) => <h1 style={{fontWeight: 500, letterSpacing: '-.035em', fontSize: 50, margin: '0 0 28px'}}>{children}</h1>;
const spread = (n: number, from = 0.08, to = 0.8) => (i: number) => from + (n <= 1 ? 0 : (i / (n - 1)) * (to - from));

function Timeline({items}: {items: VisualItem[]}) {
  const {show} = useStage();
  const at = spread(items.length);
  return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 30}}>
    {items.map((item, i) => <React.Fragment key={item.label}>
      <div style={{...show(at(i)), width: 230, textAlign: 'center', padding: '34px 16px', borderRadius: 18, background: c.panel, border: `1px solid ${i === items.length - 1 ? c.accent : c.border}`}}>
        <div style={{fontSize: 84}}>{item.icon}</div>
        <div style={{fontSize: 27, marginTop: 14, lineHeight: 1.25}}>{item.label}</div>
        {item.detail && <div style={{fontSize: 19, color: c.muted, marginTop: 8}}>{item.detail}</div>}
      </div>
      {i < items.length - 1 && <span style={{...show(at(i) + 0.03), fontSize: 46, color: c.accent}}>→</span>}
    </React.Fragment>)}
  </div>;
}

function Window({title, children, style}: {title: string; children: React.ReactNode; style?: React.CSSProperties}) {
  return <div style={{background: c.code, border: `1px solid ${c.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 70px #0007', ...style}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: c.panel, borderBottom: `1px solid ${c.border}`}}>
      {['#ef6b5f', '#e5c06a', '#7bc67e'].map((color) => <span key={color} style={{width: 13, height: 13, borderRadius: '50%', background: color}}/>)}
      <span style={{flex: 1, textAlign: 'center', color: c.muted, fontSize: 18}}>{title}</span>
    </div>
    {children}
  </div>;
}

const Cursor = ({x, y, at}: {x: number; y: number; at: number}) => {
  const {p} = useStage();
  const t = interpolate(p, [at - 0.12, at], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <span style={{position: 'absolute', left: x - (1 - t) * 160, top: y + (1 - t) * 120, fontSize: 40, filter: 'drop-shadow(0 4px 6px #000a)', transform: `scale(${p > at && p < at + 0.03 ? 0.85 : 1})`}}>🖱️</span>;
};

function BrowserDownload({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const picked = p > 0.55;
  return <Window title="Descargar Visual Studio Code" style={{position: 'relative'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: c.raised}}>
      <span style={{color: c.muted}}>←  →  ⟳</span>
      <span style={{flex: 1, padding: '8px 18px', borderRadius: 999, background: c.code, fontFamily: mono, fontSize: 22, border: `1px solid ${p > 0.05 ? c.accent : c.border}`}}>🔒 code.visualstudio.com/download</span>
    </div>
    <div style={{padding: '34px 50px 40px', background: '#1a1a1d', minHeight: 360}}>
      <div style={{...show(0.1), fontSize: 40, fontWeight: 600, marginBottom: 8}}>Download Visual Studio Code</div>
      <div style={{...show(0.15), fontSize: 22, color: c.muted, marginBottom: 30}}>Elige el instalador para tu sistema operativo</div>
      <div style={{display: 'flex', gap: 24}}>
        {items.map((item, i) => <div key={item.label} style={{...show(0.2 + i * 0.07), flex: 1, padding: '24px 20px', borderRadius: 12, textAlign: 'center', background: '#0e639c', color: '#fff', outline: picked && i === 0 ? `4px solid ${c.accent}` : 'none'}}>
          <div style={{fontSize: 52}}>{item.icon}</div><div style={{fontSize: 30, fontWeight: 600}}>{item.label}</div><div style={{fontSize: 19, opacity: 0.85, marginTop: 6}}>{item.detail}</div>
        </div>)}
      </div>
      {picked && <div style={{...show(0.55), marginTop: 26, fontSize: 26, color: c.ok}}>⬇️ Descargando… <span style={{color: c.muted}}>(en Linux también puedes usar vscodium.com)</span></div>}
    </div>
    <Cursor x={260} y={330} at={0.5}/>
  </Window>;
}

function Installer({items}: {items: VisualItem[]}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 22}}>
    {items.map((item, col) => <div key={item.label} style={{...show(0.04 + col * 0.2), background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16, padding: 18}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, marginBottom: 10}}><span style={{fontSize: 38}}>{item.icon}</span>{item.label}</div>
      {item.steps?.map((step, i) => {
        const isCommand = step.startsWith('$ ');
        return <div key={step} style={{...show(0.1 + col * 0.2 + i * 0.07), display: 'flex', gap: 12, alignItems: 'center', marginTop: 7, padding: '7px 10px', background: c.raised, borderRadius: 8, fontSize: isCommand ? 16 : 19, fontFamily: isCommand ? mono : undefined, color: isCommand ? c.soft : c.text}}>
          <span style={{flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: c.accent, color: '#201713', fontWeight: 700, fontSize: 17}}>{i + 1}</span><span style={{wordBreak: 'break-word'}}>{step}</span>
        </div>;
      })}
    </div>)}
  </div>;
}

const vs = {title: '#3c3c3c', activity: '#333333', side: '#252526', editor: '#1e1e1e', status: '#007acc', line: '#2b2b2b', text: '#cccccc', dim: '#8b8b8b', blue: '#0e639c', input: '#3c3c3c', claude: '#d97757'};

const Icon = ({d, active}: {d: string; active?: boolean}) => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#858585'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
const ICONS = {
  files: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5',
  search: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21',
  git: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9c0 6-12 3-12 6',
  run: 'M7 4l12 8-12 8zM4 4v16',
  extensions: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM15 13h5M17.5 10.5v5',
};

function VsCode({title, active, side, children, status = 'Listo', modal, toast, spark}: {title: string; active: keyof typeof ICONS; side: React.ReactNode; children: React.ReactNode; status?: string; modal?: React.ReactNode; toast?: React.ReactNode; spark?: React.ReactNode}) {
  return <div style={{position: 'relative', background: vs.editor, border: `1px solid ${c.border}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 24px 70px #0007', color: vs.text, fontFamily: '"Segoe UI", ui-sans-serif, system-ui, sans-serif'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18, padding: '7px 14px', background: vs.title, fontSize: 17}}>
      <span style={{display: 'flex', gap: 7}}>{['#ef6b5f', '#e5c06a', '#7bc67e'].map((color) => <i key={color} style={{width: 12, height: 12, borderRadius: '50%', background: color}}/>)}</span>
      {['Archivo', 'Editar', 'Selección', 'Ver', 'Ir', 'Ejecutar', 'Terminal', 'Ayuda'].map((item) => <span key={item}>{item}</span>)}
      <span style={{flex: 1, textAlign: 'center', color: vs.dim}}>{title}</span>
    </div>
    <div style={{display: 'flex', height: 410}}>
      <div style={{width: 58, background: vs.activity, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6}}>
        {(Object.keys(ICONS) as Array<keyof typeof ICONS>).map((key) => <div key={key} style={{width: 58, height: 52, display: 'grid', placeItems: 'center', borderLeft: `2px solid ${key === active ? '#fff' : 'transparent'}`}}><Icon d={ICONS[key]} active={key === active}/></div>)}
      </div>
      <div style={{width: 330, background: vs.side, padding: '10px 0', overflow: 'hidden'}}>{side}</div>
      <div style={{flex: 1, position: 'relative', minWidth: 0}}>
        <div style={{display: 'flex', alignItems: 'center', height: 36, background: vs.side, fontSize: 16}}>
          <span style={{padding: '0 18px', lineHeight: '36px', background: vs.editor, borderTop: `1px solid ${vs.status}`}}>Bienvenida</span><span style={{flex: 1}}/>{spark}
        </div>
        <div style={{height: 374}}>{children}</div>
      </div>
    </div>
    <div style={{background: vs.status, color: '#fff', fontSize: 15, padding: '3px 14px'}}>{status}</div>
    {modal}{toast}
  </div>;
}

const SideTitle = ({children}: {children: React.ReactNode}) => <div style={{padding: '0 18px 10px', fontSize: 14, letterSpacing: 1, color: vs.dim}}>{children}</div>;
const Spark = ({size = 26, bg = vs.claude}: {size?: number; bg?: string}) => <span style={{display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: size / 4, background: bg, color: '#1a1a1a', fontSize: size * 0.7, fontWeight: 700}}>✺</span>;
const Button = ({children, hot}: {children: React.ReactNode; hot?: boolean}) => <span style={{display: 'inline-block', padding: '7px 18px', borderRadius: 3, background: vs.blue, color: '#fff', fontSize: 17, outline: hot ? `3px solid ${c.accent}` : 'none', outlineOffset: 2}}>{children}</span>;

function Extensions({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const installed = p > 0.45;
  return <VsCode title="Visual Studio Code" active="extensions"
    side={<><SideTitle>EXTENSIONES: MARKETPLACE</SideTitle>
      <div style={{margin: '0 14px 12px', padding: '7px 10px', background: vs.input, borderRadius: 2, fontSize: 17, border: `1px solid ${vs.status}`}}>{p > 0.1 ? 'Claude Code' : <span style={{color: vs.dim}}>Buscar extensiones en Marketplace</span>}</div>
      {items.map((ext, i) => <div key={ext.label} style={{...show(0.12 + i * 0.05), display: 'flex', gap: 10, padding: '9px 14px', background: i === 0 ? '#37373d' : 'transparent'}}>
        <Spark size={44} bg={i === 0 ? vs.claude : '#e6e6e6'}/>
        <div style={{flex: 1, minWidth: 0}}><div style={{fontSize: 18, fontWeight: 600}}>{ext.label}</div><div style={{fontSize: 14, color: vs.dim}}>{ext.detail}</div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}><span style={{fontSize: 14, color: vs.dim}}>{i === 0 ? 'Anthropic ✔' : 'OpenAI ✔'}</span>
            {i === 0 ? <Button hot={!installed && p > 0.3}>{installed ? 'Instalada ✓' : 'Instalar'}</Button> : <Button>Instalar</Button>}</div></div>
      </div>)}</>}
    toast={installed ? <div style={{...show(0.45), position: 'absolute', right: 18, bottom: 40, width: 380, padding: 16, background: '#252526', border: `1px solid ${c.border}`, borderRadius: 6, fontSize: 18, boxShadow: '0 10px 30px #000a'}}>Claude Code se instaló. Inicia sesión para empezar.<div style={{marginTop: 10, display: 'flex', gap: 10}}><Button hot={p > 0.7}>Iniciar sesión</Button></div></div> : undefined}>
    <div style={{height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 30}}>
      <div><div style={{fontSize: 38, color: vs.text, marginBottom: 10}}>Visual Studio Code</div><div style={{fontSize: 20, color: vs.dim}}>Ctrl+Shift+X abre el panel de Extensiones.<br/>Escribe «Claude Code» o «Codex» y pulsa Instalar.</div></div>
    </div>
  </VsCode>;
}

function OpenFolder({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const name = items[0]?.label ?? 'mis-videojuegos';
  const dialog = p > 0.25 && p < 0.62;
  const trust = p >= 0.62 && p < 0.82;
  const opened = p >= 0.82;
  const typed = name.slice(0, Math.max(0, Math.round((p - 0.35) / 0.15 * name.length)));
  const modalFrame = (children: React.ReactNode, w: number) => <div style={{position: 'absolute', inset: 0, background: '#0008', display: 'grid', placeItems: 'center'}}><div style={{width: w, background: '#f3f3f3', color: '#222', borderRadius: 8, boxShadow: '0 20px 60px #000b', overflow: 'hidden', fontSize: 19}}>{children}</div></div>;
  return <VsCode title={opened ? `${name} — Visual Studio Code` : 'Visual Studio Code'} active="files" status={opened ? '' : 'Listo'}
    side={opened ? <><SideTitle>EXPLORADOR</SideTitle><div style={{...show(0.82), padding: '4px 18px', fontSize: 17, fontWeight: 600}}>▾ {name.toUpperCase()}</div><div style={{padding: '4px 34px', color: vs.dim, fontSize: 15}}>La carpeta está vacía</div></>
      : <><SideTitle>EXPLORADOR</SideTitle><div style={{padding: '0 18px', fontSize: 17, color: vs.dim, lineHeight: 1.6}}>Aún no has abierto una carpeta.<div style={{marginTop: 12}}><Button hot={p < 0.25}>Abrir carpeta</Button></div></div></>}
    modal={dialog ? modalFrame(<>
      <div style={{padding: '12px 18px', background: '#e4e4e4', fontWeight: 600}}>Abrir carpeta</div>
      <div style={{padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'center', borderBottom: '1px solid #ddd'}}><span style={{color: '#666'}}>Carpeta:</span><span style={{flex: 1, padding: '5px 10px', background: '#fff', border: '1px solid #ccc'}}>Inicio › Documentos</span>
        <span style={{padding: '6px 12px', border: `2px solid ${p < 0.35 ? c.accent : '#bbb'}`, borderRadius: 4, background: '#fff'}}>📁＋ Nueva carpeta</span></div>
      <div style={{padding: '12px 18px', minHeight: 110}}><div style={{color: '#777'}}>📁 Proyectos</div>{p >= 0.35 && <div style={{marginTop: 8, padding: '4px 8px', background: '#cfe3f7', display: 'inline-block'}}>📁 {typed}<span style={{opacity: 0.6}}>|</span></div>}</div>
      <div style={{padding: '12px 18px', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#ececec'}}><span style={{padding: '6px 18px', border: '1px solid #bbb', borderRadius: 4, background: '#fff'}}>Cancelar</span><span style={{padding: '6px 18px', borderRadius: 4, background: '#0e639c', color: '#fff', outline: p > 0.52 ? `3px solid ${c.accent}` : 'none'}}>Abrir</span></div></>, 620)
      : trust ? modalFrame(<div style={{padding: 26}}><div style={{fontWeight: 600, fontSize: 22, marginBottom: 10}}>¿Confías en los autores de los archivos de esta carpeta?</div><div style={{color: '#555', marginBottom: 18}}>Es tu propia carpeta, así que puedes confiar en ella.</div><div style={{display: 'flex', gap: 12}}><span style={{padding: '8px 18px', borderRadius: 3, background: '#0e639c', color: '#fff', outline: `3px solid ${c.accent}`, outlineOffset: 2}}>Sí, confío en los autores</span><span style={{padding: '8px 18px', border: '1px solid #bbb', borderRadius: 3}}>No, no confío</span></div></div>, 640) : undefined}>
    <div style={{height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center'}}>
      {opened ? <div style={{fontSize: 20, color: vs.dim}}>Carpeta abierta: <b style={{color: vs.text}}>{name}</b></div>
        : <div style={{fontSize: 34}}>Bienvenida<div style={{fontSize: 20, color: vs.dim, marginTop: 10}}>Iniciar · Abrir carpeta…</div></div>}
    </div>
  </VsCode>;
}

function OpenChat({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const name = items[0]?.label ?? 'mis-videojuegos';
  const chat = p > 0.4;
  return <VsCode title={`${name} — Visual Studio Code`} active="files" status=""
    side={<><SideTitle>EXPLORADOR</SideTitle><div style={{padding: '4px 18px', fontSize: 17, fontWeight: 600}}>▾ {name.toUpperCase()}</div></>}
    spark={<span style={{display: 'flex', gap: 10, alignItems: 'center', paddingRight: 14, outline: !chat ? `3px solid ${c.accent}` : 'none', outlineOffset: 2, borderRadius: 6, margin: '0 10px'}}><Spark size={26}/></span>}>
    <div style={{display: 'flex', height: '100%'}}>
      <div style={{flex: 1, display: 'grid', placeItems: 'center', color: vs.dim, fontSize: 19, textAlign: 'center', padding: 18}}>{chat ? '' : <span>Pulsa el icono <b style={{color: vs.claude}}>✺</b> de arriba a la derecha<br/>(en Codex, el de la barra lateral)</span>}</div>
      {chat && <div style={{...show(0.4), width: 400, borderLeft: `1px solid ${vs.line}`, background: vs.side, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 16}}>
        <div><div style={{display: 'flex', gap: 10, alignItems: 'center', fontSize: 20, fontWeight: 600}}><Spark/>Claude Code</div><div style={{fontSize: 17, color: vs.dim, marginTop: 12}}>¿Qué quieres construir hoy?</div></div>
        <div style={{padding: '12px 14px', border: `1px solid ${vs.status}`, borderRadius: 8, background: vs.input, fontSize: 17, color: vs.dim}}>Pídele algo a Claude…  <span style={{float: 'right'}}>⏎</span></div>
      </div>}
    </div>
  </VsCode>;
}

function BrowserPage({items, steps = []}: {items: VisualItem[]; steps?: string[]}) {
  const {p, show} = useStage();
  const url = steps[0] ?? 'una-direccion.com';
  const typed = url.slice(0, Math.round(interpolate(p, [0.05, 0.4], [0, url.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  const entered = p > 0.45;
  return <Window title="Navegador">
    <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: c.raised}}>
      <span style={{color: c.muted}}>←  →  ⟳</span>
      <span style={{flex: 1, padding: '8px 18px', borderRadius: 999, background: c.code, fontFamily: mono, fontSize: 24, border: `1px solid ${entered ? c.ok : c.accent}`}}>🔒 {typed}<span style={{opacity: entered ? 0 : 0.7}}>|</span></span>
    </div>
    <div style={{padding: '30px 50px', background: '#1a1a1d', minHeight: 330}}>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: 22}}>
        {items.map((item, i) => {
          const app = i === items.length - 1;
          return <div key={item.label} style={{...show(0.12 + i * 0.08), padding: '26px 16px', borderRadius: 14, textAlign: 'center', background: app ? '#28211e' : c.panel, border: `1px solid ${app ? c.accent : c.border}`, opacity: app && !entered ? 0.35 : 1}}>
            <div style={{fontSize: 70}}>{item.icon}</div><div style={{fontSize: 26, marginTop: 8}}>{item.label}</div>
          </div>;
        })}
      </div>
      {entered && <div style={{...show(0.45), marginTop: 26, textAlign: 'center', fontSize: 28, color: c.ok}}>Una dirección y ya estás dentro de la aplicación, sin instalar nada</div>}
    </div>
  </Window>;
}

function Stack({items, steps = [], focus = -1}: {items: VisualItem[]; steps?: string[]; focus?: number}) {
  const {show} = useStage();
  const [front, back, data, docker] = items;
  const dim = (i: number): React.CSSProperties => ({opacity: focus < 0 || focus === i ? 1 : 0.45});
  const box = (item: VisualItem, i: number, width: number) => <div style={{...dim(i), width, textAlign: 'center', padding: '24px 14px', borderRadius: 16, background: c.panel, border: `2px solid ${focus === i ? c.accent : c.border}`}}>
    <div style={{fontSize: 64}}>{item.icon}</div><div style={{fontSize: 30, fontWeight: 600, marginTop: 6}}>{item.label}</div><div style={{fontSize: 20, color: c.soft, marginTop: 4}}>{item.detail}</div>
  </div>;
  return <div style={{display: 'grid', gap: 18}}>
    <div style={{...show(0.05), ...dim(3), position: 'relative', padding: '40px 18px 26px', borderRadius: 26, border: `3px dashed ${focus === 3 ? c.accent : c.border}`}}>
      <span style={{position: 'absolute', top: -20, left: 30, padding: '4px 16px', borderRadius: 999, background: c.bg, border: `2px solid ${focus === 3 ? c.accent : c.border}`, fontSize: 24}}>{docker?.icon} {docker?.label}: {focus === 3 ? 'todo dentro de contenedores' : 'contenedores'}</span>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14}}>
        {front && <div style={{...show(0.1)}}>{box(front, 0, 240)}</div>}
        <div style={{...show(0.2), ...dim(1), display: 'grid', gap: 6, width: 210, textAlign: 'center', color: c.muted, fontSize: 18}}>
          {steps.length > 0 ? steps.map((step, i) => <span key={step} style={{...show(0.25 + i * 0.1), padding: '4px 8px', background: c.raised, borderRadius: 8, color: c.text}}>→ {step}</span>) : <span style={{fontSize: 40, color: c.accent}}>⇄</span>}
        </div>
        {back && <div style={{...show(0.15)}}>{box(back, 1, 240)}</div>}
        <span style={{...show(0.3), ...dim(2), fontSize: 40, color: c.accent}}>⇄</span>
        {data && <div style={{...show(0.2)}}>{box(data, 2, 240)}</div>}
      </div>
    </div>
  </div>;
}

function AgentWork({steps = []}: {steps?: string[]}) {
  const {p, show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
    <Window title="Chat del agente">
      <div style={{padding: 22, minHeight: 360, display: 'flex', flexDirection: 'column', gap: 12}}>
        <div style={{alignSelf: 'flex-end', padding: '12px 16px', background: '#28211e', border: `1px solid ${c.accent}`, borderRadius: 12, fontSize: 20}}>Quiero que construyas una biblioteca web de videojuegos…</div>
        {steps.map((step, i) => <div key={step} style={{...show(0.1 + i * (0.7 / Math.max(1, steps.length))), alignSelf: 'flex-start', padding: '10px 14px', background: c.panel, borderRadius: 12, fontSize: 21}}>🤖 {step}</div>)}
      </div>
    </Window>
    <Window title="Terminal">
      <pre style={{margin: 0, padding: 22, minHeight: 360, fontFamily: mono, fontSize: 21, lineHeight: 1.6, color: c.text}}>
        <span style={{color: c.soft}}>$ docker compose up --build</span>{'\n'}
        {p > 0.45 && <span>{'[+] Building backend (ASP.NET Core)…\n'}</span>}
        {p > 0.55 && <span>{'[+] Building frontend (React)…\n'}</span>}
        {p > 0.7 && <span style={{color: c.ok}}>{'✓ SQLite lista\n✓ Aplicación en http://localhost:3000\n'}</span>}
      </pre>
    </Window>
  </div>;
}

const GAMES = [['Commander Keen 4', 1991, '#3a6ea5'], ['Another World', 1991, '#8a4f7d'], ['Prince of Persia', 1989, '#b5793a'], ['Prince of Persia 2', 1993, '#7a5ca8'], ['Super Mario World', 1990, '#4f9d5d'], ['Simon the Sorcerer 2', 1995, '#a8503a']] as const;

function AppPreview({items, checks = []}: {items: VisualItem[]; checks?: string[]}) {
  const {p, show} = useStage();
  const admin = p > 0.55;
  const user = items[admin ? 1 : 0];
  return <div style={{display: 'flex', gap: 30, alignItems: 'flex-start'}}>
    <Window title="Navegador" style={{flex: 1}}>
      <div style={{padding: '8px 16px', background: c.raised, fontFamily: mono, fontSize: 19}}>🔒 localhost:3000</div>
      <div style={{background: '#10202f', padding: 20, minHeight: 440}}>
        <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18}}>
          <span style={{fontSize: 26, fontWeight: 600}}>🎮 Biblioteca</span>
          <span style={{flex: 1, padding: '8px 14px', borderRadius: 6, background: '#1b3349', color: '#7f9bb5', fontSize: 18}}>🔍 Buscar videojuegos…</span>
          <span style={{padding: '8px 14px', borderRadius: 6, background: c.blue, fontSize: 18}}>{user?.icon} {user?.label} · Cambiar usuario</span>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14}}>
          {GAMES.map(([name, year, color], i) => <div key={name} style={{...show(0.04 + i * 0.05), background: '#1b3349', borderRadius: 8, overflow: 'hidden'}}>
            <div style={{height: 92, background: `linear-gradient(135deg, ${color}, #0d1b29)`, display: 'grid', placeItems: 'center', fontSize: 40}}>🕹️</div>
            <div style={{padding: '8px 10px'}}><div style={{fontSize: 18}}>{name}</div><div style={{fontSize: 15, color: '#7f9bb5'}}>{year} · {i % 2 ? '♥ Favorito' : '♡'}</div></div>
          </div>)}
        </div>
        {admin && <div style={{...show(0.55), marginTop: 14, display: 'flex', gap: 10, fontSize: 17}}>{['＋ Agregar', '✎ Editar', '🗑 Eliminar'].map((label) => <span key={label} style={{padding: '6px 12px', borderRadius: 6, background: '#2c4d6b'}}>{label}</span>)}</div>}
      </div>
    </Window>
    {checks.length > 0 && <div style={{width: 380, display: 'grid', gap: 14}}>
      {checks.map((check, i) => { const tip = check.startsWith('💡'); return <div key={check} style={{...show(0.1 + i * 0.17), padding: '16px 18px', background: tip ? '#28211e' : c.panel, border: `1px solid ${tip ? c.accent : c.border}`, borderRadius: 12, fontSize: tip ? 21 : 24, lineHeight: 1.35}}>{tip ? check : <><span style={{color: c.ok, marginRight: 10}}>✓</span>{check}</>}</div>; })}
    </div>}
  </div>;
}

function PromptFlow({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const accepted = p > 0.3;
  const copied = p > 0.55;
  const sent = p > 0.78;
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
    <div style={{padding: 24, background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16}}>
      <div style={{fontSize: 22, color: c.soft, letterSpacing: 2, marginBottom: 12}}>AUTORIZACIÓN</div>
      <div style={{fontSize: 20, color: c.muted, lineHeight: 1.5}}>Este mensaje autoriza al agente a instalar herramientas, incluido Docker.</div>
      <div style={{display: 'flex', gap: 12, alignItems: 'center', margin: '18px 0', fontSize: 24}}>
        <span style={{width: 30, height: 30, borderRadius: 6, border: `2px solid ${accepted ? c.accent : c.muted}`, background: accepted ? c.accent : 'transparent', display: 'grid', placeItems: 'center', color: '#201713', fontWeight: 700}}>{accepted ? '✓' : ''}</span>Acepto
      </div>
      <div style={{display: 'inline-block', padding: '12px 22px', borderRadius: 999, fontSize: 22, fontWeight: 600, background: accepted ? c.text : '#3a3a36', color: accepted ? c.bg : c.muted}}>{copied ? '✓ Prompt copiado' : 'Copiar prompt completo'}</div>
    </div>
    <Window title="Chat del agente">
      <div style={{padding: 22, minHeight: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12}}>
        {sent && <div style={{...show(0.78), alignSelf: 'flex-end', padding: '12px 16px', background: '#28211e', border: `1px solid ${c.accent}`, borderRadius: 12, fontSize: 20, maxWidth: 420}}>Quiero que construyas una biblioteca web de videojuegos…</div>}
        {sent && <div style={{...show(0.86), alignSelf: 'flex-start', padding: '12px 16px', background: c.panel, borderRadius: 12, fontSize: 20}}>🤖 ¡Manos a la obra!</div>}
        <div style={{padding: '12px 16px', border: `1px solid ${c.border}`, borderRadius: 10, color: copied && !sent ? c.text : c.muted, fontSize: 19}}>{copied && !sent ? 'Ctrl+V → pegar el prompt  ⏎ enviar' : 'Escribe tu mensaje…'}</div>
      </div>
    </Window>
    <div style={{gridColumn: '1 / -1', display: 'flex', gap: 30, justifyContent: 'center', fontSize: 24, color: c.muted}}>{items.map((item, i) => <span key={item.label} style={{...show(0.1 + i * 0.1), color: c.text}}>{item.icon} {item.label}</span>)}</div>
  </div>;
}

function Choices({items}: {items: VisualItem[]}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26, marginTop: 20}}>
    {items.map((item, i) => <div key={item.label} style={{...show(0.1 + i * 0.2), padding: 30, borderRadius: 18, background: c.panel, border: `1px solid ${c.border}`}}>
      <div style={{fontSize: 80}}>{item.icon}</div>
      <div style={{fontSize: 32, margin: '10px 0'}}>{item.label}</div>
      <div style={{fontSize: 21, color: c.soft, lineHeight: 1.45}}>«{item.detail}»</div>
    </div>)}
  </div>;
}

export function VisualScene({scene}: {scene: VisualSceneData}) {
  const items = scene.items ?? [];
  const body = scene.visual === 'timeline' ? <Timeline items={items}/>
    : scene.visual === 'browser-download' ? <BrowserDownload items={items}/>
    : scene.visual === 'installer' ? <Installer items={items}/>
    : scene.visual === 'extensions' ? <Extensions items={items}/>
    : scene.visual === 'open-folder' ? <OpenFolder items={items}/>
    : scene.visual === 'open-chat' ? <OpenChat items={items}/>
    : scene.visual === 'browser-page' ? <BrowserPage items={items} steps={scene.steps}/>
    : scene.visual === 'stack' ? <Stack items={items} steps={scene.steps} focus={scene.focus}/>
    : scene.visual === 'agent-work' ? <AgentWork steps={scene.steps}/>
    : scene.visual === 'app-preview' ? <AppPreview items={items} checks={scene.steps}/>
    : scene.visual === 'prompt-flow' ? <PromptFlow items={items}/>
    : <Choices items={items}/>;
  return <AbsoluteFill style={{fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', color: c.text, background: c.bg, padding: '46px 70px', justifyContent: 'center'}}><Title>{scene.title}</Title>{body}</AbsoluteFill>;
}

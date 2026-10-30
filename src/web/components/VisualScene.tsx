import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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

function Timeline({items, plain}: {items: VisualItem[]; plain?: boolean}) {
  const {show} = useStage();
  const at = spread(items.length);
  return <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginTop: 30}}>
    {items.map((item, i) => <React.Fragment key={item.label}>
      <div style={{...show(at(i)), width: 230, textAlign: 'center', padding: '34px 16px', ...(plain ? {} : {borderRadius: 18, background: c.panel, border: `1px solid ${i === items.length - 1 ? c.accent : c.border}`})}}>
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

const Tag = ({children}: {children: React.ReactNode}) => <span style={{display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: c.accent, color: '#201713', fontSize: 24, fontWeight: 700, letterSpacing: 1}}>{children}</span>;

/** Frontend: a mock app in a browser, with each kind of element named on the right. */
/** The parts of a good prompt; the focused one is the one the lesson stresses. */
function PromptAnatomy({items, focus = -1}: {items: VisualItem[]; focus?: number}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gap: 14}}>
    {items.map((item, i) => {
      const hot = i === focus;
      return <div key={item.label} style={{...show(0.06 + i * 0.14), display: 'grid', gridTemplateColumns: '64px 330px 1fr auto', alignItems: 'center', gap: 22, padding: '18px 26px', borderRadius: 16, background: hot ? '#2a2230' : c.panel, border: `${hot ? 3 : 1}px solid ${hot ? c.accent : c.border}`}}>
        <span style={{fontSize: 46}}>{item.icon}</span>
        <span style={{fontSize: 32, fontWeight: 600}}>{item.label}</span>
        <span style={{fontSize: 27, color: hot ? c.text : c.muted, fontFamily: mono}}>«{item.detail}»</span>
        {hot && <span style={{padding: '5px 14px', borderRadius: 999, background: c.accent, color: '#201713', fontSize: 20, fontWeight: 700, letterSpacing: 1}}>MUY IMPORTANTE</span>}
      </div>;
    })}
  </div>;
}

/** Model choice: two kinds of model side by side and the chat's model selector with the recommended one picked. */
function ModelPicker({items, focus = 0}: {items: VisualItem[]; focus?: number}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 34, alignItems: 'center'}}>
    <div style={{display: 'grid', gap: 18}}>
      {items.map((item, i) => {
        const hot = i === focus;
        return <div key={item.label} style={{...show(0.08 + i * 0.2), padding: '24px 28px', borderRadius: 18, background: hot ? '#2a2230' : c.panel, border: `${hot ? 3 : 1}px solid ${hot ? c.accent : c.border}`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}><span style={{fontSize: 48}}>{item.icon}</span><div style={{fontSize: 34, fontWeight: 600}}>{item.label}</div>{hot && <span style={{marginLeft: 'auto', whiteSpace: 'nowrap', padding: '5px 14px', borderRadius: 999, background: c.accent, color: '#201713', fontSize: 18, fontWeight: 700, letterSpacing: 1}}>PARA CONSTRUIR</span>}</div>
          <div style={{fontSize: 28, color: c.soft, margin: '10px 0 12px'}}>{item.detail}</div>
          <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>{item.steps?.map((tag) => <span key={tag} style={{padding: '4px 14px', borderRadius: 999, background: c.raised, border: `1px solid ${c.border}`, fontSize: 22}}>{tag}</span>)}</div>
        </div>;
      })}
    </div>
    <Window title="Chat del agente">
      <div style={{padding: 22, minHeight: 360, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 14}}>
        <div style={{...show(0.45), padding: 10, borderRadius: 12, background: c.raised, border: `1px solid ${c.border}`}}>
          <div style={{fontSize: 18, color: c.muted, letterSpacing: 2, padding: '2px 8px 8px'}}>CAMBIAR MODELO</div>
          {items.map((item, i) => <div key={item.label} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, fontSize: 24, background: i === focus ? '#2a2230' : 'transparent', border: `1px solid ${i === focus ? c.accent : 'transparent'}`}}><span style={{width: 24, color: c.ok}}>{i === focus ? '✓' : ''}</span>{item.label}</div>)}
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: `1px solid ${c.border}`, borderRadius: 10, color: c.muted, fontSize: 21}}><span style={{flex: 1}}>Escribe tu mensaje…</span><span style={{padding: '4px 12px', borderRadius: 999, background: c.raised, color: c.text, border: `1px solid ${c.accent}`, fontSize: 20}}>{items[focus]?.label.split(' ·')[0]} ▾</span></div>
      </div>
    </Window>
  </div>;
}

/** Where to see the plan usage in VS Code: the path, and an example of the Account & Usage window. */
function UsagePanel({items, steps = []}: {items: VisualItem[]; steps?: string[]}) {
  const {p, show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 36, alignItems: 'center'}}>
    <div style={{display: 'grid', gap: 12}}>
      {steps.map((step, i) => <React.Fragment key={step}>
        <div style={{...show(0.06 + i * 0.16), display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', borderRadius: 14, background: i === steps.length - 1 ? '#2a2230' : c.panel, border: `${i === steps.length - 1 ? 2 : 1}px solid ${i === steps.length - 1 ? c.accent : c.border}`, fontSize: 28}}>
          <span style={{display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: '50%', background: c.accent, color: '#201713', fontWeight: 700, fontSize: 20}}>{i + 1}</span>{step}
        </div>
        {i < steps.length - 1 && <div style={{...show(0.1 + i * 0.16), textAlign: 'center', fontSize: 30, color: c.accent, lineHeight: 0.6}}>↓</div>}
      </React.Fragment>)}
    </div>
    <div style={{...show(0.5), background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 70px #0007'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', padding: '14px 22px', background: c.raised, fontSize: 24}}><b>Account &amp; Usage</b><span style={{color: c.muted}}>✕</span></div>
      <div style={{padding: '20px 24px', display: 'grid', gap: 22}}>
        {items.map((item, i) => <div key={item.label}>
          <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 25}}><span>{item.label}</span><span style={{color: c.muted}}>{Math.round((item.value ?? 0) * Math.min(1, Math.max(0, (p - 0.5) / 0.3)))}% usado</span></div>
          <div style={{height: 14, borderRadius: 99, background: '#1b3a63', margin: '8px 0 6px', overflow: 'hidden'}}><div style={{width: `${(item.value ?? 0) * Math.min(1, Math.max(0, (p - 0.5) / 0.3))}%`, height: '100%', background: (item.value ?? 0) > 80 ? '#e5534b' : c.ok}}/></div>
          <div style={{fontSize: 20, color: c.muted}}>{item.detail}</div>
        </div>)}
        <div style={{fontSize: 18, color: c.muted}}>Valores de ejemplo</div>
      </div>
    </div>
  </div>;
}

function Frontend({items, cards = []}: {items: VisualItem[]; cards?: VisualItem[]}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 36, alignItems: 'center'}}>
    <Window title="Navegador · localhost:3000">
      <div style={{padding: 26, background: '#10202f', minHeight: 400, display: 'grid', gap: 18, alignContent: 'start'}}>
        <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
          <span style={{fontSize: 30, fontWeight: 600}}>🎮 Biblioteca</span>
          <span style={{flex: 1, padding: '10px 16px', borderRadius: 8, background: '#1b3349', color: '#7f9bb5', fontSize: 22, outline: `3px solid ${c.accent}`}}>🔍 Buscar videojuegos…</span>
        </div>
        <div style={{display: 'flex', gap: 14}}>
          {['＋ Agregar', '♥ Favoritos', 'Cambiar usuario'].map((label, i) => <span key={label} style={{padding: '10px 18px', borderRadius: 8, background: c.blue, fontSize: 22, outline: i === 0 ? `3px solid ${c.accent}` : 'none'}}>{label}</span>)}
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10}}>
          {cards.slice(0, 4).map((card) => <div key={card.label} style={{borderRadius: 8, overflow: 'hidden', background: '#1b3349'}}><Cover item={card} height={120}/><div style={{padding: '4px 8px', fontSize: 15}}>{card.label}</div></div>)}
        </div>
        <div style={{padding: '12px 16px', borderRadius: 10, background: '#1b3349', display: 'flex', gap: 12, alignItems: 'center', outline: `3px solid ${c.accent}`, fontSize: 21}}>
          <span style={{color: '#9fb7cc'}}>Nuevo videojuego</span><span style={{flex: 1, padding: '6px 10px', background: '#10202f', borderRadius: 6}}>Título…</span>
        </div>
      </div>
    </Window>
    <div style={{display: 'grid', gap: 18}}>
      <div><Tag>FRONTEND</Tag><div style={{fontSize: 28, color: c.muted, marginTop: 10}}>Lo que ves y usas en el navegador</div></div>
      {items.map((item, i) => <div key={item.label} style={{...show(0.15 + i * 0.18), display: 'flex', gap: 16, alignItems: 'center', padding: '16px 20px', background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14}}>
        <span style={{fontSize: 46}}>{item.icon}</span><div><div style={{fontSize: 30, fontWeight: 600}}>{item.label}</div><div style={{fontSize: 21, color: c.muted}}>{item.detail}</div></div>
      </div>)}
      <div style={{...show(0.75), fontSize: 26, color: c.soft}}>Se construye con <b style={{color: c.text}}>React</b></div>
    </div>
  </div>;
}

/** Backend: requests come in, the server receives, validates and executes. */
function Backend({items, steps = [], plain}: {items: VisualItem[]; steps?: string[]; plain?: boolean}) {
  const {p, show} = useStage();
  const active = Math.min(items.length - 1, Math.floor(interpolate(p, [0.3, 0.9], [0, items.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
  return <div style={{display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 40, alignItems: 'center'}}>
    <div style={{display: 'grid', gap: 14}}>
      <div style={{fontSize: 24, color: c.muted, letterSpacing: 2}}>PETICIONES DEL NAVEGADOR</div>
      {steps.map((step, i) => <div key={step} style={{...show(0.06 + i * 0.07), display: 'flex', alignItems: 'center', gap: 16, padding: '16px 22px', background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14, fontSize: 30}}>
        <span style={{fontSize: 34, color: c.accent}}>→</span>«{step}»
      </div>)}
    </div>
    <div style={{padding: 28, borderRadius: 20, background: c.panel, border: `2px solid ${c.accent}`}}>
      <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18}}><span style={{fontSize: 52}}>⚙️</span><div><Tag>BACKEND</Tag><div style={{fontSize: 24, color: c.muted, marginTop: 6}}>El servidor · ASP.NET Core</div></div></div>
      {items.map((item, i) => <div key={item.label} style={{display: 'flex', gap: 16, alignItems: 'center', marginTop: 10, padding: '14px 18px', fontSize: 28, ...(plain ? {} : {borderRadius: 12, background: i <= active && p > 0.3 ? '#28211e' : c.raised, border: `1px solid ${i <= active && p > 0.3 ? c.accent : c.border}`})}}>
        <span style={{display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: i <= active && p > 0.3 ? c.ok : c.border, color: '#10100f', fontWeight: 700}}>{i <= active && p > 0.3 ? '✓' : i + 1}</span>
        <div><div style={{fontWeight: 600}}>{item.label}</div><div style={{fontSize: 20, color: c.muted}}>{item.detail}</div></div>
      </div>)}
    </div>
  </div>;
}

/** Database: a favorite is written, the app is switched off and on again, and the data is still there. */
function Database({items, steps = []}: {items: VisualItem[]; steps?: string[]}) {
  const {p} = useStage();
  const stage = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
  const [stageTitle, caption] = (steps[stage] ?? '').split('|');
  const saved = items[1];
  const on = stage !== 1;
  const reading = stage === 2;
  const card = (children: React.ReactNode, lit: boolean, border: string) => <div style={{flex: 1, minWidth: 0, padding: 20, borderRadius: 18, background: c.panel, border: `2px solid ${lit ? border : c.border}`, opacity: lit ? 1 : 0.45, minHeight: 300}}>{children}</div>;
  const arrow = (label: string, lit: boolean) => <div style={{width: 120, display: 'grid', gap: 6, justifyItems: 'center', color: lit ? c.accent : c.border, textAlign: 'center'}}><span style={{fontSize: 46}}>{lit ? (label === 'lee' ? '←' : '→') : '·'}</span><span style={{fontSize: 20, color: lit ? c.soft : c.border}}>{lit ? label : ''}</span></div>;
  return <div style={{display: 'grid', gap: 22}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
      {steps.map((step, i) => <span key={step} style={{padding: '8px 20px', borderRadius: 999, fontSize: 26, background: i === stage ? c.accent : c.panel, color: i === stage ? '#201713' : c.muted, border: `1px solid ${i === stage ? c.accent : c.border}`, fontWeight: i === stage ? 700 : 400}}>{i + 1} · {step.split('|')[0]}</span>)}
    </div>
    <div style={{display: 'flex', alignItems: 'stretch', gap: 8}}>
      {card(<>
        <div style={{fontSize: 24, color: c.muted, letterSpacing: 2, marginBottom: 12}}>LA APLICACIÓN {on ? '· ENCENDIDA' : '· APAGADA'}</div>
        <div style={{fontSize: 22, color: c.soft, marginBottom: 12}}>Navegador + backend</div>
        {on ? <div style={{display: 'flex', gap: 14, alignItems: 'center', padding: 12, borderRadius: 12, background: c.raised}}>
          <div style={{width: 64, borderRadius: 6, overflow: 'hidden'}}>{saved && <Cover item={saved} ratio="3 / 4"/>}</div>
          <div style={{fontSize: 26}}>{saved?.label}<div style={{fontSize: 30, color: stage === 0 && p < 0.1 ? c.muted : c.accent}}>{stage === 0 && p < 0.1 ? '♡' : '♥ Favorito'}</div></div>
        </div> : <div style={{fontSize: 28, color: c.muted, padding: '30px 0', textAlign: 'center'}}>⏻ Memoria vacía</div>}
      </>, on, c.blue)}
      {arrow(reading ? 'lee' : 'guarda', stage !== 1)}
      {card(<>
        <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14}}><span style={{fontSize: 44}}>🗄️</span><div><div style={{fontSize: 26, fontWeight: 600}}>Base de datos</div><div style={{fontSize: 19, color: c.muted}}>SQLite · tabla «favoritos»</div></div></div>
        <div style={{display: 'grid', gridTemplateColumns: '1.2fr 2fr', fontSize: 19, color: c.muted, letterSpacing: 1, padding: '6px 10px'}}><span>USUARIO</span><span>JUEGO</span></div>
        {items.slice(0, 1).map((row) => <div key={row.label} style={{display: 'grid', gridTemplateColumns: '1.2fr 2fr', fontSize: 24, padding: '8px 10px', borderTop: `1px solid ${c.border}`}}><span>Ana</span><span>{row.label}</span></div>)}
        {saved && p > 0.12 && <div style={{display: 'grid', gridTemplateColumns: '1.2fr 2fr', fontSize: 24, padding: '8px 10px', borderTop: `1px solid ${c.border}`, background: '#1f2a1d', color: c.ok}}><span>Ana</span><span>{saved.label}</span></div>}
        <div style={{marginTop: 16, fontSize: 22, color: stage === 1 ? c.ok : c.muted}}>{stage === 1 ? '💾 Los datos siguen guardados' : stage === 0 ? 'Se escribe una fila nueva' : 'Se leen las filas guardadas'}</div>
      </>, true, c.accent)}
    </div>
    <div style={{fontSize: 30, color: c.text, textAlign: 'center', minHeight: 40}}><b style={{color: c.accent}}>{stageTitle}:</b> {caption}</div>
  </div>;
}

/** Docker: one container with everything, running the same on every system. */
function Docker({items, steps = []}: {items: VisualItem[]; steps?: string[]}) {
  const {show} = useStage();
  return <div style={{display: 'grid', gridTemplateColumns: '1fr auto 1.2fr', gap: 30, alignItems: 'center'}}>
    <div style={{padding: 26, borderRadius: 20, border: `3px solid ${c.blue}`, background: c.panel}}>
      <div style={{display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16}}><span style={{fontSize: 56}}>🐳</span><Tag>CONTENEDOR</Tag></div>
      {steps.map((step, i) => <div key={step} style={{...show(0.08 + i * 0.1), marginTop: 10, padding: '12px 16px', borderRadius: 10, background: c.raised, fontSize: 26}}>{step}</div>)}
    </div>
    <span style={{...show(0.5), fontSize: 64, color: c.accent}}>→</span>
    <div style={{display: 'grid', gap: 16}}>
      {items.map((item, i) => <div key={item.label} style={{...show(0.5 + i * 0.12), display: 'flex', alignItems: 'center', gap: 18, padding: '16px 22px', background: c.panel, border: `1px solid ${c.border}`, borderRadius: 14}}>
        <span style={{fontSize: 48}}>{item.icon}</span><span style={{flex: 1, fontSize: 30}}>{item.label}</span><span style={{fontSize: 22, color: c.ok}}>🐳 ✓ funciona igual</span>
      </div>)}
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

const CoverContext = React.createContext('');

/** A catalog image shipped with the lesson (lessons/<slug>/assets/). */
function Cover({item, height, ratio}: {item: VisualItem; height?: number; ratio?: string}) {
  const slug = React.useContext(CoverContext);
  return item.image
    ? <Img src={staticFile(`lesson-assets/${slug}/${item.image}`)} alt={`Portada de ${item.label}`} style={{display: 'block', width: '100%', height, aspectRatio: ratio, objectFit: 'cover', objectPosition: 'top'}}/>
    : <div style={{width: '100%', height, aspectRatio: ratio, background: '#2a3a4a'}}/>;
}

function AppPreview({items, cards = [], checks = []}: {items: VisualItem[]; cards?: VisualItem[]; checks?: string[]}) {
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
        <div style={{display: 'grid', gridTemplateColumns: `repeat(${Math.max(1, cards.length)}, 1fr)`, gap: 12}}>
          {cards.map((card, i) => <div key={card.label} style={{...show(0.04 + i * 0.05), background: '#1b3349', borderRadius: 8, overflow: 'hidden'}}>
            <Cover item={card} ratio="3 / 4"/>
            <div style={{padding: '8px 10px'}}><div style={{fontSize: 16, lineHeight: 1.2, minHeight: 38}}>{card.label}</div><div style={{fontSize: 15, color: '#7f9bb5'}}>{card.detail} · {i % 2 ? '♥' : '♡'}</div></div>
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

export function VisualScene({scene, slug}: {scene: VisualSceneData; slug: string}) {
  const items = scene.items ?? [];
  const body = scene.visual === 'timeline' ? <Timeline items={items} plain={scene.plain}/>
    : scene.visual === 'browser-download' ? <BrowserDownload items={items}/>
    : scene.visual === 'installer' ? <Installer items={items}/>
    : scene.visual === 'extensions' ? <Extensions items={items}/>
    : scene.visual === 'open-folder' ? <OpenFolder items={items}/>
    : scene.visual === 'open-chat' ? <OpenChat items={items}/>
    : scene.visual === 'browser-page' ? <BrowserPage items={items} steps={scene.steps}/>
    : scene.visual === 'prompt-anatomy' ? <PromptAnatomy items={items} focus={scene.focus}/>
    : scene.visual === 'model-picker' ? <ModelPicker items={items} focus={scene.focus}/>
    : scene.visual === 'usage-panel' ? <UsagePanel items={items} steps={scene.steps}/>
    : scene.visual === 'frontend' ? <Frontend items={items} cards={scene.cards}/>
    : scene.visual === 'backend' ? <Backend items={items} steps={scene.steps} plain={scene.plain}/>
    : scene.visual === 'database' ? <Database items={items} steps={scene.steps}/>
    : scene.visual === 'docker' ? <Docker items={items} steps={scene.steps}/>
    : scene.visual === 'agent-work' ? <AgentWork steps={scene.steps}/>
    : scene.visual === 'app-preview' ? <AppPreview items={items} cards={scene.cards} checks={scene.steps}/>
    : scene.visual === 'prompt-flow' ? <PromptFlow items={items}/>
    : <Choices items={items}/>;
  return <AbsoluteFill style={{fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', color: c.text, background: c.bg, padding: '46px 70px', justifyContent: 'center'}}><Title>{scene.title}</Title><CoverContext.Provider value={slug}>{body}</CoverContext.Provider></AbsoluteFill>;
}

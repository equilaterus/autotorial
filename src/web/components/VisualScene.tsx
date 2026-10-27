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
    {items.map((item, col) => <div key={item.label} style={{...show(0.04 + col * 0.2), background: c.panel, border: `1px solid ${c.border}`, borderRadius: 16, padding: 22}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 32, marginBottom: 14}}><span style={{fontSize: 46}}>{item.icon}</span>{item.label}</div>
      {item.steps?.map((step, i) => {
        const isCommand = step.startsWith('$ ');
        return <div key={step} style={{...show(0.1 + col * 0.2 + i * 0.07), display: 'flex', gap: 12, alignItems: 'center', marginTop: 10, padding: '10px 12px', background: c.raised, borderRadius: 10, fontSize: isCommand ? 18 : 22, fontFamily: isCommand ? mono : undefined, color: isCommand ? c.soft : c.text}}>
          <span style={{flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: '50%', background: c.accent, color: '#201713', fontWeight: 700, fontSize: 17}}>{i + 1}</span><span style={{wordBreak: 'break-word'}}>{step}</span>
        </div>;
      })}
    </div>)}
  </div>;
}

const ActivityBar = ({active}: {active: 'files' | 'extensions'}) => <div style={{width: 64, background: '#1b1b19', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', fontSize: 28}}>
  <span style={{opacity: active === 'files' ? 1 : 0.4, borderLeft: active === 'files' ? `3px solid ${c.accent}` : 'none', paddingLeft: 6}}>📁</span>
  <span style={{opacity: active === 'extensions' ? 1 : 0.4, borderLeft: active === 'extensions' ? `3px solid ${c.accent}` : 'none', paddingLeft: 6}}>🧩</span><span style={{opacity: 0.4}}>⚙️</span>
</div>;

function Extensions({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const typed = p > 0.12;
  const installed = p > 0.5;
  const login = p > 0.68;
  return <Window title="Extensiones — Visual Studio Code" style={{position: 'relative'}}>
    <div style={{display: 'flex', height: 420}}>
      <ActivityBar active="extensions"/>
      <div style={{width: 520, borderRight: `1px solid ${c.border}`, padding: 18}}>
        <div style={{fontSize: 18, color: c.muted, letterSpacing: 2, marginBottom: 10}}>EXTENSIONES <span style={{...show(0.02), color: c.soft, letterSpacing: 0}}>· Ctrl+Shift+X</span></div>
        <div style={{padding: '9px 14px', background: c.raised, borderRadius: 6, fontSize: 22, marginBottom: 16, color: typed ? c.text : c.muted}}>🔍 {typed ? 'Claude Code' : 'Buscar extensiones…'}</div>
        {items.map((ext, i) => <div key={ext.label} style={{...show(0.15 + i * 0.06), display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: c.panel, borderRadius: 8, marginBottom: 10}}>
          <span style={{fontSize: 38}}>{ext.icon}</span><div style={{flex: 1}}><div style={{fontSize: 24}}>{ext.label}</div><div style={{fontSize: 17, color: c.muted}}>{ext.detail}</div></div>
          <span style={{padding: '8px 18px', borderRadius: 6, fontSize: 20, background: installed ? c.ok : c.blue, color: '#10100f', fontWeight: 600}}>{installed ? '✓ Instalada' : 'Instalar'}</span>
        </div>)}
      </div>
      <div style={{flex: 1, padding: 30, display: 'grid', placeItems: 'center'}}>
        {login ? <div style={{...show(0.68), textAlign: 'center', padding: 28, border: `1px dashed ${c.accent}`, borderRadius: 14}}><div style={{fontSize: 60}}>🔑</div><div style={{fontSize: 28}}>Iniciar sesión</div><div style={{fontSize: 20, color: c.muted, marginTop: 6}}>con tu cuenta de Claude o de ChatGPT</div></div>
          : <div style={{fontSize: 24, color: c.muted, textAlign: 'center'}}>Busca <b style={{color: c.text}}>Codex</b> o <b style={{color: c.text}}>Claude Code</b><br/>y pulsa Instalar</div>}
      </div>
    </div>
    <Cursor x={560} y={185} at={0.45}/>
  </Window>;
}

function OpenFolder({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const menu = p > 0.12 && p < 0.5;
  const opened = p > 0.5;
  return <Window title={opened ? 'mis-videojuegos — Visual Studio Code' : 'Visual Studio Code'} style={{position: 'relative'}}>
    <div style={{display: 'flex', gap: 22, padding: '8px 18px', background: c.raised, fontSize: 20, position: 'relative'}}>
      <span style={{color: menu ? c.accent : c.text}}>Archivo</span><span>Editar</span><span>Selección</span><span>Ver</span>
      {menu && <div style={{...show(0.12), position: 'absolute', top: 38, left: 14, zIndex: 2, width: 300, background: c.panel, border: `1px solid ${c.border}`, borderRadius: 8, padding: 8, fontSize: 21}}>
        <div style={{padding: 6}}>Nuevo archivo</div><div style={{padding: 6, background: c.blue, borderRadius: 4}}>Abrir carpeta…</div><div style={{padding: 6}}>Guardar</div>
      </div>}
    </div>
    <div style={{display: 'flex', height: 380}}>
      <ActivityBar active="files"/>
      <div style={{width: 400, borderRight: `1px solid ${c.border}`, padding: 18}}>
        <div style={{fontSize: 18, color: c.muted, letterSpacing: 2, marginBottom: 12}}>EXPLORADOR</div>
        {!opened ? <div style={{...show(0.3), padding: 12, background: c.panel, borderRadius: 8, fontSize: 21}}>📂 Crea la carpeta <b>mis-videojuegos</b> y selecciónala</div>
          : <><div style={{...show(0.5), fontSize: 26}}>📂 {items[0]?.label ?? 'mis-videojuegos'}</div><div style={{...show(0.55), color: c.muted, marginTop: 10, fontSize: 18}}>Vacía por ahora</div></>}
      </div>
      <div style={{flex: 1, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12}}>
        {p > 0.7 && <div style={{...show(0.7), alignSelf: 'flex-start', padding: '12px 16px', background: c.panel, borderRadius: 12, fontSize: 22}}>🤖 ¡Hola! ¿Qué quieres construir?</div>}
        <div style={{padding: '12px 16px', border: `1px solid ${p > 0.7 ? c.accent : c.border}`, borderRadius: 10, color: c.muted, fontSize: 21}}>Escribe tu mensaje…</div>
      </div>
    </div>
    <Cursor x={80} y={42} at={0.1}/>
  </Window>;
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
    <Window title="localhost:3000 — Biblioteca de videojuegos" style={{flex: 1}}>
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
      {checks.map((check, i) => <div key={check} style={{...show(0.1 + i * 0.17), padding: '16px 18px', background: c.panel, border: `1px solid ${c.border}`, borderRadius: 12, fontSize: 24}}><span style={{color: c.ok, marginRight: 10}}>✓</span>{check}</div>)}
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
    : scene.visual === 'agent-work' ? <AgentWork steps={scene.steps}/>
    : scene.visual === 'app-preview' ? <AppPreview items={items} checks={scene.steps}/>
    : scene.visual === 'prompt-flow' ? <PromptFlow items={items}/>
    : <Choices items={items}/>;
  return <AbsoluteFill style={{fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', color: c.text, background: c.bg, padding: '46px 70px', justifyContent: 'center'}}><Title>{scene.title}</Title>{body}</AbsoluteFill>;
}

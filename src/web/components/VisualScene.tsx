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

function OsDownload({items, steps = []}: {items: VisualItem[]; steps?: string[]}) {
  const {show} = useStage();
  return <>
    <div style={{display: 'flex', gap: 26, justifyContent: 'center'}}>
      {items.map((item, i) => <div key={item.label} style={{...show(0.06 + i * 0.07), width: 330, padding: '28px 24px', borderRadius: 18, background: c.panel, border: `1px solid ${c.border}`, textAlign: 'center'}}>
        <div style={{fontSize: 70}}>{item.icon}</div>
        <div style={{fontSize: 32, margin: '8px 0 12px'}}>{item.label}</div>
        <div style={{fontFamily: mono, fontSize: 19, color: c.soft, wordBreak: 'break-all'}}>{item.detail}</div>
      </div>)}
    </div>
    <div style={{display: 'flex', gap: 18, justifyContent: 'center', marginTop: 40}}>
      {steps.map((step, i) => <React.Fragment key={step}>
        <div style={{...show(0.45 + i * 0.12), display: 'flex', alignItems: 'center', gap: 14, fontSize: 28}}>
          <span style={{display: 'inline-grid', placeItems: 'center', width: 44, height: 44, borderRadius: '50%', background: c.accent, color: '#201713', fontWeight: 700}}>{i + 1}</span>{step}
        </div>
        {i < steps.length - 1 && <span style={{...show(0.45 + i * 0.12), fontSize: 34, color: c.muted}}>→</span>}
      </React.Fragment>)}
    </div>
  </>;
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

function EditorSetup({items}: {items: VisualItem[]}) {
  const {p, show} = useStage();
  const [ext1, ext2] = items;
  const installed = p > 0.3;
  const folder = p > 0.62;
  return <Window title={folder ? 'mis-videojuegos — Visual Studio Code' : 'Extensiones — Visual Studio Code'} style={{height: 470}}>
    <div style={{display: 'flex', height: 420}}>
      <div style={{width: 64, background: '#1b1b19', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', fontSize: 28}}>
        <span style={{opacity: folder ? 1 : 0.4}}>📁</span><span style={{opacity: folder ? 0.4 : 1, borderLeft: folder ? 'none' : `3px solid ${c.accent}`, paddingLeft: 6}}>🧩</span><span style={{opacity: 0.4}}>⚙️</span>
      </div>
      <div style={{width: 400, borderRight: `1px solid ${c.border}`, padding: 18}}>
        {!folder ? <>
          <div style={{fontSize: 18, color: c.muted, letterSpacing: 2, marginBottom: 12}}>EXTENSIONES</div>
          <div style={{padding: '8px 12px', background: c.raised, borderRadius: 6, fontSize: 20, marginBottom: 16, color: c.muted}}>🔍 {installed ? 'Claude Code' : 'Codex  o  Claude Code'}</div>
          {[ext1, ext2].map((ext, i) => ext && <div key={ext.label} style={{...show(0.06 + i * 0.06), display: 'flex', gap: 12, alignItems: 'center', padding: 12, background: c.panel, borderRadius: 8, marginBottom: 10}}>
            <span style={{fontSize: 38}}>{ext.icon}</span><div style={{flex: 1}}><div style={{fontSize: 22}}>{ext.label}</div><div style={{fontSize: 16, color: c.muted}}>{ext.detail}</div></div>
            <span style={{padding: '6px 14px', borderRadius: 6, fontSize: 18, background: installed ? c.ok : c.blue, color: '#10100f', fontWeight: 600}}>{installed ? '✓ Instalada' : 'Instalar'}</span>
          </div>)}
          {p > 0.4 && <div style={{...show(0.4), marginTop: 18, padding: 14, borderRadius: 8, border: `1px dashed ${c.accent}`, fontSize: 20}}>🔑 Iniciar sesión con tu cuenta</div>}
        </> : <>
          <div style={{fontSize: 18, color: c.muted, letterSpacing: 2, marginBottom: 12}}>EXPLORADOR</div>
          <div style={{...show(0.62), fontSize: 24}}>📂 mis-videojuegos</div>
          <div style={{...show(0.7), fontSize: 18, color: c.muted, marginTop: 10}}>La carpeta está vacía por ahora.</div>
        </>}
      </div>
      <div style={{flex: 1, padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12}}>
        <div style={{...show(0.5), alignSelf: 'flex-start', padding: '12px 16px', background: c.panel, borderRadius: 12, fontSize: 21}}>🤖 ¡Hola! ¿Qué quieres construir?</div>
        <div style={{...show(0.55), padding: '12px 16px', border: `1px solid ${c.border}`, borderRadius: 10, color: c.muted, fontSize: 20}}>Escribe tu mensaje…</div>
      </div>
    </div>
  </Window>;
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
    : scene.visual === 'os-download' ? <OsDownload items={items} steps={scene.steps}/>
    : scene.visual === 'editor-setup' ? <EditorSetup items={items}/>
    : scene.visual === 'app-preview' ? <AppPreview items={items} checks={scene.steps}/>
    : scene.visual === 'prompt-flow' ? <PromptFlow items={items}/>
    : <Choices items={items}/>;
  return <AbsoluteFill style={{fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', color: c.text, background: c.bg, padding: '46px 70px', justifyContent: 'center'}}><Title>{scene.title}</Title>{body}</AbsoluteFill>;
}

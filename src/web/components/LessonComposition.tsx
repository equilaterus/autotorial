import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {VisualScene} from './VisualScene';
import {AUDIO_LEAD_IN} from '../../core/timing';
import type {LessonScene, ProducedLesson} from '../../core/types';

export const FPS = 30;

export function sceneFrames(scene: LessonScene): number {
  return Math.max(1, Math.round((scene.duration ?? 4) * FPS));
}

const palette = {bg: '#141413', panel: '#242421', text: '#f0eee6', muted: '#a8a79f', border: '#3a3a36', accent: '#d97757', accentSoft: '#e8a78f', code: '#10100f', codeText: '#e4e2da'};

function Code({code, highlights = [], reveal = []}: {code: string; highlights?: number[]; reveal?: number[]}) {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  const shown = reveal.length ? reveal.filter((at) => frame >= at * FPS).length : lines.length;
  const colored = (line: string) => line.split(/(\/\/.*|\b(?:function|return|const|let|var|console|if|else|for|while)\b|"[^"\n]*"|'[^'\n]*'|\b\d+(?:\.\d+)?\b)/g).map((token, tokenIndex) => {
    const color = token.startsWith('//') ? '#77776f' : /^(function|return|const|let|var|if|else|for|while)$/.test(token) ? '#e8a78f' : token === 'console' ? '#c4b5fd' : /^(?:"|')/.test(token) ? '#a8c49a' : /^\d/.test(token) ? '#e5c890' : palette.codeText;
    return <span key={tokenIndex} style={{color}}>{token}</span>;
  });
  return <pre style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: 28, lineHeight: 1.6, color: palette.codeText, margin: 0, padding: 34, background: palette.code, border: `1px solid ${palette.border}`, borderRadius: 14, boxShadow: '0 24px 70px #0007', width: '86%'}}>
    {lines.map((line, index) => <div key={index} style={{opacity: index < shown ? 1 : 0.08, color: highlights.includes(index + 1) ? palette.accentSoft : palette.codeText, background: highlights.includes(index + 1) ? '#d977571b' : 'transparent', padding: '0 12px'}}>
      <span style={{display: 'inline-block', width: 48, color: '#66665f'}}>{index + 1}</span>{line ? colored(line) : ' '}
    </div>)}
  </pre>;
}

export function SceneCard({scene, slug}: {scene: LessonScene; slug: string}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 18], [0.82, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const common: React.CSSProperties = {fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif', color: palette.text, background: palette.bg, padding: 70, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`};
  if (scene.type === 'visual') return <VisualScene scene={scene} slug={slug}/>;
  if (scene.type === 'code') return <AbsoluteFill style={{...common, alignItems: 'center', justifyContent: 'center'}}><div style={{color: palette.accentSoft, fontSize: 19, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20}}>{scene.title}</div><Code code={scene.code} highlights={scene.highlights} reveal={scene.reveal}/></AbsoluteFill>;
  if (scene.type === 'diagram') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontWeight: 500, letterSpacing: '-.03em', fontSize: 56, margin: '0 0 50px'}}>{scene.title}</h1><div style={{display: 'flex', gap: 38, alignItems: 'center', justifyContent: 'center'}}>{scene.nodes.map((node, index) => <React.Fragment key={node.id}><div style={{padding: '28px 38px', border: `1px solid ${palette.border}`, borderRadius: 14, fontSize: 30, background: palette.panel}}>{node.label}</div>{index < scene.nodes.length - 1 && <span style={{fontSize: 42, color: palette.accent}}>→</span>}</React.Fragment>)}</div></AbsoluteFill>;
  if (scene.type === 'terminal') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontWeight: 500, letterSpacing: '-.03em', fontSize: 56}}>{scene.title}</h1><pre style={{fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', color: palette.codeText, fontSize: 29, lineHeight: 1.6, background: palette.code, padding: 42, borderRadius: 14, border: `1px solid ${palette.border}`, boxShadow: '0 22px 60px #0006'}}><span style={{color: palette.accentSoft}}>$ {scene.command}</span>{'\n'}<span>{scene.output}</span></pre></AbsoluteFill>;
  return <AbsoluteFill style={{...common, justifyContent: 'center'}}><div style={{color: palette.accentSoft, fontSize: 19, fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase'}}>Concepto</div><h1 style={{fontWeight: 500, letterSpacing: '-.045em', fontSize: 72, lineHeight: 1.04, maxWidth: 1050, margin: '24px 0'}}>{scene.title}</h1><p style={{fontSize: 34, lineHeight: 1.5, color: palette.muted, maxWidth: 1100}}>{scene.body}</p>{scene.bullets?.map((bullet, index) => <div key={bullet} style={{fontSize: 28, marginTop: 15, opacity: frame > 18 + index * 12 ? 1 : 0, color: palette.text}}><span style={{color:palette.accent}}>→</span> {bullet}</div>)}</AbsoluteFill>;
}

export function LessonComposition({lesson}: {lesson: ProducedLesson}) {
  let offset = 0;
  return <AbsoluteFill style={{background: palette.bg}}>{lesson.scenes.map((scene) => {
    const from = offset;
    offset += sceneFrames(scene);
    const audio = lesson.audio.find((segment) => segment.sceneId === scene.id);
    return <Sequence key={scene.id} from={from} durationInFrames={sceneFrames(scene)}><SceneCard scene={scene} slug={lesson.slug}/>{audio && <Sequence from={Math.round(AUDIO_LEAD_IN * FPS)}><Audio src={staticFile(audio.src)}/></Sequence>}</Sequence>;
  })}</AbsoluteFill>;
}

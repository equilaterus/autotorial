import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {LessonScene, ProducedLesson} from '../../core/types';

export const FPS = 30;

export function sceneFrames(scene: LessonScene): number {
  return Math.max(1, Math.round((scene.duration ?? 4) * FPS));
}

const palette = {bg: '#090b12', panel: '#121725', text: '#f5f7ff', muted: '#aab4ce', accent: '#71e6c1', warm: '#ffb86b'};

function Code({code, highlights = [], reveal = []}: {code: string; highlights?: number[]; reveal?: number[]}) {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  const shown = reveal.length ? reveal.filter((at) => frame >= at * FPS).length : lines.length;
  const colored = (line: string) => line.split(/(\/\/.*|\b(?:function|return|const|let|var|console|if|else|for|while)\b|"[^"\n]*"|'[^'\n]*'|\b\d+(?:\.\d+)?\b)/g).map((token, tokenIndex) => {
    const color = token.startsWith('//') ? '#70809e' : /^(function|return|const|let|var|if|else|for|while)$/.test(token) ? '#ff8fcb' : token === 'console' ? palette.warm : /^(?:"|')/.test(token) ? '#b8e986' : /^\d/.test(token) ? '#9ab8ff' : '#dce5ff';
    return <span key={tokenIndex} style={{color}}>{token}</span>;
  });
  return <pre style={{fontSize: 31, lineHeight: 1.55, margin: 0, padding: 34, background: '#080b12', borderRadius: 18, boxShadow: '0 24px 80px #0008', width: '86%'}}>
    {lines.map((line, index) => <div key={index} style={{opacity: index < shown ? 1 : 0.08, color: highlights.includes(index + 1) ? palette.accent : '#dce5ff', background: highlights.includes(index + 1) ? '#71e6c118' : 'transparent', padding: '0 12px'}}>
      <span style={{display: 'inline-block', width: 48, color: '#526079'}}>{index + 1}</span>{line ? colored(line) : ' '}
    </div>)}
  </pre>;
}

export function SceneCard({scene}: {scene: LessonScene}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const common: React.CSSProperties = {fontFamily: 'Inter, ui-sans-serif, system-ui', color: palette.text, background: palette.bg, padding: 70, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`};
  if (scene.type === 'code') return <AbsoluteFill style={{...common, alignItems: 'center', justifyContent: 'center'}}><div style={{color: palette.accent, fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18}}>{scene.title}</div><Code code={scene.code} highlights={scene.highlights} reveal={scene.reveal}/></AbsoluteFill>;
  if (scene.type === 'diagram') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontSize: 55, margin: '0 0 50px'}}>{scene.title}</h1><div style={{display: 'flex', gap: 38, alignItems: 'center', justifyContent: 'center'}}>{scene.nodes.map((node, index) => <React.Fragment key={node.id}><div style={{padding: '28px 38px', border: `2px solid ${palette.accent}`, borderRadius: 18, fontSize: 30, background: palette.panel}}>{node.label}</div>{index < scene.nodes.length - 1 && <span style={{fontSize: 46, color: palette.warm}}>→</span>}</React.Fragment>)}</div></AbsoluteFill>;
  if (scene.type === 'terminal') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontSize: 54}}>{scene.title}</h1><pre style={{fontSize: 31, lineHeight: 1.6, background: '#05070d', padding: 42, borderRadius: 18, border: '1px solid #26314a'}}><span style={{color: palette.accent}}>$ {scene.command}</span>{'\n'}<span style={{color: palette.text}}>{scene.output}</span></pre></AbsoluteFill>;
  return <AbsoluteFill style={{...common, justifyContent: 'center'}}><div style={{color: palette.accent, fontSize: 23, letterSpacing: 4, textTransform: 'uppercase'}}>Concepto</div><h1 style={{fontSize: 72, lineHeight: 1.05, maxWidth: 1050, margin: '24px 0'}}>{scene.title}</h1><p style={{fontSize: 36, lineHeight: 1.45, color: palette.muted, maxWidth: 1100}}>{scene.body}</p>{scene.bullets?.map((bullet, index) => <div key={bullet} style={{fontSize: 29, marginTop: 15, opacity: frame > 18 + index * 12 ? 1 : 0, color: palette.text}}>→ {bullet}</div>)}</AbsoluteFill>;
}

export function LessonComposition({lesson}: {lesson: ProducedLesson}) {
  let offset = 0;
  return <AbsoluteFill style={{background: palette.bg}}>{lesson.scenes.map((scene) => {
    const from = offset;
    offset += sceneFrames(scene);
    const audio = lesson.audio.find((segment) => segment.sceneId === scene.id);
    return <Sequence key={scene.id} from={from} durationInFrames={sceneFrames(scene)}><SceneCard scene={scene}/>{audio && <Audio src={staticFile(audio.src)}/>}</Sequence>;
  })}</AbsoluteFill>;
}

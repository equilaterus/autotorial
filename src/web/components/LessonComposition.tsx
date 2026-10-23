import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {LessonScene, ProducedLesson} from '../../core/types';

export const FPS = 30;

export function sceneFrames(scene: LessonScene): number {
  return Math.max(1, Math.round((scene.duration ?? 4) * FPS));
}

const palette = {bg: '#151119', panel: '#2a222c', text: '#f7f1e8', muted: '#c6b9c8', accent: '#ffdd35', purple: '#8b5cf6', warm: '#d8b07d', code: '#201b22', codeText: '#d6c3aa'};

function Code({code, highlights = [], reveal = []}: {code: string; highlights?: number[]; reveal?: number[]}) {
  const frame = useCurrentFrame();
  const lines = code.split('\n');
  const shown = reveal.length ? reveal.filter((at) => frame >= at * FPS).length : lines.length;
  const colored = (line: string) => line.split(/(\/\/.*|\b(?:function|return|const|let|var|console|if|else|for|while)\b|"[^"\n]*"|'[^'\n]*'|\b\d+(?:\.\d+)?\b)/g).map((token, tokenIndex) => {
    const color = token.startsWith('//') ? '#82778a' : /^(function|return|const|let|var|if|else|for|while)$/.test(token) ? '#d7a8ff' : token === 'console' ? palette.accent : /^(?:"|')/.test(token) ? '#dfc987' : /^\d/.test(token) ? '#bca8ff' : palette.codeText;
    return <span key={tokenIndex} style={{color}}>{token}</span>;
  });
  return <pre style={{fontFamily: '"VT323", monospace', fontSize: 35, lineHeight: 1.38, letterSpacing: '.01em', color: palette.codeText, margin: 0, padding: 34, background: palette.code, border: '3px solid #8f7f67', borderRadius: 16, boxShadow: 'inset 0 0 0 2px #2a232b, inset 0 0 0 4px #bfa98a, 0 24px 80px #0008', width: '86%'}}>
    {lines.map((line, index) => <div key={index} style={{opacity: index < shown ? 1 : 0.08, color: highlights.includes(index + 1) ? palette.accent : palette.codeText, background: highlights.includes(index + 1) ? '#ffdd3518' : 'transparent', padding: '0 12px'}}>
      <span style={{display: 'inline-block', width: 48, color: '#786a7d'}}>{index + 1}</span>{line ? colored(line) : ' '}
    </div>)}
  </pre>;
}

export function SceneCard({scene}: {scene: LessonScene}) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const common: React.CSSProperties = {fontFamily: '"Space Grotesk", sans-serif', color: palette.text, background: 'radial-gradient(circle at 80% 0%, #43227a 0, transparent 42%), #151119', padding: 70, opacity: enter, transform: `translateY(${(1 - enter) * 24}px)`};
  if (scene.type === 'code') return <AbsoluteFill style={{...common, alignItems: 'center', justifyContent: 'center'}}><div style={{fontFamily: '"Share Tech", sans-serif', color: palette.accent, fontSize: 25, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 18}}>{scene.title}</div><Code code={scene.code} highlights={scene.highlights} reveal={scene.reveal}/></AbsoluteFill>;
  if (scene.type === 'diagram') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontFamily: '"Share Tech", sans-serif', fontWeight: 400, fontSize: 58, margin: '0 0 50px'}}>{scene.title}</h1><div style={{display: 'flex', gap: 38, alignItems: 'center', justifyContent: 'center'}}>{scene.nodes.map((node, index) => <React.Fragment key={node.id}><div style={{padding: '28px 38px', border: `2px solid ${palette.accent}`, borderRadius: 12, fontSize: 30, background: palette.panel, boxShadow: '0 18px 45px #0005'}}>{node.label}</div>{index < scene.nodes.length - 1 && <span style={{fontSize: 46, color: palette.warm}}>→</span>}</React.Fragment>)}</div></AbsoluteFill>;
  if (scene.type === 'terminal') return <AbsoluteFill style={{...common, justifyContent: 'center'}}><h1 style={{fontFamily: '"Share Tech", sans-serif', fontWeight: 400, fontSize: 58}}>{scene.title}</h1><pre style={{fontFamily: '"VT323", monospace', color: palette.codeText, fontSize: 36, lineHeight: 1.45, background: palette.code, padding: 42, borderRadius: 16, border: '3px solid #8f7f67', boxShadow: 'inset 0 0 0 2px #2a232b, inset 0 0 0 4px #bfa98a, 0 22px 70px #0007'}}><span style={{color: palette.accent}}>$ {scene.command}</span>{'\n'}<span>{scene.output}</span></pre></AbsoluteFill>;
  return <AbsoluteFill style={{...common, justifyContent: 'center'}}><div style={{fontFamily: '"Share Tech", sans-serif', color: palette.accent, fontSize: 25, letterSpacing: 4, textTransform: 'uppercase'}}>Concepto</div><h1 style={{fontFamily: '"Share Tech", sans-serif', fontWeight: 400, fontSize: 76, lineHeight: 1.02, maxWidth: 1050, margin: '24px 0'}}>{scene.title}</h1><p style={{fontSize: 36, lineHeight: 1.45, color: palette.muted, maxWidth: 1100}}>{scene.body}</p>{scene.bullets?.map((bullet, index) => <div key={bullet} style={{fontSize: 29, marginTop: 15, opacity: frame > 18 + index * 12 ? 1 : 0, color: palette.text}}><span style={{color:palette.accent}}>→</span> {bullet}</div>)}</AbsoluteFill>;
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

import React from 'react';

export interface CodeTheme {comment: string; string: string; attribute: string; number: string; keyword: string; method: string; type: string; plain: string}

export const AUTOTORIAL_THEME: CodeTheme = {comment: '#77776f', string: '#a8c49a', attribute: '#7fc4c4', number: '#e5c890', keyword: '#e8a78f', method: '#e5c890', type: '#c4b5fd', plain: '#e4e2da'};
export const VSCODE_THEME: CodeTheme = {comment: '#6a9955', string: '#ce9178', attribute: '#4ec9b0', number: '#b5cea8', keyword: '#569cd6', method: '#dcdcaa', type: '#4ec9b0', plain: '#d4d4d4'};

const TOKENS = /\/\/.*|"[^"\n]*"|\[[^\]\n]*\]|\b[A-Za-z_]\w*\b|\b\d+(?:\.\d+)?\b/g;
const KEYWORDS = /^(if|else|for|foreach|while|public|private|class|enum|new|void|return|static|var|using|namespace|get|set|async|await|null|true|false|string|int|bool)$/;

/** Colors one line of C#: comments, strings, attributes, numbers, keywords, methods (followed by "(") and types (capitalized). */
export function csharpSpans(line: string, theme: CodeTheme = AUTOTORIAL_THEME): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(TOKENS)) {
    const token = match[0], at = match.index ?? 0;
    if (at > last) out.push(<span key={`t${last}`}>{line.slice(last, at)}</span>);
    const color = token.startsWith('//') ? theme.comment
      : token.startsWith('"') ? theme.string
      : token.startsWith('[') ? theme.attribute
      : /^\d/.test(token) ? theme.number
      : KEYWORDS.test(token) ? theme.keyword
      : line[at + token.length] === '(' ? theme.method
      : /^[A-Z]/.test(token) ? theme.type
      : theme.plain;
    out.push(<span key={`k${at}`} style={{color}}>{token}</span>);
    last = at + token.length;
  }
  if (last < line.length) out.push(<span key={`t${last}`}>{line.slice(last)}</span>);
  return out;
}

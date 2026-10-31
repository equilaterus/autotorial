import React from 'react';
import {codeSpans, VSCODE_THEME, type CodeLanguage} from './csharp';

/** Plain textarea with basic syntax highlighting: a colored copy of the code sits under a transparent textarea. */
export function CodeEditor({value, onChange, language, label}: {value: string; onChange: (value: string) => void; language: CodeLanguage; label: string}) {
  const insertTab = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    const field = event.currentTarget;
    const {selectionStart, selectionEnd} = field;
    onChange(value.slice(0, selectionStart) + '  ' + value.slice(selectionEnd));
    requestAnimationFrame(() => field.setSelectionRange(selectionStart + 2, selectionStart + 2));
  };
  return <div className="code-editor">
    <pre aria-hidden="true">{value.split('\n').map((line, index) => <div key={index}>{line ? codeSpans(line, language, VSCODE_THEME) : ' '}</div>)}</pre>
    <textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={insertTab} spellCheck={false} autoCapitalize="off" autoCorrect="off" aria-label={label}/>
  </div>;
}

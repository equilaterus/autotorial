import React from 'react';

export interface ContentEntry {number: number; title: string; description: string; slug: string; available: boolean}

/** The course table of contents: every lesson, with the ones that are ready linking to the player. */
export function Home({title, contents}: {title: string; contents: ContentEntry[]}) {
  return <main className="home">
    <div className="home-head"><span className="eyebrow">{title}</span><h2>Contenidos</h2></div>
    <ol className="home-list">
      {contents.map((entry) => {
        const reached = entry.available ? Number(localStorage.getItem(`autotorial:${entry.slug}:reached`)) || 0 : 0;
        const body = <>
          <span className="home-num">{entry.number}</span>
          <span className="home-text"><span className="home-title">{entry.title}</span><span className="home-desc">{entry.description}</span></span>
          <span className="home-action">{entry.available ? (reached > 0 ? 'Continuar →' : 'Empezar →') : 'Próximamente'}</span>
        </>;
        return <li key={entry.slug}>{entry.available
          ? <a className="home-item" href={`#/${entry.slug}`}>{body}</a>
          : <div className="home-item soon" aria-disabled="true">{body}</div>}</li>;
      })}
    </ol>
  </main>;
}

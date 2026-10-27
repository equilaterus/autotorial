import React from 'react';

const SOCIAL = [
  {label: 'github', href: 'https://github.com/TheScienceOfCode/thescienceofcode.github.io', path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"},
  {label: 'twitter', href: 'https://twitter.com/scienceofcode', path: "M21.543 7.104c.015.211.015.423.015.636 0 6.507-4.954 14.01-14.01 14.01v-.003A13.94 13.94 0 0 1 0 19.539a9.88 9.88 0 0 0 7.287-2.041 4.93 4.93 0 0 1-4.6-3.42 4.916 4.916 0 0 0 2.223-.084A4.926 4.926 0 0 1 .96 9.167v-.062a4.887 4.887 0 0 0 2.235.616A4.928 4.928 0 0 1 1.67 3.148 13.98 13.98 0 0 0 11.82 8.292a4.929 4.929 0 0 1 8.39-4.49 9.868 9.868 0 0 0 3.128-1.196 4.941 4.941 0 0 1-2.165 2.724A9.828 9.828 0 0 0 24 4.555a10.019 10.019 0 0 1-2.457 2.549z"},
  {label: 'facebook', href: 'https://www.facebook.com/TheScienceOfCode', path: "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"},
  {label: 'linkedin', href: 'https://www.linkedin.com/company/thescienceofcode', path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"},
];

/** Same footer as thescienceofcode.com. */
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-main">
      <ul className="site-footer-menu">
        <li><a href="https://thescienceofcode.com/post/">POSTS</a></li>
        <li><a href="https://thescienceofcode.com/categories/">CATEGORIES</a></li>
        <li><a href="https://thescienceofcode.com/tags/">TAGS</a></li>
      </ul>
      <div className="site-footer-brand">
        <a className="site-footer-logo" href="https://thescienceofcode.com/" aria-label="The Science of Code"><img src="https://thescienceofcode.com/images/the-science-of-code.png" alt="The Science of Code"/></a>
        <ul className="site-footer-social">{SOCIAL.map((item) => <li key={item.label}><a href={item.href} target="_blank" rel="nofollow noopener noreferrer" aria-label={item.label}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={item.path}/></svg></a></li>)}</ul>
      </div>
    </div>
    <div className="site-footer-bottom">
      <a href="https://equilaterus.com" target="_blank" rel="noopener noreferrer"><img className="site-footer-equilaterus" src="https://thescienceofcode.com/images/equilaterus.png" alt="Equilaterus"/></a>
      <p>The Science of Code is a Free and Open Source initiative by <a href="https://equilaterus.com/" target="_blank" rel="noopener noreferrer">Equilaterus</a>.<br/>Our source code is available at <a href="https://github.com/TheScienceOfCode" target="_blank" rel="noopener noreferrer"><u>GitHub</u></a> under GPL-3.0 License.</p>
      <p><span className="cc-badge">CC</span>2013 - 2025.</p>
    </div>
  </footer>;
}

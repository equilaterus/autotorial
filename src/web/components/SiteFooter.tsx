import React from 'react';

/** The Equilaterus credits block of thescienceofcode.com. */
export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-footer-bottom">
      <a href="https://equilaterus.com" target="_blank" rel="noopener noreferrer"><img className="site-footer-equilaterus" src="https://thescienceofcode.com/images/equilaterus.png" alt="Equilaterus"/></a>
      <p>The Science of Code is a Free and Open Source initiative by <a href="https://equilaterus.com/" target="_blank" rel="noopener noreferrer">Equilaterus</a>.<br/>Our source code is available at <a href="https://github.com/TheScienceOfCode" target="_blank" rel="noopener noreferrer"><u>GitHub</u></a> under GPL-3.0 License.</p>
      <p><span className="cc-badge">CC</span>2013 - 2026.</p>
    </div>
  </footer>;
}

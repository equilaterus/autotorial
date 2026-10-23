import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// Remotion's staticFile() defaults to /audio/..., which escapes a project
// Pages subpath such as /autotorial/. Point it at the directory containing the
// built index so narration stays inside the deployed site.
Object.assign(window, {remotion_staticBase: new URL('.', window.location.href).pathname.replace(/\/$/, '')});

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);

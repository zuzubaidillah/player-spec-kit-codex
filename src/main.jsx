import './polyfills.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

const root = createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);

// Remove fallback overlay once React mounts
try {
  const boot = document.getElementById('boot-fallback');
  if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
} catch {}

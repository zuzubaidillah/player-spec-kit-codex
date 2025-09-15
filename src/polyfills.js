// Polyfills for older web engines commonly found on signage devices
import 'whatwg-fetch';
// Broad polyfills for very old engines
try { require('core-js/stable'); } catch {}
// regenerator-runtime is injected by vite legacy plugin when needed for async/await

// Minimal runtime error overlay (visible on device without inspector)
try {
  const showError = (msg) => {
    let el = document.getElementById('runtime-error');
    if (!el) {
      el = document.createElement('div');
      el.id = 'runtime-error';
      el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:99999;background:#3b0d0d;color:#ffb3b3;padding:8px 10px;border-radius:6px;max-width:70vw;font:12px/1.4 -apple-system,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;white-space:pre-wrap;word-break:break-word;';
      document.body.appendChild(el);
    }
    el.textContent = String(msg);
  };
  window.addEventListener('error', (e) => showError(e?.message || 'Script error'));
  window.addEventListener('unhandledrejection', (e) => showError(e?.reason?.message || 'Promise rejection'));
} catch {}

// requestAnimationFrame polyfill
try {
  (function() {
    let last = 0;
    const raf = window.requestAnimationFrame || function(cb){
      const now = Date.now();
      const next = Math.max(0, 16 - (now - last));
      const id = setTimeout(function(){ cb(now + next); }, next);
      last = now + next;
      return id;
    };
    const caf = window.cancelAnimationFrame || function(id){ clearTimeout(id); };
    window.requestAnimationFrame = raf;
    window.cancelAnimationFrame = caf;
  })();
} catch {}

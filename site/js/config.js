/* Where Python comes from, and how long a run may take.
   'vendor/pyodide/' = the copy next to the page (scripts/vendor-pyodide.sh).
   To use the public CDN instead, set 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
   and add that host to script-src and connect-src in index.html's CSP. */
window.LAB_CONFIG = {
  pyodide: 'vendor/pyodide/',
  timeoutMs: 5000,
};

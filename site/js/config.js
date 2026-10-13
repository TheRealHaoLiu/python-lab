/* Where Python comes from, and how long a run may take.
   Paths are relative to the site root. 'vendor/pyodide/' = the copy in this repo (scripts/vendor-pyodide.sh).
   To use the public CDN instead, set 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
   and add that host to script-src and connect-src in index.html's CSP. */
window.LAB_CONFIG = {
  pyodide: 'vendor/pyodide/',
  timeoutMs: 5000,
};

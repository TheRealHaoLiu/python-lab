/* Runs real Python (Pyodide) off the main thread, so a runaway loop can be
   stopped by terminating this worker without freezing the page.
   The page starts it from a blob: URL (so the page's security policy applies here too)
   and prepends self.LAB_BOOT = {pyodide: '<url ending in />', labkit: '<url of labkit.py>'}. */
const PYODIDE = self.LAB_BOOT.pyodide;
importScripts(PYODIDE + 'pyodide.js');

let dispatch = null;
const ready = (async () => {
  const py = await loadPyodide({ indexURL: PYODIDE });
  const src = await (await fetch(self.LAB_BOOT.labkit)).text();
  py.runPython(src);
  // Turtle pages: write the vendored basthon-turtle package into Python's file system
  // and let labkit register the tiny transport module it draws through (see turtle/).
  if (self.LAB_BOOT.turtle) {
    const T = self.LAB_BOOT.turtle;  // files: {path under /lab: url}
    await Promise.all(Object.entries(T.files).map(async ([name, url]) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(`could not load ${name} for turtle (${r.status})`);
      py.FS.mkdirTree('/lab/' + name.split('/').slice(0, -1).join('/'));
      py.FS.writeFile('/lab/' + name, await r.text());
    }));
    py.globals.get('turtle_boot')('/lab');
  }
  dispatch = py.globals.get('dispatch');
  postMessage({ type: 'ready', version: py.runPython('import sys; sys.version.split()[0]') });
})().catch(err => { postMessage({ type: 'fatal', error: String(err && err.message || err) }); throw err; });

onmessage = async (e) => {
  const { id, fn, args } = e.data;
  try {
    await ready;
    postMessage({ id, ok: true, result: JSON.parse(dispatch(fn, JSON.stringify(args))) });
  } catch (err) {
    postMessage({ id, ok: false, error: String(err && err.message || err) });
  }
};

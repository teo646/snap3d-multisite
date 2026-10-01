// show_case sites: no shop, no feature cards, no chrome - just a row of
// thumbnail buttons (config.bundles[].image) and a live viewer for whichever
// bundle is selected. One Snap3dViewer/canvas/WebGL context is kept for the
// whole session - switching bundles calls its .load() rather than building a
// new canvas+viewer per pick, since each Snap3dViewer opens its own WebGL2
// context and only .dispose() (which .load() calls internally on the old
// renderer) actually releases one. Recreating the canvas every pick leaked a
// context per switch, which crashed the tab once enough bundles (or texture
// memory) piled up.

(() => {
  const $ = (id) => document.getElementById(id);

  async function loadConfig() {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`config.json: HTTP ${res.status}`);
    return res.json();
  }

  // "../assets/bundles/holy_family.snap3d" -> "holy family"
  function labelFor(path) {
    return path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
  }

  let viewer = null;

  function showBundle(bundle) {
    const canvas = $('canvas');
    canvas.setAttribute('aria-label', bundle.label || labelFor(bundle.file));

    if (viewer) {
      viewer.load(bundle.file);
      return;
    }

    viewer = new Snap3dViewer(canvas, bundle.file, {
      loadingIndicator: { color: '#ff5252' },
      onError: (error) => console.error(error),
    });
    window.viewer = viewer;
    viewer.start();
  }

  function buildPicker(bundles) {
    const nav = $('bundle-picker');
    nav.innerHTML = '';
    const buttons = bundles.map((bundle, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'false');

      const img = document.createElement('img');
      img.src = bundle.image;
      img.alt = bundle.label || labelFor(bundle.file);
      btn.append(img);

      btn.addEventListener('click', () => select(i));
      nav.append(btn);
      return btn;
    });

    function select(i) {
      for (const [j, btn] of buttons.entries()) btn.setAttribute('aria-pressed', String(j === i));
      showBundle(bundles[i]);
    }

    if (bundles.length) select(0);
  }

  loadConfig()
    .then((config) => {
      document.title = config.siteName || 'Showcase';
      if (config.favicon) $('favicon').setAttribute('href', config.favicon);
      buildPicker(config.bundles || []);
    })
    .catch((error) => console.error(error));
})();

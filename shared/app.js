// One page, one bundle: a sample store's product page, shown two ways. "Before" is the
// page every store already has - a photo gallery beside the buy box. "After" swaps the
// gallery photo for this site's snap3d bundle, live and rotating, in the exact same spot -
// both are children of #main-shot, which clips to it, so the buy box beside it never
// has to move and the render can never reach past its edge. The viewer itself comes
// from snap3d-viewer's own published build (see index.html's <script src>) - this repo
// carries no copy of it, so a viewer fix there shows up here without anything to keep
// in sync by hand. Sizing, framing and resize handling are entirely the viewer's job;
// this page only sets the canvas's CSS box and swaps tabs.
//
// index.html, this file and the two stylesheets (style.css, shop.css) are shared,
// byte-for-byte, across every site in this repo (3Dfit, ArtIn3D, SampleInWeb, ...).
// The only thing that differs between sites is ./config.json, fetched below - site
// name, tagline, logo, accent color, shop copy, product fields, feature cards and
// the snap3d bundle path all come from there.

(() => {
  const $ = (id) => document.getElementById(id);

  async function loadConfig() {
    const res = await fetch('./config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`config.json: HTTP ${res.status}`);
    return res.json();
  }

  function applyConfig(config) {
    document.title = config.siteName;
    $('meta-desc').setAttribute('content', config.metaDescription);
    if (config.accent) {
      document.documentElement.style.setProperty('--accent', config.accent);
      $('meta-theme').setAttribute('content', config.accent);
    }
    if (config.favicon) $('favicon').setAttribute('href', config.favicon);

    $('brand-logo').src = config.logo.src;
    $('brand-logo').alt = config.logo.alt || '';
    $('brand-name').textContent = config.siteName;
    $('brand-tagline').textContent = config.tagline;

    $('shop-name').textContent = config.shopName;

    const img = $('main-img');
    img.src = config.product.image.src;
    img.alt = config.product.image.alt;
    $('canvas').setAttribute('aria-label', config.product.viewerLabel);

    $('product-crumbs').textContent = config.product.category;
    $('product-name').textContent = config.product.name;
    $('product-price').textContent = config.product.price;

    const options = $('options');
    options.innerHTML = '';
    (config.product.options || []).forEach((opt, i) => {
      const row = document.createElement('div');
      row.className = 'opt-row';

      const label = document.createElement('span');
      label.className = 'opt-label';
      label.textContent = opt.label;
      row.append(label);

      if (opt.type === 'radio') {
        const labelId = `opt-label-${i}`;
        label.id = labelId;
        const group = document.createElement('div');
        group.className = 'sizes';
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-labelledby', labelId);
        for (const value of opt.values) {
          const choice = document.createElement('label');
          const input = document.createElement('input');
          input.type = 'radio';
          input.name = opt.name || `opt-${i}`;
          input.value = value;
          if (value === opt.default) input.checked = true;
          const span = document.createElement('span');
          span.textContent = value;
          choice.append(input, span);
          group.append(choice);
        }
        row.append(group);
      } else {
        // "swatch" (a color dot, via CSS) and "text" (a plain value) both
        // render as one labeled value - only the dot differs, by class.
        const span = document.createElement('span');
        span.className = opt.type === 'swatch' ? 'swatch' : 'opt-value';
        span.textContent = opt.value;
        row.append(span);
      }

      options.append(row);
    });

    const list = $('feature-cards');
    list.innerHTML = '';
    for (const card of config.featureCards) list.append(buildFeatureCard(card));

    return config.bundle;
  }

  // ---------- feature cards: click one to grow it in place ----------
  //
  // No navigation, no separate page - the card itself is pinned at its own
  // on-screen rect (position: fixed, via getBoundingClientRect) and then
  // animated to a larger, centered rect purely with CSS transitions on
  // top/left/width/height (a FLIP animation). Collapsing reverses it back
  // to that same original rect. A backdrop dims the rest of the page and
  // closes the card on click; Escape does too.

  function buildFeatureCard(card) {
    const el = document.createElement('div');
    el.className = 'card feature-card';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-expanded', 'false');

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'feature-card-close';
    closeBtn.setAttribute('aria-label', '닫기');
    closeBtn.textContent = '×';

    const title = document.createElement('p');
    title.className = 'feature-card-title';
    const icon = document.createElement('i');
    icon.className = `ph ${card.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    title.append(icon, document.createTextNode(card.title));

    // Only shown once expanded (replacing desc) - see .feature-card.is-expanded in style.css.
    const image = document.createElement('img');
    image.className = 'feature-card-image';
    if (card.image) image.src = card.image;
    image.alt = card.title;

    const desc = document.createElement('p');
    desc.className = 'feature-card-desc';
    desc.textContent = card.desc;

    const detail = document.createElement('p');
    detail.className = 'feature-card-detail';
    detail.textContent = card.detail || card.desc;

    el.append(closeBtn, title, image, desc, detail);

    // Optional: a download link shown alongside the detail once expanded -
    // used by the "간단하게 웹사이트 연동" card to hand out simple_example.html.
    if (card.download) {
      const link = document.createElement('a');
      link.className = 'feature-card-download';
      link.href = card.download;
      link.setAttribute('download', '');
      link.textContent = `${card.download.split('/').pop()} 다운로드`;
      el.append(link);
    }

    el.addEventListener('click', (e) => {
      if (e.target === closeBtn) return collapseCard(el);
      if (!el.classList.contains('is-expanded')) expandCard(el);
    });
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      el.classList.contains('is-expanded') ? collapseCard(el) : expandCard(el);
    });

    return el;
  }

  const backdrop = $('card-backdrop');
  let expandedCard = null;
  let collapsedRect = null;
  let placeholder = null;

  function expandCard(el) {
    if (expandedCard) collapseCard(expandedCard, { immediate: true });

    const rect = el.getBoundingClientRect();
    collapsedRect = rect;
    expandedCard = el;

    // Pinning el to position: fixed pulls it out of the grid, which would
    // otherwise let the other cards slide over to fill its cell. A same-sized
    // invisible placeholder left in its spot keeps them put.
    placeholder = document.createElement('div');
    placeholder.className = 'feature-card-placeholder';
    placeholder.style.width = `${rect.width}px`;
    placeholder.style.height = `${rect.height}px`;
    el.before(placeholder);

    pinRect(el, rect);
    void el.offsetWidth; // commit the "still where it was" state before animating away from it
    el.classList.add('is-animating', 'is-expanded');
    el.setAttribute('aria-expanded', 'true');

    const width = Math.min(640, innerWidth * 0.92);
    const height = Math.min(520, innerHeight * 0.8);
    pinRect(el, {
      top: Math.max(16, (innerHeight - height) / 2),
      left: (innerWidth - width) / 2,
      width,
      height,
    });

    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('show'));
    document.body.style.overflow = 'hidden';
  }

  function collapseCard(el, { immediate = false } = {}) {
    if (!el.classList.contains('is-expanded')) return;
    el.classList.remove('is-expanded');
    el.setAttribute('aria-expanded', 'false');

    if (immediate || !collapsedRect) {
      unpinRect(el);
    } else {
      pinRect(el, collapsedRect);
      el.addEventListener('transitionend', function done(e) {
        if (e.propertyName !== 'width') return;
        el.removeEventListener('transitionend', done);
        unpinRect(el);
      });
    }

    backdrop.classList.remove('show');
    document.body.style.overflow = '';
    if (expandedCard === el) expandedCard = null;
  }

  function pinRect(el, rect) {
    el.style.position = 'fixed';
    el.style.margin = '0';
    el.style.top = `${rect.top}px`;
    el.style.left = `${rect.left}px`;
    el.style.width = `${rect.width}px`;
    el.style.height = `${rect.height}px`;
  }

  function unpinRect(el) {
    el.classList.remove('is-animating');
    el.style.position = el.style.margin = el.style.top = el.style.left = el.style.width = el.style.height = '';
    if (placeholder) {
      placeholder.remove();
      placeholder = null;
    }
  }

  backdrop.addEventListener('click', () => expandedCard && collapseCard(expandedCard));
  backdrop.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'opacity' && !backdrop.classList.contains('show')) backdrop.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && expandedCard) collapseCard(expandedCard);
  });

  loadConfig().then(applyConfig).then(startViewer).catch((error) => console.error(error));

  function startViewer(BUNDLE) {
    const stage = $('stage');
    const canvas = $('canvas');
    const wipeLine = $('wipe-line');
    const switcher = document.querySelector('.switch');
    const tabs = [...switcher.querySelectorAll('[role="tab"]')];
    const afterTab = $('tab-after');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

    let view = 'before';
    let ready = false;

    // The progress bar/MB counter and the error message both come from the viewer's
    // own built-in loadingIndicator now (see the constructor below) rather than being
    // hand-rolled here - onError only needs to log and stop the "loading" spinner state
    // the After tab shows.
    const fail = (error) => {
      afterTab.removeAttribute('data-loading');
      console.error(error);
    };

    function settle() {
      ready = true;
      stage.classList.add('live');
      afterTab.removeAttribute('data-loading');
      show('after');
    }

    function onReadyFailed() {} // onError already reported it; this only stops the rejection

    // ---------- before / after ----------

    function show(next, { focus = false } = {}) {
      if (next === view) return;
      view = next;
      stage.dataset.view = next;
      switcher.dataset.view = next;
      for (const tab of tabs) {
        const on = tab.dataset.view === next;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
        if (on && focus) tab.focus();
      }

      if (!reduceMotion.matches) {
        wipeLine.classList.remove('run-in', 'run-out');
        void wipeLine.offsetWidth; // restart the animation
        wipeLine.classList.add(next === 'after' ? 'run-in' : 'run-out');
      }

      if (next === 'after') {
        viewer.start();
        if (!ready) afterTab.setAttribute('data-loading', '');
      } else if (ready) {
        // Let the wipe finish uncovering the gallery before the render goes still.
        setTimeout(() => view === 'before' && viewer.stop(), reduceMotion.matches ? 0 : 900);
      }
    }

    for (const tab of tabs) tab.addEventListener('click', () => show(tab.dataset.view));

    // ---------- the store's own buttons ----------

    const toast = $('toast');
    let toastTimer = 0;
    const say = (text) => {
      toast.textContent = text;
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
    };
    document.querySelector('.btn-cart').addEventListener('click', () => say('예시 화면이라 장바구니에 담기지 않아요'));
    document.querySelector('.btn-buy').addEventListener('click', () => say('예시 화면이라 실제 주문은 진행되지 않아요'));

    const [searchBtn, menuBtn, headerCartBtn] = document.querySelectorAll('.shop-nav button');
    searchBtn.addEventListener('click', () => say('예시 화면이라 검색은 동작하지 않아요'));
    menuBtn.addEventListener('click', () => say('예시 화면이라 메뉴는 동작하지 않아요'));
    headerCartBtn.addEventListener('click', () => say('예시 화면이라 장바구니에 담기지 않아요'));

    // ---------- viewer ----------

    const viewer = new Snap3dViewer(canvas, BUNDLE, {
      loadingIndicator: { color: '#ff5252' }, // snap3d's own accent; the bar/MB-counter/
                                               // error text themselves are the viewer's
      passthrough: true, // #canvas overlaps the buy box (see --viewer-scale in index.html)
      onError: fail,
    });
    window.viewer = viewer; // a console handle
    afterTab.setAttribute('data-loading', '');
    viewer.ready.then(settle, onReadyFailed);
  }
})();

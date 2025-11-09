// Lenis + GSAP smooth scrolling and storytelling animations

// 1) Init Lenis
const lenis = new Lenis({
  lerp: 0.12,
  smoothWheel: true,
});
lenis.on('scroll', () => ScrollTrigger.update());
function raf(time){
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// 2) GSAP + ScrollTrigger
// Register plugin
// eslint-disable-next-line no-undef
if (typeof gsap !== 'undefined') {
  // eslint-disable-next-line no-undef
  gsap.registerPlugin(ScrollTrigger);
}

// Helper: fade up
function fadeUp(targets, opts = {}){
  // eslint-disable-next-line no-undef
  return gsap.fromTo(targets,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', ...opts }
  );
}

// Respect reduced motion
const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

// HERO enter animations
if (motionOK){
  fadeUp('.overtitle', { delay: 0.1 });
  // Title reveal with clip-path for a cleaner, modern look
  // eslint-disable-next-line no-undef
  gsap.fromTo('.title', { clipPath: 'inset(0 0 100% 0)', opacity: 1 }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out', delay: 0.15 });
  fadeUp('.subtitle', { delay: 0.45 });
  fadeUp('.btn--primary', { delay: 0.55 });
}

// Parallax blobs/roses
// eslint-disable-next-line no-undef
if (motionOK) {
  ['.blob--tl','.blob--tr','.blob--bl','.blob--br'].forEach((sel, i) => {
    // eslint-disable-next-line no-undef
    gsap.to(sel, {
      yPercent: i % 2 === 0 ? -10 : 12,
      xPercent: i % 2 === 0 ? 8 : -6,
      ease: 'none',
      scrollTrigger: {
        trigger: '#inicio',
        start: 'top top',
        end: '+=120% ',
        scrub: true,
      }
    })
  })
}

// Floating roses loop (gentle)
// We replace old roses with SVG flowers (see initFlowers below)

// MESSAGE section: pin + sequential lines
(function initMessage(){
  const section = document.querySelector('#mensaje');
  if(!section) return;
  const lines = section.querySelectorAll('.message__line');

  if (motionOK){
    // eslint-disable-next-line no-undef
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=220%',
      scrub: 1,
      pin: true,
    });

    // eslint-disable-next-line no-undef
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=220%',
        scrub: 1,
      }
    });

    tl.add(fadeUp('.message__title', { duration: 0.6 }))
      .to({}, { duration: 0.25 })
      .to(lines[0], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.25 })
      .to(lines[0], { opacity: 0, duration: 0.2 })
      .to(lines[1], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.25 })
      .to(lines[1], { opacity: 0, duration: 0.2 })
      .to(lines[2], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.25 });
  } else {
    // No motion: show all lines statically
    lines.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
})();

// Unified collision-aware flowers for all sections
(function initSectionFlowers(){
  // ---- Config -----------------------------------------------------------
  const BREAKPOINT = 640;          // px
  const IMAGES_TOTAL = 26;         // 1..11 png
  const MAX_TRIES = 25;            // placement attempts per flower
  const SAFE_MARGIN = 8;           // px inside section bounds
  const SPACING_RATIO = 0.18;      // gap based on flower width
  const AVOID_PAD = 8;             // px expand around content boxes

  // Sections to decorate with per-section counts and sizes
  const SECTIONS = [
    { selector: '.hero',      desktop: 10, mobile: 6,  size: [180, 260] },
    { selector: '#mensaje',   desktop: 6,  mobile: 4,  size: [150, 210] },
    { selector: '#detalles',  desktop: 11, mobile: 6,  size: [140, 220] },
    { selector: '#ubicacion', desktop: 5,  mobile: 3,  size: [140, 180] },
    { selector: '#rsvp',      desktop: 5,  mobile: 3,  size: [140, 180] },
  ];

  // ---- Utilities --------------------------------------------------------
  const isMobile = () => window.matchMedia(`(max-width:${BREAKPOINT}px)`).matches;
  const rand = (a,b)=> Math.random() * (b-a) + a;
  const rint = (a,b)=> Math.floor(rand(a, b+1));
  const shuffle = (arr)=> arr.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);

  // Convert a DOMRect to section-local coordinates
  function toLocal(rect, rootRect){
    return {
      left: rect.left - rootRect.left,
      top: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
      get right(){ return this.left + this.width; },
      get bottom(){ return this.top + this.height; },
    };
  }

  // Axis-aligned bounding-box intersection
  function intersects(a, b){ return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom); }
  function expand(rect, pad){
    return { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad*2, height: rect.height + pad*2,
      get right(){return this.left + this.width}, get bottom(){return this.top + this.height} };
  }

  // Ensure a dedicated background container exists as first child
  function ensureBgContainer(section){
    let box = section.querySelector(':scope > .flowers-bg');
    if (!box){
      box = document.createElement('div');
      box.className = 'flowers-bg';
      section.prepend(box);
    } else {
      // Kill tweens then clear
      if (typeof gsap !== 'undefined') box.querySelectorAll('img.flower').forEach(el => gsap.killTweensOf(el));
      box.innerHTML = '';
    }
    return box;
  }

  // Build flowers for a single section
  function buildSection(entry){
    const sec = document.querySelector(entry.selector);
    if (!sec) return;

    const box = ensureBgContainer(sec);
    const sRect = sec.getBoundingClientRect();
    const W = Math.max(1, Math.floor(sRect.width));
    const H = Math.max(1, Math.floor(sRect.height));
    if (W < 40 || H < 40) return;

    const count = isMobile() ? entry.mobile : entry.desktop;
    const [minPx, maxPx] = entry.size;

    // Hero gets a special circle-distance placement with generous border and fallback
    if (entry.selector === '.hero'){
      const MIN_BORDER = 12;                   // px from edges to keep fully visible
      const MIN_GOAL = isMobile() ? 3 : 6;     // minimum flowers to aim for
      const ids = shuffle(Array.from({length: IMAGES_TOTAL}, (_,i)=> i+1)).slice(0, Math.max(count, MIN_GOAL));
      const placed = []; // store {cx, cy, size}

      function tooClose(cx, cy, size, spacing){
        const minCenterDist = Math.max(size, size) * spacing; // == size * spacing
        for (const p of placed){
          const dx = p.cx - cx, dy = p.cy - cy;
          if (Math.hypot(dx, dy) < Math.max(p.size, size) * spacing) return true;
        }
        return false;
      }

      ids.forEach(id => {
        let tries = 0; let ok = false; let spacingFactor = 0.75; // center-to-center base factor
        let rect = null; const size = rint(minPx, maxPx);
        // compute allowed center range honoring MIN_BORDER
        const minCX = MIN_BORDER + size/2;
        const maxCX = W - MIN_BORDER - size/2;
        const minCY = MIN_BORDER + size/2;
        const maxCY = H - MIN_BORDER - size/2;
        if (maxCX < minCX || maxCY < minCY) return; // too small

        while (tries < 30 && !ok){
          tries++;
          const cx = rand(minCX, maxCX);
          const cy = rand(minCY, maxCY);

          if (tooClose(cx, cy, size, spacingFactor)){
            if (tries >= 30){
              // fallback: relax spacing slightly and retry this flower once more
              spacingFactor *= 0.9; // reduce by 10%
              tries = 0;
            }
            continue;
          }
          // Convert to top-left rect fully inside bounds
          const left = Math.round(cx - size/2);
          const top  = Math.round(cy - size/2);
          rect = { left, top, width: size, height: size };
          ok = true;
        }

        if (!ok) return; // skip this id if still no space

        const img = new Image();
        img.className = 'flower';
        img.decoding = 'async';
        img.loading = 'lazy';
        img.alt = '';
        img.src = `assets/flowers/${id}.png`;
        img.style.position = 'absolute';
        img.style.left = rect.left + 'px';
        img.style.top = rect.top + 'px';
        img.style.width = rect.width + 'px';
        img.style.transform = `rotate(${rint(-18,18)}deg)`;
        img.style.willChange = 'transform';
        img.style.transition = 'transform .45s ease, opacity .3s ease';
        box.appendChild(img);

        placed.push({ cx: rect.left + rect.width/2, cy: rect.top + rect.height/2, size });

        if (motionOK && typeof gsap !== 'undefined'){
          const amp = isMobile() ? 8 : 12;
          const rot = isMobile() ? 4 : 6;
          const dur = 3.6 + Math.random()*2.2;
          // eslint-disable-next-line no-undef
          gsap.to(img, { y: (Math.random()<0.5?-amp:amp), rotation: `+=${Math.random()<0.5?-rot:rot}`, duration: dur, yoyo:true, repeat:-1, ease:'sine.inOut' });
        }
      });

      // If after placement we didn’t reach the minimum target, try adding more with relaxed spacing
      if (placed.length < MIN_GOAL){
        const remaining = shuffle(Array.from({length: IMAGES_TOTAL}, (_,i)=> i+1).filter(id => !box.querySelector(`img[src$='/${id}.png']`)));
        let spacingFactor = 0.68; // slightly more relaxed for the catch-up pass
        for (const id of remaining){
          if (placed.length >= MIN_GOAL) break;
          const size = rint(minPx, maxPx);
          const minCX = MIN_BORDER + size/2, maxCX = W - MIN_BORDER - size/2;
          const minCY = MIN_BORDER + size/2, maxCY = H - MIN_BORDER - size/2;
          if (maxCX < minCX || maxCY < minCY) break;
          let tries = 0, ok = false, rect = null;
          while (tries < 25 && !ok){
            tries++;
            const cx = rand(minCX, maxCX), cy = rand(minCY, maxCY);
            // check distance
            let close = false;
            for (const p of placed){ if (Math.hypot(p.cx - cx, p.cy - cy) < Math.max(p.size, size) * spacingFactor){ close = true; break; } }
            if (close) continue;
            const left = Math.round(cx - size/2), top = Math.round(cy - size/2);
            rect = { left, top, width: size, height: size };
            ok = true;
          }
          if (!ok) continue;
          const img = new Image();
          img.className = 'flower'; img.decoding = 'async'; img.loading = 'lazy'; img.alt='';
          img.src = `assets/flowers/${id}.png`;
          img.style.position='absolute'; img.style.left=rect.left+'px'; img.style.top=rect.top+'px'; img.style.width=rect.width+'px';
          img.style.transform=`rotate(${rint(-18,18)}deg)`; img.style.willChange='transform'; img.style.transition='transform .45s ease, opacity .3s ease';
          box.appendChild(img);
          placed.push({ cx: rect.left + rect.width/2, cy: rect.top + rect.height/2, size });
          if (motionOK && typeof gsap !== 'undefined'){
            const amp = isMobile() ? 8 : 12; const rot = isMobile() ? 4 : 6; const dur = 3.6 + Math.random()*2.2;
            // eslint-disable-next-line no-undef
            gsap.to(img, { y:(Math.random()<0.5?-amp:amp), rotation:`+=${Math.random()<0.5?-rot:rot}`, duration:dur, yoyo:true, repeat:-1, ease:'sine.inOut' });
          }
        }
      }
      return; // hero handled
    }

    // Default: AABB with spacing and avoidance of content areas
    const avoidEls = [ ...sec.querySelectorAll('.card, .message, .grid, .container .card') ];
    const avoid = avoidEls.map(el => expand(toLocal(el.getBoundingClientRect(), sRect), AVOID_PAD));
    const ids = shuffle(Array.from({length: IMAGES_TOTAL}, (_,i)=> i+1)).slice(0, count);
    const placed = [];
    ids.forEach(id => {
      let tries = 0, ok = false, rect = null;
      const size = rint(minPx, maxPx);
      const gap = Math.max(10, Math.round(size * SPACING_RATIO));
      while (tries < MAX_TRIES && !ok){
        tries++;
        const left = rint(SAFE_MARGIN, Math.max(SAFE_MARGIN, W - size - SAFE_MARGIN));
        const top  = rint(SAFE_MARGIN, Math.max(SAFE_MARGIN, H - size - SAFE_MARGIN));
        const cand = { left, top, width: size, height: size, get right(){return this.left + this.width}, get bottom(){return this.top + this.height} };
        if (avoid.some(r => intersects(cand, r))) continue;
        if (placed.some(r => intersects(expand(cand, gap), expand(r, gap)))) continue;
        ok = true; rect = cand;
      }
      if (!ok) return;
      const img = new Image(); img.className='flower'; img.decoding='async'; img.loading='lazy'; img.alt='';
      img.src=`assets/flowers/${id}.png`;
      img.style.position='absolute'; img.style.left=rect.left+'px'; img.style.top=rect.top+'px'; img.style.width=rect.width+'px';
      img.style.transform=`rotate(${rint(-18,18)}deg)`; img.style.willChange='transform'; img.style.transition='transform .45s ease, opacity .3s ease';
      box.appendChild(img); placed.push(rect);
      if (motionOK && typeof gsap !== 'undefined'){
        const amp = isMobile() ? 8 : 12; const rot = isMobile() ? 4 : 6; const dur = 3.6 + Math.random()*2.2;
        // eslint-disable-next-line no-undef
        gsap.to(img, { y:(Math.random()<0.5?-amp:amp), rotation:`+=${Math.random()<0.5?-rot:rot}`, duration:dur, yoyo:true, repeat:-1, ease:'sine.inOut' });
      }
    });
  }

  // Build all sections
  function buildAll(){ SECTIONS.forEach(buildSection); }
  buildAll();

  // Rebuild on resize (debounced)
  let t; window.addEventListener('resize', ()=>{ clearTimeout(t); t=setTimeout(buildAll, 180); });
})();

// DETAILS: cards stagger in when visible
(function initDetails(){
  const section = document.querySelector('#detalles');
  if(!section) return;
  const cards = section.querySelectorAll('.card');
  // eslint-disable-next-line no-undef
  gsap.from(cards, {
    opacity: 0,
    y: 24,
    duration: 0.6,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
    }
  });
})();

// Smooth anchor links with Lenis
(function initAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if(!id || id === '#') return;
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -10 });
    });
  });
})();

// Section reveals (general polish)
(function revealSections(){
  if(!motionOK || typeof gsap === 'undefined') return;
  // eslint-disable-next-line no-undef
  gsap.utils.toArray('.panel').forEach((sec)=>{
    // eslint-disable-next-line no-undef
    gsap.from(sec, {
      opacity: 0,
      y: 26,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: { trigger: sec, start: 'top 80%' }
    });
  });
})();

// Floating petals in hero
(function petals(){
  if(!motionOK || typeof gsap === 'undefined') return;

  // Create or reuse a full-page layer for petals
  let layer = document.querySelector('.petals-layer');
  if (!layer){
    layer = document.createElement('div');
    layer.className = 'petals-layer';
    // Prepend so it behaves visually like a background
    document.body.prepend(layer);
  }

  const MAX_ACTIVE = 20; // fewer concurrent petals for a calmer, professional look
  let active = 0;

  function rand(min, max){ return Math.random() * (max - min) + min; }
  function pick(array){ return array[Math.floor(Math.random() * array.length)]; }

  function spawnPetal(){
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const el = document.createElement('span');
    // random variant p1/p2/p3 for slight size/color change
    const variant = pick(['', ' p2', ' p3']);
    el.className = 'petal' + variant;

    // Top-only spawn (leaf-like fall)
    const startX = rand(-40, vw + 40);
    const startY = rand(-140, -60);
    const endY = vh + 80;
    // Gentle horizontal drift span
    const driftSpan = rand(vw * 0.12, vw * 0.28);
    // Direction of drift
    const endX = startX + (Math.random() < 0.5 ? -driftSpan : driftSpan);

    el.style.left = startX + 'px';
    el.style.top = startY + 'px';
    el.style.transform = `rotate(${rand(-20, 20)}deg)`;
    layer.appendChild(el);
    active++;

    const duration = rand(12, 22); // slower, more graceful fall
    // Main vertical travel with slight rotation change
    // eslint-disable-next-line no-undef
    const travel = gsap.to(el, {
      x: endX - startX,
      y: endY - startY,
      rotation: `+=${rand(-50, 50)}`,
      ease: 'none',
      duration,
      onComplete(){
        active--;
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }
    });

    // Side-to-side sway (leaf-like)
    // eslint-disable-next-line no-undef
    gsap.to(el, {
      x: `+=${rand(30, 80) * (Math.random() < 0.5 ? -1 : 1)}`,
      rotation: `+=${rand(8, 18) * (Math.random() < 0.5 ? -1 : 1)}`,
      duration: rand(1.6, 2.6),
      yoyo: true,
      repeat: Math.ceil(duration / 2),
      ease: 'sine.inOut'
    });
  }

  function scheduleNext(){
    const delay = rand(900, 2200); // slower spawn cadence
    setTimeout(()=>{
      if (active < MAX_ACTIVE) spawnPetal();
      scheduleNext();
    }, delay);
  }

  // Warm start: sprinkle some initial petals
  const initial = 6;
  for (let i=0;i<initial;i++) spawnPetal();
  scheduleNext();
})();

// (replaced by unified collision-aware initSectionFlowers above)

// LEAFLET MAP
(function initMap(){
  const wrap = document.getElementById('mapWrap');
  if(!wrap || typeof L === 'undefined') return;

  // Create inner div for Leaflet
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  mapDiv.style.height = '100%';
  wrap.appendChild(mapDiv);

  const gmapsUrl = wrap.getAttribute('data-gmaps-url');
  const address = wrap.getAttribute('data-address') || '';

  const openBtn = document.getElementById('openGmaps');
  if(openBtn && gmapsUrl) openBtn.href = gmapsUrl;

  // Defaults (will be replaced by data-lat/lng or geocode)
  let lat = parseFloat(wrap.getAttribute('data-lat'));
  let lng = parseFloat(wrap.getAttribute('data-lng'));

  // Init map early with a neutral view
  const map = L.map(mapDiv, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
  }).setView([0,0], 2);

  // Use Carto Positron as base (warm, light) with fallback to standard OSM
  const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  });
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  });
  carto.addTo(map);
  carto.on('tileerror', () => {
    if(!map.hasLayer(osm)) osm.addTo(map);
  });

  function addMarkerAndCenter(_lat, _lng){
    // Inline SVG teardrop marker: width=38, height=50. Tip at (19,50) -> iconAnchor bottom-center.
    const svg = `\n<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 38 50\" width=\"38\" height=\"50\" aria-hidden=\"true\">\n  <defs>\n    <linearGradient id=\"pinGrad\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">\n      <stop offset=\"0%\" stop-color=\"#f6e3ea\"/>\n      <stop offset=\"55%\" stop-color=\"#e08aa8\"/>\n      <stop offset=\"100%\" stop-color=\"#c76b8e\"/>\n    </linearGradient>\n    <filter id=\"pinShadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\">\n      <feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"4\" flood-color=\"rgba(224,138,168,0.45)\"/>\n    </filter>\n  </defs>\n  <path d=\"M19 0C8.5 0 0 8.6 0 19c0 11.3 9.2 20.8 19 31 9.8-10.2 19-19.7 19-31C38 8.6 29.5 0 19 0zm0 28a9 9 0 110-18 9 9 0 010 18z\" fill=\"url(#pinGrad)\" filter=\"url(#pinShadow)\"/>\n  <circle cx=\"19\" cy=\"19\" r=\"6\" fill=\"#fff\" opacity=\"0.85\"/>\n</svg>`;
    const icon = L.divIcon({
      className: 'marker-pin',
      html: svg,
      iconSize: [38,50],
      iconAnchor: [19,50], // bottom-center (tip)
      popupAnchor: [0,-25]
    });
    const marker = L.marker([_lat, _lng], { icon, riseOnHover: true }).addTo(map);
    const popupHtml = `
      <div class=\"map-popup__title\"><strong>Majito's </strong>Birthday</div>
      ${address ? `<div class=\"map-popup__addr\">${address}</div>` : ''}
    `;
    marker.bindPopup(popupHtml, { className: 'map-popup' });
    // Always center after marker placement
    map.setView([_lat, _lng], 16, { animate: true });
  }

  if(!Number.isNaN(lat) && !Number.isNaN(lng)){
    addMarkerAndCenter(lat, lng);
  }else if(address){
    // Try geocoding via Nominatim (public OSM) as a graceful auto-center
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    fetch(url, { headers: { 'Accept': 'application/json' }})
      .then(r => r.json())
      .then(list => {
        if(Array.isArray(list) && list.length){
          const p = list[0];
          addMarkerAndCenter(parseFloat(p.lat), parseFloat(p.lon));
        } else {
          // Keep world view
        }
      })
      .catch(()=>{/* swallow */});
  }
})();

// GIFT QR MODAL
(function initGiftModal(){
  const open = document.getElementById('giftOpen');
  const modal = document.getElementById('giftModal');
  const img = document.getElementById('giftImg');
  const modalContent = modal ? modal.querySelector('.modal__content') : null;
  const closeBtns = modal ? modal.querySelectorAll('[data-close]') : [];
  const downloadBtn = document.getElementById('giftDownload');
  const closeX = modal ? modal.querySelector('.modal__close-x') : null;
  if(!open || !modal || !img || !downloadBtn) return;

  const REMOTE_URL = 'https://i.ibb.co/yFFc2XYW/qr-code.png';
  const LOCAL_URL = 'assets/qr-code.png';
  const FILENAME = 'qr-majito.png';
  let currentUrl = REMOTE_URL;

  let hasDownloaded = false;
  let guardShown = false;
  let guardImgEl = null;

  function resetGuard(){
    guardShown = false;
    modal.classList.remove('modal--guarded');
    if (closeX) closeX.hidden = true;
    if (guardImgEl && guardImgEl.parentNode) guardImgEl.parentNode.removeChild(guardImgEl);
    guardImgEl = null;
  }

  function openModal(){
    // Try remote first; if it fails, fallback to local
    img.removeAttribute('src');
    currentUrl = REMOTE_URL;
    img.onerror = () => {
      // fallback to local file if remote fails to load
      currentUrl = LOCAL_URL;
      img.onerror = null; // avoid loops
      img.src = LOCAL_URL;
    };
    img.src = REMOTE_URL;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    hasDownloaded = false;
    resetGuard();
    document.addEventListener('keydown', onKey);
  }
  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    img.classList.remove('is-zoomed');
    document.removeEventListener('keydown', onKey);
    resetGuard();
  }
  function onKey(e){ if(e.key === 'Escape') closeModal(); }

  open.addEventListener('click', openModal);
  // Backdrop uses [data-close] and should close regardless
  const backdrop = modal.querySelector('.modal__backdrop');
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // The visible Close button in actions is intercepted
  const closeBtn = document.getElementById('giftClose');
  if (closeBtn){
    closeBtn.addEventListener('click', (e)=>{
      if (!hasDownloaded){
        e.preventDefault();
        // Show guard sticker and reveal the top-right X
        if (!guardShown){
          guardShown = true;
          modal.classList.add('modal--guarded');
          if (closeX) closeX.hidden = false;
          // Create guard image overlayed above the close button
          if (modalContent){
            const btnRect = closeBtn.getBoundingClientRect();
            const contentRect = modalContent.getBoundingClientRect();
            guardImgEl = document.createElement('img');
            guardImgEl.src = 'assets/images/sticker.png';
            guardImgEl.alt = '';
            guardImgEl.className = 'sticker-guard';
            // place centered over the close button
            const desiredWidth = Math.min(180, Math.max(120, Math.floor(window.innerWidth * 0.3)));
            guardImgEl.style.width = desiredWidth + 'px';
            const left = (btnRect.left - contentRect.left) + (btnRect.width/2) - (desiredWidth/2);
            const top = (btnRect.top - contentRect.top) - (desiredWidth * 0.6);
            guardImgEl.style.left = Math.max(0, left) + 'px';
            guardImgEl.style.top = Math.max(0, top) + 'px';
            modalContent.appendChild(guardImgEl);
          }
        }
        return;
      }
      closeModal();
    });
  }

  if (closeX){
    closeX.addEventListener('click', closeModal);
  }

  img.addEventListener('click', ()=>{
    img.classList.toggle('is-zoomed');
  });

  async function downloadImage(url, filename){
    // Try download of currently displayed image; on failure, try the other source; else open in new tab
    async function attempt(u){
      const res = await fetch(u, { mode: 'cors' });
      if(!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    }
    try{
      await attempt(url);
    }catch(err){
      try{
        await attempt(url === REMOTE_URL ? LOCAL_URL : REMOTE_URL);
      }catch(err2){
        window.open(url, '_blank');
      }
    }
    // Consider downloaded once user clicks and we attempted
    hasDownloaded = true;
    // If a guard was shown, remove it to allow closing
    resetGuard();
  }
  downloadBtn.addEventListener('click', ()=> downloadImage(currentUrl, FILENAME));
})();

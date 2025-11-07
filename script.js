// Lenis + GSAP smooth scrolling and storytelling animations

// Respect reduced motion (single source of truth)
const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
const isDesktop = window.matchMedia('(min-width: 768px)').matches;

// 1) Init Lenis (only when motion is allowed)
let lenis = null;
if (motionOK) {
  lenis = new Lenis({
    lerp: isDesktop ? 0.12 : 0.08,      // Snappier on desktop, gentle on mobile
    smoothWheel: isDesktop,             // Disable wheel smoothing on mobile
    touchMultiplier: 1.4,               // Balanced touch response
    wheelMultiplier: 0.85,              // Slightly smoother wheel
  });
  // Keep ScrollTrigger in sync with virtual scrolling
  lenis.on('scroll', () => { if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update(); });
  function raf(time){
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// 2) GSAP + ScrollTrigger
// Register plugin and set up responsive matchMedia helpers
// eslint-disable-next-line no-undef
let mm = null;
// eslint-disable-next-line no-undef
if (typeof gsap !== 'undefined') {
  // eslint-disable-next-line no-undef
  gsap.registerPlugin(ScrollTrigger);
  // eslint-disable-next-line no-undef
  mm = gsap.matchMedia();
  // Refresh triggers once all assets are loaded (positions will be accurate)
  window.addEventListener('load', () => {
    if (typeof ScrollTrigger !== 'undefined') {
      try { ScrollTrigger.refresh(); } catch(_){}
    }
    // Ensure Lenis recalculates on layout changes
    if (lenis && typeof lenis.resize === 'function') {
      try { lenis.resize(); } catch(_){}
    }
  });
}

// Helper: fade up - optimized for mobile
function fadeUp(targets, opts = {}){
  // Skip animation on mobile for better performance
  if (window.innerWidth < 768) {
    // eslint-disable-next-line no-undef
    return gsap.set(targets, { opacity: 1, y: 0 });
  }
  // eslint-disable-next-line no-undef
  return gsap.fromTo(targets,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', ...opts }
  );
}

// HERO enter animations (responsive & motion-aware)
if (mm) {
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    fadeUp('.overtitle', { delay: 0.1 });
    // Title reveal with clip-path for a cleaner, modern look
    // eslint-disable-next-line no-undef
    gsap.fromTo('.title', { clipPath: 'inset(0 0 100% 0)', opacity: 1 }, { clipPath: 'inset(0 0 0% 0)', duration: 1.0, ease: 'power3.out', delay: 0.15 });
    fadeUp('.subtitle', { delay: 0.45 });
    fadeUp('.btn--primary', { delay: 0.55 });
  });
  // Mobile-specific subtle hero reveal (no clipPath heavy effect)
  mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
    // eslint-disable-next-line no-undef
    gsap.from('.hero__content', { opacity:0, y:30, duration:0.8, ease:'power2.out' });
  });
}

// Parallax blobs/roses - desktop only for performance
if (mm) {
  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    ['.blob--tl','.blob--tr','.blob--bl','.blob--br'].forEach((sel, i) => {
      // eslint-disable-next-line no-undef
      gsap.to(sel, {
        yPercent: i % 2 === 0 ? -8 : 10,  // Reduced movement
        xPercent: i % 2 === 0 ? 6 : -4,   // Reduced movement
        ease: 'none',
        scrollTrigger: {
          trigger: '#inicio',
          start: 'top top',
          end: '+=100%',  // Reduced scroll distance
          scrub: 0.8,     // Smoother scrub
        }
      })
    })
  });
}

// Floating roses loop (gentle)
// We replace old roses with SVG flowers (see initFlowers below)

// MESSAGE section: pin + sequential lines
(function initMessage(){
  const section = document.querySelector('#mensaje');
  if(!section) return;
  const lines = section.querySelectorAll('.message__line');

  if (mm) {
    // Desktop pinned storytelling
    mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      // eslint-disable-next-line no-undef
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=180%', // Reduced scroll length on mobile
        scrub: 0.8,    // Smoother scrub
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
    });
    // Mobile: simple progressive reveal on scroll (no pin)
    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
      // Title
      fadeUp('.message__title', { duration:0.6 });
      // Lines: appear when each reaches viewport
      lines.forEach((ln, idx) => {
        // eslint-disable-next-line no-undef
        gsap.from(ln, {
          opacity:0,
          y:22,
          duration:0.45,
          ease:'power2.out',
          delay: idx * 0.15,
          scrollTrigger:{
            trigger: ln,
            start: 'top 85%',
            toggleActions: 'play none none none'
          }
        });
      });
    });
  }
  if (!motionOK) {
    // No motion: show all lines statically
    lines.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
})();

// DETAILS: cards stagger in when visible
(function initDetails(){
  const section = document.querySelector('#detalles');
  if(!section) return;
  const cards = section.querySelectorAll('.card');
  if (motionOK && typeof gsap !== 'undefined') {
    // eslint-disable-next-line no-undef
    gsap.from(cards, {
      opacity: 0,
      y: 24,
      duration: 0.55,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
      }
    });
  } else {
    cards.forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
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
      if (lenis) {
        lenis.scrollTo(target, { offset: -10 });
      } else {
        const top = target.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop) - 10;
        window.scrollTo({ top, behavior: motionOK ? 'smooth' : 'auto' });
      }
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

  const MAX_ACTIVE = isDesktop ? 20 : 10; // fewer on mobile for a calmer, professional look
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
      // Skip spawning when tab is hidden or too many are active
      if (!document.hidden && active < MAX_ACTIVE) spawnPetal();
      scheduleNext();
    }, delay);
  }

  // Warm start: sprinkle some initial petals
  const initial = 6;
  for (let i=0;i<initial;i++) spawnPetal();
  scheduleNext();
})();

// Decorative images across sections (flowers + beers)
(function initDecor(){
  const isMobile = window.innerWidth < 768;
  const MAX_SIZE = 140; // px cap requested
  const MIN_SIZE = 40;
  const flowerCount = (sectionLarge, sectionSmall) => isMobile ? sectionSmall : sectionLarge;

  // Helpers
  function rand(min, max){ return Math.random() * (max - min) + min; }
  function randomSize(min=MIN_SIZE, max=MAX_SIZE){ return Math.round(rand(min, max)) + 'px'; }

  // Edge-aligned position with slight randomness
  function edgePos(i, total){
    const pos = {};
    const margin = 6; // vw/vh
    const section = i / total;
    if (section < 0.25){ pos.top = margin + 'vh'; pos.left = (margin + (100 - margin*2) * (i / (total*0.25))) + 'vw'; }
    else if (section < 0.5){ pos.right = margin + 'vw'; pos.top = (margin + (100 - margin*2) * ((i - total*0.25)/(total*0.25))) + 'vh'; }
    else if (section < 0.75){ pos.bottom = margin + 'vh'; pos.right = (margin + (100 - margin*2) * ((i - total*0.5)/(total*0.25))) + 'vw'; }
    else { pos.left = margin + 'vw'; pos.bottom = (margin + (100 - margin*2) * ((i - total*0.75)/(total*0.25))) + 'vh'; }
    const o = rand(1.5, 5.5);
    if (pos.top) pos.top = `calc(${pos.top} + ${o}vh)`;
    if (pos.right) pos.right = `calc(${pos.right} + ${o}vw)`;
    if (pos.bottom) pos.bottom = `calc(${pos.bottom} + ${o}vh)`;
    if (pos.left) pos.left = `calc(${pos.left} + ${o}vw)`;
    return pos;
  }

  // Sources
  const flowerTotal = 11;
  const flowerSrc = (i) => `assets/flowers/${i}.png`;
  const beerSrcs = [ 'assets/images/beer1.png', 'assets/images/beer2.png' ];

  const sections = [
    { el: document.querySelector('.hero__bg'), flowers: flowerCount(18, 10), beers: 1 },
    { el: document.querySelector('#mensaje'), flowers: flowerCount(8, 5), beers: 0 },
    { el: document.querySelector('#detalles'), flowers: flowerCount(8, 5), beers: 1 },
    { el: document.querySelector('#ubicacion'), flowers: flowerCount(6, 4), beers: 0 },
    { el: document.querySelector('#rsvp'), flowers: flowerCount(6, 4), beers: 1 },
  ];

  let fIdx = 1;
  sections.forEach(({ el, flowers, beers }) => {
    if (!el) return;
    el.style.position = el.style.position || 'relative';

    const total = flowers + beers;
    for (let i=0; i<total; i++){
      const isBeer = i >= flowers; // put beers after flowers for edge distribution
      const img = document.createElement('img');
      img.className = 'decor ' + (isBeer ? 'decor--beer' : 'decor--flower');
      img.decoding = 'async';
      img.loading = 'lazy';
      img.alt = '';

      const pos = edgePos(i, Math.max(total, 8));
      Object.assign(img.style, pos);
      const size = isBeer ? randomSize(100, MAX_SIZE) : randomSize(MIN_SIZE, MAX_SIZE);
      img.style.width = size;
      img.style.transform = `rotate(${Math.round(rand(-18, 18))}deg)`;
      img.onerror = () => { img.style.display = 'none'; };
      img.src = isBeer ? beerSrcs[Math.floor(rand(0, beerSrcs.length))] : flowerSrc(fIdx);

      // For non-hero sections, insert before first child so it layers behind container content (with z-index fix as fallback)
      if (!el.classList.contains('hero__bg')) {
        el.insertBefore(img, el.firstChild);
      } else {
        el.appendChild(img);
      }
      if (!isBeer){ fIdx++; if (fIdx > flowerTotal) fIdx = 1; }
    }
  });

  // Gentle float animations
  if (motionOK && typeof gsap !== 'undefined'){
    // eslint-disable-next-line no-undef
    gsap.utils.toArray('.decor').forEach((el, i) => {
      const y = i % 2 ? -8 : 10;
      const r = i % 2 ? -5 : 5;
      const d = 3 + Math.random()*1.6;
      // eslint-disable-next-line no-undef
      gsap.to(el, { y, rotation: `+=${r}`, duration: d, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
  }
})();

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
  }).setView([0,0], 2);

  // Use a clean light basemap, with fallback to standard OSM
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
    const icon = L.divIcon({
      className: 'marker-pin',
      iconSize: [30,30],
      popupAnchor: [0,-16]
    });
    const marker = L.marker([_lat, _lng], { icon }).addTo(map);
    marker.bindPopup('<b>Majito Birthday</b><br>'+ (address || 'Ubicación'));
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
  // Preload QR early (both remote and fallback) for instant display
  function preloadQR(){
    const sources = [REMOTE_URL, LOCAL_URL];
    sources.forEach(src => {
      const im = new Image();
      im.decoding = 'async';
      im.loading = 'eager';
      im.src = src;
    });
  }
  // Kick off preload shortly after load to avoid competing with critical content
  window.addEventListener('load', ()=>{ setTimeout(preloadQR, 200); });
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
    // If image is already cached (preloaded), just set remote; fallback only on error
    currentUrl = REMOTE_URL;
    img.onerror = () => {
      currentUrl = LOCAL_URL;
      img.onerror = null;
      img.src = LOCAL_URL;
    };
    // Avoid flicker: keep previous src if already loaded remote
    if (img.src !== REMOTE_URL && img.src !== LOCAL_URL) {
      img.src = REMOTE_URL;
    }
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

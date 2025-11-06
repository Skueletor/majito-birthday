// Lenis + GSAP smooth scrolling and storytelling animations

// 1) Motion/capability detection + conditional smooth scroll
const prefersMotion = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
const isSmallScreen = window.matchMedia('(max-width: 480px)').matches;
const lowPerfDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
const liteMode = !prefersMotion || isSmallScreen || lowPerfDevice;

let lenis = null;
if (!liteMode && typeof Lenis !== 'undefined'){
  lenis = new Lenis({
    lerp: 0.12,
    smoothWheel: true,
  });
  lenis.on('scroll', () => {
    if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
  });
  function raf(time){
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

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
const motionOK = prefersMotion;

// HERO enter animations
if (motionOK && !liteMode){
  fadeUp('.overtitle', { delay: 0.1 });
  // Title reveal with clip-path for a cleaner, modern look
  // eslint-disable-next-line no-undef
  gsap.fromTo('.title', { clipPath: 'inset(0 0 100% 0)', opacity: 1 }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out', delay: 0.15 });
  fadeUp('.subtitle', { delay: 0.45 });
  fadeUp('.btn--primary', { delay: 0.55 });
}

// Parallax blobs/roses
// eslint-disable-next-line no-undef
if (motionOK && !liteMode) {
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

  if (motionOK && !liteMode){
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
        if (lenis){
          lenis.scrollTo(target, { offset: -10 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
  });
})();

// Section reveals (general polish)
(function revealSections(){
  if(!motionOK || typeof gsap === 'undefined' || liteMode) return;
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
  if(!motionOK || typeof gsap === 'undefined' || liteMode) return;

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

// Decorative SVG flowers across sections
(function initFlowers(){
  const total = liteMode ? 4 : 11; // reduce on liteMode
  
  // Helper function to generate edge-aligned position
  function generateEdgePosition(index, total) {
    const pos = {};
    const margin = 8; // Margen mínimo desde el borde en vw/vh
    
    // Divide el espacio disponible en secciones para evitar superposiciones
    const section = index / total;
    
    if (section < 0.25) {
      // Top edge
      pos.top = margin + 'vh';
      pos.left = (margin + (100 - margin * 2) * (index / (total * 0.25))) + 'vw';
    } else if (section < 0.5) {
      // Right edge
      pos.right = margin + 'vw';
      pos.top = (margin + (100 - margin * 2) * ((index - total * 0.25) / (total * 0.25))) + 'vh';
    } else if (section < 0.75) {
      // Bottom edge
      pos.bottom = margin + 'vh';
      pos.right = (margin + (100 - margin * 2) * ((index - total * 0.5) / (total * 0.25))) + 'vw';
    } else {
      // Left edge
      pos.left = margin + 'vw';
      pos.bottom = (margin + (100 - margin * 2) * ((index - total * 0.75) / (total * 0.25))) + 'vh';
    }
    
    // Añade algo de aleatoriedad a la posición pero manteniéndola cerca del borde
    const randomOffset = (Math.random() * 5 + 2); // 2-7vh/vw de offset aleatorio
    if (pos.top) pos.top = `calc(${pos.top} + ${randomOffset}vh)`;
    if (pos.right) pos.right = `calc(${pos.right} + ${randomOffset}vw)`;
    if (pos.bottom) pos.bottom = `calc(${pos.bottom} + ${randomOffset}vh)`;
    if (pos.left) pos.left = `calc(${pos.left} + ${randomOffset}vw)`;
    
    return pos;
  }

  // Helper function to generate random size within a range
  function randomSize(min, max) {
    return Math.floor(Math.random() * (max - min) + min) + 'px';
  }

  const sections = [
    { el: document.querySelector('.hero__bg'), spots: Array.from({ length: liteMode ? 3 : 8 }, (_, i) => ({
      pos: generateEdgePosition(i, 8),
      size: randomSize(200, 280),
      rot: (Math.random() * 30 - 15)
    }))},
    { el: document.querySelector('#mensaje'), spots: Array.from({ length: liteMode ? 1 : 4 }, (_, i) => ({
      pos: generateEdgePosition(i, 4),
      size: randomSize(160, 220),
      rot: (Math.random() * 30 - 15)
    }))},
    { el: document.querySelector('#detalles'), spots: Array.from({ length: liteMode ? 1 : 4 }, (_, i) => ({
      pos: generateEdgePosition(i, 4),
      size: randomSize(140, 200),
      rot: (Math.random() * 30 - 15)
    }))},
    { el: document.querySelector('#ubicacion'), spots: Array.from({ length: liteMode ? 1 : 3 }, (_, i) => ({
      pos: generateEdgePosition(i, 3),
      size: randomSize(140, 180),
      rot: (Math.random() * 30 - 15)
    }))},
    { el: document.querySelector('#rsvp'), spots: Array.from({ length: liteMode ? 1 : 3 }, (_, i) => ({
      pos: generateEdgePosition(i, 3),
      size: randomSize(140, 180),
      rot: (Math.random() * 30 - 15)
    }))},
  ];

  function pickBase(i){
    return `assets/flowers/${i}`;
  }

  let idx = 1;
  sections.forEach(section => {
    if(!section.el) return;
    section.el.style.position = section.el.style.position || 'relative';
    section.spots.forEach(spot => {
      if(idx > total) return;
      const base = pickBase(idx);
      const img = document.createElement('img');
      img.className = 'flower';
      img.decoding = 'async';
      img.loading = 'lazy';
  img.setAttribute('fetchpriority', 'low');
      img.alt = '';
      Object.assign(img.style, spot.pos);
      img.style.width = spot.size;
      img.style.transform = `rotate(${spot.rot || 0}deg)`;
      // Try AVIF → WebP → PNG progressively
      const exts = ['avif','webp','png'];
      let tryIdx = 0;
      img.onerror = () => {
        tryIdx++;
        if (tryIdx < exts.length) {
          img.src = `${base}.${exts[tryIdx]}`;
        } else {
          img.style.display = 'none';
        }
      };
      img.src = `${base}.${exts[0]}`;
      section.el.appendChild(img);
      idx++;
    });
  });

  // Gentle float animations for flowers
  if (motionOK && typeof gsap !== 'undefined' && !liteMode){
    // eslint-disable-next-line no-undef
    gsap.utils.toArray('.flower').forEach((el, i) => {
      const y = i % 2 ? -10 : 12;
      const r = i % 2 ? -6 : 6;
      const d = 3.5 + Math.random()*1.8;
      // eslint-disable-next-line no-undef
      gsap.to(el, { y, rotation: `+=${r}`, duration: d, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    });
  }
})();

// LEAFLET MAP
(function initMap(){
  const wrap = document.getElementById('mapWrap');
  if(!wrap) return;

  const gmapsUrl = wrap.getAttribute('data-gmaps-url');
  const address = wrap.getAttribute('data-address') || '';
  const openBtn = document.getElementById('openGmaps');
  if(openBtn && gmapsUrl) openBtn.href = gmapsUrl;

  let created = false;
  function createMap(){
    if (created || typeof L === 'undefined') return;
    created = true;
    // Create inner div for Leaflet
    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.height = '100%';
    wrap.appendChild(mapDiv);

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
          }
        })
        .catch(()=>{/* swallow */});
    }
  }

  // Lazy init when the section is near viewport
  const section = document.getElementById('ubicacion');
  if (!section){ createMap(); return; }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry => {
      if (entry.isIntersecting){
        createMap();
        io.disconnect();
      }
    })
  }, { rootMargin: '200px 0px', threshold: 0.2 });
  io.observe(section);
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

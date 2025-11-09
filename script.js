// Optimized script with performance enhancements, debouncing, lazy-loading, and mobile-first approach
// Performance utilities
const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
const isReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionOK = !isReducedMotion();

// Debounce utility for resize handlers
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility for scroll handlers
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Cache DOM queries
const DOM = {
  hero: null,
  mensaje: null,
  detalles: null,
  ubicacion: null,
  rsvp: null,
  mapWrap: null,
  giftModal: null,
  giftImg: null,
  init() {
    this.hero = document.querySelector('.hero');
    this.mensaje = document.querySelector('#mensaje');
    this.detalles = document.querySelector('#detalles');
    this.ubicacion = document.querySelector('#ubicacion');
    this.rsvp = document.querySelector('#rsvp');
    this.mapWrap = document.getElementById('mapWrap');
    this.giftModal = document.getElementById('giftModal');
    this.giftImg = document.getElementById('giftImg');
  }
};

// Initialize DOM cache when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DOM.init());
} else {
  DOM.init();
}

// ===== LENIS SMOOTH SCROLL (Mobile-optimized) =====
let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  
  // Lighter config on mobile for better performance
  const config = {
    lerp: isMobile() ? 0.08 : 0.12,
    smoothWheel: !isMobile(), // Disable smooth wheel on mobile
    smoothTouch: false, // Never smooth on touch
  };
  
  lenis = new Lenis(config);
  
  lenis.on('scroll', throttle(() => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.update();
    }
  }, 16)); // ~60fps throttle
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

// Defer Lenis init slightly to prioritize critical rendering
if (typeof Lenis !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(initLenis, 100);
  } else {
    window.addEventListener('load', () => setTimeout(initLenis, 100));
  }
}

// ===== GSAP + ScrollTrigger Setup =====
if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  
  // Reduce GSAP tweens on mobile for better performance
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });
}

// Helper: fade up animation
function fadeUp(targets, opts = {}) {
  if (!motionOK || typeof gsap === 'undefined') return;
  return gsap.fromTo(targets,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', ...opts }
  );
}

// ===== HERO ENTER ANIMATIONS (Reduced on mobile) =====
function initHeroAnimations() {
  if (!motionOK || !DOM.hero) return;
  
  const delay = isMobile() ? 0.05 : 0.1; // Faster on mobile
  
  fadeUp('.overtitle', { delay });
  
  // Title reveal with clip-path
  gsap.fromTo('.title',
    { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
    { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out', delay: delay + 0.05 }
  );
  
  fadeUp('.subtitle', { delay: delay + 0.35 });
  fadeUp('.btn--primary', { delay: delay + 0.45 });
}

// ===== PARALLAX BLOBS (Disabled on mobile for performance) =====
function initParallaxBlobs() {
  if (!motionOK || isMobile() || typeof gsap === 'undefined') return;
  
  ['.blob--tl', '.blob--tr', '.blob--bl', '.blob--br'].forEach((sel, i) => {
    gsap.to(sel, {
      yPercent: i % 2 === 0 ? -10 : 12,
      xPercent: i % 2 === 0 ? 8 : -6,
      ease: 'none',
      scrollTrigger: {
        trigger: '#inicio',
        start: 'top top',
        end: '+=120%',
        scrub: true,
      }
    });
  });
}

// ===== MESSAGE SECTION (Optimized pin duration on mobile) =====
function initMessage() {
  const section = DOM.mensaje;
  if (!section) return;
  
  const lines = section.querySelectorAll('.message__line');
  const pinDuration = isMobile() ? '+=180%' : '+=220%'; // Shorter on mobile
  
  if (motionOK && typeof ScrollTrigger !== 'undefined') {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: pinDuration,
      scrub: 1,
      pin: true,
    });
    
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: pinDuration,
        scrub: 1,
      }
    });
    
    tl.add(fadeUp('.message__title', { duration: 0.6 }))
      .to({}, { duration: 0.2 }) // Shorter pauses on mobile
      .to(lines[0], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 })
      .to(lines[0], { opacity: 0, duration: 0.2 })
      .to(lines[1], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 })
      .to(lines[1], { opacity: 0, duration: 0.2 })
      .to(lines[2], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 });
  } else {
    // No motion: show all lines statically
    lines.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
}

// ===== DETAILS CARDS STAGGER =====
function initDetails() {
  const section = DOM.detalles;
  if (!section || !motionOK || typeof gsap === 'undefined') return;
  
  const cards = section.querySelectorAll('.card');
  const stagger = isMobile() ? 0.1 : 0.15; // Faster stagger on mobile
  
  gsap.from(cards, {
    opacity: 0,
    y: 24,
    duration: 0.6,
    stagger,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: section,
      start: 'top 70%',
    }
  });
}

// ===== LAZY-LOADED FLOWERS WITH INTERSECTION OBSERVER =====
let flowersInitialized = false;

function initSectionFlowers() {
  if (flowersInitialized) return;
  flowersInitialized = true;
  
  // Config
  const BREAKPOINT = 640;
  const IMAGES_TOTAL = 26;
  const MAX_TRIES = 25;
  const SAFE_MARGIN = 8;
  const SPACING_RATIO = 0.18;
  const AVOID_PAD = 8;
  
  // Reduce flower count on mobile for better performance
  const mobileFactor = isMobile() ? 0.6 : 1;
  
  const SECTIONS = [
    { selector: '.hero', desktop: Math.floor(10 * mobileFactor), mobile: Math.floor(6 * mobileFactor), size: [180, 260] },
    { selector: '#mensaje', desktop: Math.floor(6 * mobileFactor), mobile: Math.floor(4 * mobileFactor), size: [150, 210] },
    { selector: '#detalles', desktop: Math.floor(11 * mobileFactor), mobile: Math.floor(6 * mobileFactor), size: [140, 220] },
    { selector: '#ubicacion', desktop: Math.floor(5 * mobileFactor), mobile: Math.floor(3 * mobileFactor), size: [140, 180] },
    { selector: '#rsvp', desktop: Math.floor(5 * mobileFactor), mobile: Math.floor(3 * mobileFactor), size: [140, 180] },
  ];
  
  const isMobileView = () => window.matchMedia(`(max-width:${BREAKPOINT}px)`).matches;
  const rand = (a, b) => Math.random() * (b - a) + a;
  const rint = (a, b) => Math.floor(rand(a, b + 1));
  const shuffle = (arr) => arr.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
  
  function toLocal(rect, rootRect) {
    return {
      left: rect.left - rootRect.left,
      top: rect.top - rootRect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right - rootRect.left,
      bottom: rect.bottom - rootRect.top
    };
  }
  
  function intersects(a, b) {
    return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  }
  
  function expand(rect, pad) {
    return {
      left: rect.left - pad,
      top: rect.top - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      right: rect.right + pad,
      bottom: rect.bottom + pad
    };
  }
  
  function ensureBgContainer(section) {
    let box = section.querySelector(':scope > .flowers-bg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'flowers-bg';
      section.insertBefore(box, section.firstChild);
    } else {
      box.innerHTML = '';
    }
    return box;
  }
  
  function buildSection(entry) {
    const sec = document.querySelector(entry.selector);
    if (!sec) return;
    
    const box = ensureBgContainer(sec);
    const sRect = sec.getBoundingClientRect();
    const W = Math.max(1, Math.floor(sRect.width));
    const H = Math.max(1, Math.floor(sRect.height));
    if (W < 40 || H < 40) return;
    
    const count = isMobileView() ? entry.mobile : entry.desktop;
    const [minPx, maxPx] = entry.size;
    
    // Special hero placement with fallback
    if (entry.selector === '.hero') {
      const centerX = W / 2;
      const centerY = H / 2;
      const R = Math.min(W, H) * 0.35;
      const borderW = W * 0.12;
      
      const heroContent = sec.querySelector('.hero__content');
      let avoidZones = [];
      if (heroContent) {
        const hRect = heroContent.getBoundingClientRect();
        avoidZones.push(expand(toLocal(hRect, sRect), AVOID_PAD));
      }
      
      const indices = shuffle([...Array(IMAGES_TOTAL)].map((_, i) => i + 1));
      let placed = [];
      
      for (let i = 0; i < count; i++) {
        const size = rint(minPx, maxPx);
        const spacing = size * SPACING_RATIO;
        let found = false;
        
        for (let tries = 0; tries < MAX_TRIES; tries++) {
          const inCircle = Math.random() < 0.6;
          let x, y;
          
          if (inCircle) {
            const angle = rand(0, Math.PI * 2);
            const r = rand(R * 0.3, R);
            x = centerX + r * Math.cos(angle);
            y = centerY + r * Math.sin(angle);
          } else {
            const edge = rint(0, 3);
            switch (edge) {
              case 0: x = rand(SAFE_MARGIN, borderW); y = rand(SAFE_MARGIN, H - SAFE_MARGIN); break;
              case 1: x = rand(W - borderW, W - SAFE_MARGIN); y = rand(SAFE_MARGIN, H - SAFE_MARGIN); break;
              case 2: x = rand(SAFE_MARGIN, W - SAFE_MARGIN); y = rand(SAFE_MARGIN, borderW); break;
              case 3: x = rand(SAFE_MARGIN, W - SAFE_MARGIN); y = rand(H - borderW, H - SAFE_MARGIN); break;
            }
          }
          
          const candidate = { left: x, top: y, width: size, height: size, right: x + size, bottom: y + size };
          
          if (candidate.left < SAFE_MARGIN || candidate.right > W - SAFE_MARGIN ||
              candidate.top < SAFE_MARGIN || candidate.bottom > H - SAFE_MARGIN) continue;
          
          let collision = false;
          for (const z of avoidZones) {
            if (intersects(candidate, z)) {
              collision = true;
              break;
            }
          }
          if (collision) continue;
          
          collision = false;
          for (const p of placed) {
            const bufferBox = expand(p, spacing);
            if (intersects(candidate, bufferBox)) {
              collision = true;
              break;
            }
          }
          if (collision) continue;
          
          found = true;
          placed.push(candidate);
          
          const img = new Image();
          img.loading = 'lazy'; // Native lazy loading
          img.className = 'flower ' + (Math.random() < 0.5 ? 'flower--soft' : 'flower--bold');
          img.src = `assets/flowers/${indices[i % IMAGES_TOTAL]}.webp`;
          img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;`;
          img.alt = '';
          box.appendChild(img);
          break;
        }
        
        if (!found) {
          const x = rand(SAFE_MARGIN, W - size - SAFE_MARGIN);
          const y = rand(SAFE_MARGIN, H - size - SAFE_MARGIN);
          const img = new Image();
          img.loading = 'lazy';
          img.className = 'flower flower--soft';
          img.src = `assets/flowers/${indices[i % IMAGES_TOTAL]}.webp`;
          img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;opacity:0.25;`;
          img.alt = '';
          box.appendChild(img);
        }
      }
    } else {
      // Other sections: simpler placement
      const content = sec.querySelector('.container, .message, .rsvp');
      let avoidZones = [];
      if (content) {
        const cRect = content.getBoundingClientRect();
        avoidZones.push(expand(toLocal(cRect, sRect), AVOID_PAD));
      }
      
      const indices = shuffle([...Array(IMAGES_TOTAL)].map((_, i) => i + 1));
      let placed = [];
      
      for (let i = 0; i < count; i++) {
        const size = rint(minPx, maxPx);
        const spacing = size * SPACING_RATIO;
        let found = false;
        
        for (let tries = 0; tries < MAX_TRIES; tries++) {
          const x = rand(SAFE_MARGIN, W - size - SAFE_MARGIN);
          const y = rand(SAFE_MARGIN, H - size - SAFE_MARGIN);
          const candidate = { left: x, top: y, width: size, height: size, right: x + size, bottom: y + size };
          
          let collision = false;
          for (const z of avoidZones) {
            if (intersects(candidate, z)) {
              collision = true;
              break;
            }
          }
          if (collision) continue;
          
          collision = false;
          for (const p of placed) {
            const bufferBox = expand(p, spacing);
            if (intersects(candidate, bufferBox)) {
              collision = true;
              break;
            }
          }
          if (collision) continue;
          
          found = true;
          placed.push(candidate);
          
          const img = new Image();
          img.loading = 'lazy';
          img.className = 'flower ' + (Math.random() < 0.5 ? 'flower--soft' : 'flower--bold');
          img.src = `assets/flowers/${indices[i % IMAGES_TOTAL]}.webp`;
          img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;`;
          img.alt = '';
          box.appendChild(img);
          break;
        }
        
        if (!found) {
          const x = rand(SAFE_MARGIN, W - size - SAFE_MARGIN);
          const y = rand(SAFE_MARGIN, H - size - SAFE_MARGIN);
          const img = new Image();
          img.loading = 'lazy';
          img.className = 'flower flower--soft';
          img.src = `assets/flowers/${indices[i % IMAGES_TOTAL]}.webp`;
          img.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;opacity:0.25;`;
          img.alt = '';
          box.appendChild(img);
        }
      }
    }
  }
  
  function buildAll() {
    SECTIONS.forEach(entry => buildSection(entry));
  }
  
  buildAll();
  
  // Debounced rebuild on resize
  const debouncedRebuild = debounce(buildAll, 300);
  window.addEventListener('resize', debouncedRebuild);
}

// Lazy-load flowers using Intersection Observer
function setupFlowersLazyLoad() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: init immediately
    initSectionFlowers();
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initSectionFlowers();
        observer.disconnect();
      }
    });
  }, { rootMargin: '100px' });
  
  if (DOM.hero) observer.observe(DOM.hero);
}

// ===== FLOATING PETALS (Reduced count on mobile) =====
function initPetals() {
  if (!motionOK || typeof gsap === 'undefined') return;
  
  let layer = document.querySelector('.petals-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'petals-layer';
    document.body.appendChild(layer);
  }
  
  const MAX_ACTIVE = isMobile() ? 10 : 20; // Fewer petals on mobile
  let active = 0;
  
  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }
  
  function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  function spawnPetal() {
    if (active >= MAX_ACTIVE) return;
    active++;
    
    const petal = document.createElement('div');
    petal.className = 'petal ' + pick(['p1', 'p2', 'p3']);
    const startX = rand(-10, window.innerWidth + 10);
    petal.style.left = startX + 'px';
    petal.style.top = '-30px';
    layer.appendChild(petal);
    
    const drift = rand(-80, 80);
    const fallDist = window.innerHeight + 60;
    const duration = rand(8, 16);
    const rotation = rand(-180, 180);
    
    gsap.to(petal, {
      y: fallDist,
      x: drift,
      rotation,
      duration,
      ease: 'none',
      onComplete: () => {
        petal.remove();
        active--;
      }
    });
    
    gsap.to(petal, {
      x: `+=${rand(-30, 30)}`,
      duration: rand(2, 4),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }
  
  function scheduleNext() {
    const interval = isMobile() ? rand(1500, 3000) : rand(800, 2000);
    setTimeout(() => {
      spawnPetal();
      scheduleNext();
    }, interval);
  }
  
  // Initial petals
  const initial = isMobile() ? 3 : 6;
  for (let i = 0; i < initial; i++) {
    setTimeout(() => spawnPetal(), i * 400);
  }
  scheduleNext();
}

// ===== SMOOTH ANCHOR LINKS =====
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#' || !href) return;
      
      const target = document.querySelector(href);
      if (!target) return;
      
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: 0, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== SECTION REVEALS =====
function revealSections() {
  if (!motionOK || typeof gsap === 'undefined') return;
  
  gsap.utils.toArray('.panel').forEach(sec => {
    gsap.fromTo(sec,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sec,
          start: 'top 85%',
          once: true,
        }
      }
    );
  });
}

// ===== LAZY-LOADED LEAFLET MAP =====
let mapInitialized = false;

function initMap() {
  if (mapInitialized || typeof L === 'undefined') return;
  mapInitialized = true;
  
  const wrap = DOM.mapWrap;
  if (!wrap) return;
  
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  mapDiv.style.height = '100%';
  wrap.appendChild(mapDiv);
  
  const gmapsUrl = wrap.getAttribute('data-gmaps-url');
  const address = wrap.getAttribute('data-address') || '';
  
  const openBtn = document.getElementById('openGmaps');
  if (openBtn && gmapsUrl) {
    openBtn.href = gmapsUrl;
  }
  
  let lat = parseFloat(wrap.getAttribute('data-lat'));
  let lng = parseFloat(wrap.getAttribute('data-lng'));
  
  // Mobile-optimized map config
  const map = L.map(mapDiv, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
    maxZoom: isMobile() ? 15 : 19, // Reduce zoom on mobile
  }).setView([0, 0], 2);
  
  const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png', {
    maxZoom: isMobile() ? 15 : 19,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  });
  
  const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: isMobile() ? 15 : 19,
    attribution: '&copy; OpenStreetMap',
  });
  
  carto.addTo(map);
  carto.on('tileerror', () => {
    map.removeLayer(carto);
    osm.addTo(map);
  });
  
  function addMarkerAndCenter(_lat, _lng) {
    const icon = L.divIcon({
      html: `<div class="marker-pin">
        <svg width="32" height="42" viewBox="0 0 32 42" fill="none">
          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26c0-8.8-7.2-16-16-16z" fill="#e08aa8"/>
          <circle cx="16" cy="16" r="6" fill="white"/>
        </svg>
      </div>`,
      className: '',
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -42]
    });
    
    const marker = L.marker([_lat, _lng], { icon }).addTo(map);
    
    // Compressed popup content for mobile
    const popupContent = `<div class="map-popup">
      <div class="map-popup__title">${address || 'Ubicación'}</div>
      ${address ? `<div class="map-popup__addr">${address}</div>` : ''}
    </div>`;
    marker.bindPopup(popupContent);
    
    map.setView([_lat, _lng], isMobile() ? 14 : 15);
  }
  
  if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
    addMarkerAndCenter(lat, lng);
  } else if (address) {
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
      .then(r => r.json())
      .then(data => {
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
          addMarkerAndCenter(lat, lng);
        }
      })
      .catch(() => console.warn('Geocode failed'));
  }
}

// Lazy-load map using Intersection Observer
function setupMapLazyLoad() {
  if (!('IntersectionObserver' in window) || !DOM.ubicacion) {
    // Fallback: init on load
    window.addEventListener('load', () => setTimeout(initMap, 500));
    return;
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initMap();
        observer.disconnect();
      }
    });
  }, { rootMargin: '200px' });
  
  observer.observe(DOM.ubicacion);
}

// ===== GIFT QR MODAL =====
function initGiftModal() {
  const open = document.getElementById('giftOpen');
  const modal = DOM.giftModal;
  const img = DOM.giftImg;
  const downloadBtn = document.getElementById('giftDownload');
  
  if (!open || !modal || !img || !downloadBtn) return;
  
  const REMOTE_URL = 'https://i.ibb.co/yFFc2XYW/qr-code.png';
  const LOCAL_URL = 'assets/qr-code.png';
  const FILENAME = 'qr-majito.png';
  let currentUrl = REMOTE_URL;
  
  let hasDownloaded = false;
  let guardShown = false;
  let guardImgEl = null;
  
  function resetGuard() {
    if (guardImgEl) {
      guardImgEl.remove();
      guardImgEl = null;
    }
    guardShown = false;
    modal.classList.remove('modal--guarded');
  }
  
  function openModal() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-modal', 'true');
    img.src = currentUrl;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
  }
  
  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-modal', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    resetGuard();
  }
  
  function onKey(e) {
    if (e.key === 'Escape') closeModal();
  }
  
  open.addEventListener('click', openModal);
  
  const backdrop = modal.querySelector('.modal__backdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeModal);
  }
  
  const closeBtn = document.getElementById('giftClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (!hasDownloaded && !guardShown) {
        guardShown = true;
        modal.classList.add('modal--guarded');
        
        guardImgEl = document.createElement('img');
        guardImgEl.src = 'https://i.ibb.co/PGbW14yD/sticker.png';
        guardImgEl.className = 'sticker-guard';
        guardImgEl.alt = '';
        guardImgEl.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;';
        
        const actions = modal.querySelector('.modal__actions');
        if (actions) {
          actions.style.position = 'relative';
          actions.appendChild(guardImgEl);
        }
        
        setTimeout(() => {
          if (guardImgEl && guardImgEl.parentNode) {
            guardImgEl.style.transition = 'opacity 0.3s ease';
            guardImgEl.style.opacity = '0';
            setTimeout(() => resetGuard(), 300);
          }
        }, 3000);
      } else {
        closeModal();
      }
    });
  }
  
  const closeX = modal.querySelector('.modal__close-x');
  if (closeX) {
    closeX.addEventListener('click', closeModal);
  }
  
  img.addEventListener('click', () => {
    img.classList.toggle('is-zoomed');
  });
  
  async function downloadImage(url, filename) {
    hasDownloaded = true;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
      currentUrl = LOCAL_URL;
      img.src = LOCAL_URL;
    }
  }
  
  downloadBtn.addEventListener('click', () => downloadImage(currentUrl, FILENAME));
}

// ===== INITIALIZE ALL =====
function init() {
  // Ensure DOM cache is ready
  if (!DOM.hero) DOM.init();
  
  // Critical animations first
  initHeroAnimations();
  initMessage();
  initDetails();
  initAnchors();
  
  // Lazy-loaded features
  setupFlowersLazyLoad();
  setupMapLazyLoad();
  
  // Deferred non-critical animations
  if (!isMobile()) {
    requestIdleCallback(() => {
      initParallaxBlobs();
      initPetals();
      revealSections();
    });
  } else {
    // On mobile, defer even more
    setTimeout(() => {
      revealSections();
    }, 500);
  }
  
  // Modal init
  initGiftModal();
}

// Smart initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Polyfill for requestIdleCallback
if (!window.requestIdleCallback) {
  window.requestIdleCallback = function(cb) {
    const start = Date.now();
    return setTimeout(function() {
      cb({
        didTimeout: false,
        timeRemaining: function() {
          return Math.max(0, 50 - (Date.now() - start));
        }
      });
    }, 1);
  };
}

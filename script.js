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

// ===== FLOWERS V2 (spatial hash, responsive tiers, caching, WebP-first) =====
let flowersInitialized = false;
let _supportsWebP;
function supportsWebP(){
  if(typeof _supportsWebP==='boolean') return _supportsWebP;
  try{const c=document.createElement('canvas');_supportsWebP=c.getContext&&c.getContext('2d')?c.toDataURL('image/webp').indexOf('data:image/webp')===0:false;}catch(e){_supportsWebP=false;}return _supportsWebP;
}
function getViewportTier(){const w=window.innerWidth; if(w<480) return 'small-mobile'; if(w<768) return 'mobile'; if(w<1024) return 'tablet'; return 'desktop';}
class SpatialHash{constructor(cellSize){this.cellSize=Math.max(16,cellSize|0);this.map=new Map();}key(x,y){return x+','+y}cellsForRect(r){const cs=this.cellSize;const x0=Math.floor(r.left/cs),y0=Math.floor(r.top/cs),x1=Math.floor(r.right/cs),y1=Math.floor(r.bottom/cs);const list=[];for(let y=y0;y<=y1;y++){for(let x=x0;x<=x1;x++){list.push([x,y]);}}return list}insert(rect){for(const [x,y] of this.cellsForRect(rect)){const k=this.key(x,y);if(!this.map.has(k)) this.map.set(k,[]);this.map.get(k).push(rect)}}query(rect){const res=[];const seen=new Set();for(const [x,y] of this.cellsForRect(rect)){const k=this.key(x,y);const arr=this.map.get(k);if(!arr) continue;for(const r of arr){if(r._id&&!seen.has(r._id)){seen.add(r._id);res.push(r);}}}return res}}
function rectIntersects(a,b){return !(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom)}
function ensureFlowersBg(section){let box=section.querySelector(':scope > .flowers-bg');if(!box){box=document.createElement('div');box.className='flowers-bg';section.insertBefore(box,section.firstChild);}return box;}
function toLocalRect(rect,root){return{left:rect.left-root.left,top:rect.top-root.top,width:rect.width,height:rect.height,right:rect.right-root.left,bottom:rect.bottom-root.top};}
function pickSizePx(tier){const ranges={"small-mobile":{small:[80,120],medium:[120,140],large:[140,160]},"mobile":{small:[100,140],medium:[140,170],large:[170,200]},"tablet":{small:[120,170],medium:[170,210],large:[210,240]},"desktop":{small:[150,210],medium:[210,270],large:[270,320]}};const d=Math.random();let bucket='small';if(d>0.85) bucket='large'; else if(d>0.60) bucket='medium'; const [a,b]=ranges[tier][bucket];return Math.floor(a+Math.random()*(b-a+1));}
function getSectionEntries(){const tier=getViewportTier();const scale=tier==='desktop'?1:tier==='tablet'?0.8:tier==='mobile'?0.65:0.5;const mk=b=>Math.max(2,Math.floor(b*scale));return[{selector:'.hero',count:mk(10)},{selector:'#mensaje',count:mk(7)},{selector:'#detalles',count:mk(12)},{selector:'#ubicacion',count:mk(6)},{selector:'#rsvp',count:mk(6)}];}
function placeFlowersForSection(sectionEl,count,tier){const secRect=sectionEl.getBoundingClientRect();const W=Math.max(1,Math.floor(secRect.width));const H=Math.max(1,Math.floor(secRect.height));if(W<40||H<40) return[];const avoids=[];const content=sectionEl.querySelector('.hero__content, .container, .message, .rsvp');if(content) avoids.push(toLocalRect(content.getBoundingClientRect(),secRect));const MAX_TRIES=32;const SAFE=tier==='desktop'?12:tier==='tablet'?10:tier==='mobile'?8:6;const hash=new SpatialHash(64);const placed=[];let idSeq=1;function expand(r,p){return{left:r.left-p,top:r.top-p,right:r.right+p,bottom:r.bottom+p,width:r.width+p*2,height:r.height+p*2,_id:r._id}}function fits(r){if(r.left<0||r.top<0||r.right>W||r.bottom>H) return false;for(const a of avoids){if(rectIntersects(expand(r,SAFE),a)) return false;}const near=hash.query(expand(r,SAFE));for(const o of near){if(rectIntersects(expand(r,SAFE),o)) return false;}return true}const randint=(a,b)=>Math.floor(a+Math.random()*(b-a+1));const nextIndex=(()=>{const arr=Array.from({length:26},(_,i)=>i+1);for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}let p=0;return()=>{const v=arr[p%arr.length];p++;return v}})();let attempts=0;while(placed.length<count&&attempts<count*MAX_TRIES){attempts++;const size=pickSizePx(tier);const x=randint(0,Math.max(0,W-size));const y=randint(0,Math.max(0,H-size));const rect={left:x,top:y,right:x+size,bottom:y+size,width:size,height:size,_id:idSeq++};if(!fits(rect)) continue;placed.push({xPct:(x/W),yPct:(y/H),size,idx:nextIndex()});hash.insert(rect);}return placed;}
function renderFlowers(sectionEl,placements,tier){const box=ensureFlowersBg(sectionEl);box.innerHTML='';const secRect=sectionEl.getBoundingClientRect();const W=Math.max(1,Math.floor(secRect.width));const H=Math.max(1,Math.floor(secRect.height));const motionScale=tier==='desktop'?1:tier==='tablet'?0.8:tier==='mobile'?0.6:0.5;const ampY=Math.round(10*motionScale);const ampX=Math.round(6*motionScale);const webpFirst=supportsWebP();for(const p of placements){const x=Math.round(p.xPct*W);const y=Math.round(p.yPct*H);const size=p.size;const wrap=document.createElement('div');wrap.className='flower';wrap.style.left=x+'px';wrap.style.top=y+'px';wrap.style.width=size+'px';wrap.style.height=size+'px';const img=document.createElement('img');img.className='flower__img';img.alt='';img.loading='lazy';img.decoding='async';const base='assets/flowers/png/'+p.idx;if(webpFirst){img.src=base+'.webp';img.addEventListener('error',function onErr(){img.removeEventListener('error',onErr);img.src=base+'.png';});}else{img.src=base+'.png';}const dx=(Math.random()*2-1)*ampX;const dy=(Math.random()*2-1)*ampY;const dur=6+Math.random()*6;img.style.setProperty('--dx',dx.toFixed(1)+'px');img.style.setProperty('--dy',dy.toFixed(1)+'px');img.style.setProperty('--float-dur',dur.toFixed(2)+'s');wrap.appendChild(img);box.appendChild(wrap);} }
function buildFlowersLayout(){const tier=getViewportTier();const entries=getSectionEntries();const layout={version:'v2',tier,sections:[]};for(const e of entries){const sec=document.querySelector(e.selector);if(!sec) continue;const placements=placeFlowersForSection(sec,e.count,tier);layout.sections.push({selector:e.selector,placements});}return layout;}
function applyFlowersLayout(layout){const tier=layout.tier;for(const s of layout.sections){const sec=document.querySelector(s.selector);if(!sec) continue;renderFlowers(sec,s.placements,tier);} }
function cacheKeyForTier(tier){return 'flowers_layout::'+tier+'::v2';}
function initFlowersV2(){if(flowersInitialized) return;flowersInitialized=true;const tier=getViewportTier();const key=cacheKeyForTier(tier);let layout=null;try{const raw=sessionStorage.getItem(key);if(raw) layout=JSON.parse(raw);}catch{}if(!layout||layout.version!=='v2'||layout.tier!==tier){layout=buildFlowersLayout();try{sessionStorage.setItem(key,JSON.stringify(layout));}catch{}}applyFlowersLayout(layout);window.addEventListener('resize',debounce(()=>{const newTier=getViewportTier();if(newTier!==layout.tier){const k=cacheKeyForTier(newTier);let lay=null;try{const raw=sessionStorage.getItem(k);if(raw) lay=JSON.parse(raw);}catch{}if(!lay||lay.version!=='v2'||lay.tier!==newTier){lay=buildFlowersLayout();try{sessionStorage.setItem(k,JSON.stringify(lay));}catch{}}applyFlowersLayout(lay);layout=lay;}else{applyFlowersLayout(layout);} },300));}

// Lazy-load flowers using Intersection Observer
function setupFlowersLazyLoad(){
  if(!('IntersectionObserver' in window)) {initFlowersV2();return;}
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){initFlowersV2();observer.disconnect();}});
  },{rootMargin:'100px'});
  if(DOM.hero) observer.observe(DOM.hero);
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

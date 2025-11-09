// Production-optimized script with advanced performance boosters
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DOM.init());
} else {
  DOM.init();
}

let lenis;
function initLenis() {
  if (typeof Lenis === 'undefined') return;
  
  const config = {
    lerp: isMobile() ? 0.08 : 0.12,
    smoothWheel: !isMobile(),
    smoothTouch: false,
  };
  
  lenis = new Lenis(config);
  
  lenis.on('scroll', throttle(() => {
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.update();
    }
  }, 16));
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

if (typeof Lenis !== 'undefined') {
  if (document.readyState === 'complete') {
    setTimeout(initLenis, 100);
  } else {
    window.addEventListener('load', () => setTimeout(initLenis, 100));
  }
}

if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({
    force3D: true,
    nullTargetWarn: false,
  });
}

function fadeUp(targets, opts = {}) {
  if (!motionOK || typeof gsap === 'undefined') return;
  return gsap.fromTo(targets,
    { y: 24, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.9, ease: 'power2.out', ...opts }
  );
}

function initHeroAnimations() {
  if (!motionOK || !DOM.hero) return;
  
  const delay = isMobile() ? 0.05 : 0.1;
  
  fadeUp('.overtitle', { delay });
  
  gsap.fromTo('.title',
    { clipPath: 'inset(0 0 100% 0)', opacity: 1 },
    { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.out', delay: delay + 0.05 }
  );
  
  fadeUp('.subtitle', { delay: delay + 0.35 });
  fadeUp('.btn--primary', { delay: delay + 0.45 });
}

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

function initMessage() {
  const section = DOM.mensaje;
  if (!section) return;
  
  const lines = section.querySelectorAll('.message__line');
  const pinDuration = isMobile() ? '+=180%' : '+=220%';
  
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
      .to({}, { duration: 0.2 })
      .to(lines[0], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 })
      .to(lines[0], { opacity: 0, duration: 0.2 })
      .to(lines[1], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 })
      .to(lines[1], { opacity: 0, duration: 0.2 })
      .to(lines[2], { opacity: 1, y: 0, duration: 0.3 })
      .to({}, { duration: 0.2 });
  } else {
    lines.forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }
}

function initDetails() {
  const section = DOM.detalles;
  if (!section || !motionOK || typeof gsap === 'undefined') return;
  
  const cards = section.querySelectorAll('.card');
  const stagger = isMobile() ? 0.1 : 0.15;
  
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

// FLOWER SYSTEM V3: Optimized collision-free layout with viewport caching

const FlowerLayout = (function(){
  const BASE_IMAGE_COUNT = 26;
  const LAYOUT_VERSION = 3;
  const TOTAL_BY_VIEWPORT = { xs: 36, sm: 40, md: 46, lg: 50 };
  const STORAGE_KEY = 'flowerLayoutV3';
  const MAX_TRIES = 60;          // Extra attempts thanks to spatial hash efficiency
  const SAFE_MARGIN = 8;         // Padding from section edges
  const AVOID_PAD = 12;          // Expansion padding around content boxes
  const SPACING_SCALE = 0.12;    // Multiplier to turn size into buffer radius
  const HASH_CELL = 120;         // Spatial hash cell size (roughly medium flower width)

  const SECTIONS = [
    { selector: '.hero', key: 'hero' },
    { selector: '#mensaje', key: 'mensaje' },
    { selector: '#detalles', key: 'detalles' },
    { selector: '#ubicacion', key: 'ubic' },
    { selector: '#rsvp', key: 'rsvp' },
  ];

  function minPerSection(){
    const cat = viewportCategory();
    if (cat === 'xs') return 4;
    if (cat === 'sm') return 6;
    if (cat === 'md') return 8;
    return 9; // lg
  }

  function totalForViewport(cat = viewportCategory()){
    return TOTAL_BY_VIEWPORT[cat] || 44;
  }

  // Compute how many flowers per section based on visible area
  function computeDistribution(total){
    const minCount = minPerSection();
    const items = [];
    let areaSum = 0;
    SECTIONS.forEach(s => {
      const el = document.querySelector(s.selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const area = Math.max(1, Math.floor(r.width * r.height));
      items.push({ ...s, area, el, count: 0, frac: 0 });
      areaSum += area;
    });
    if (!items.length) return [];

    // Initial proportional assignment
    items.forEach(i => {
      const raw = (i.area / areaSum) * total;
      i.count = Math.floor(raw);
      i.frac = raw - i.count;
    });
    // Enforce minimums
    let assigned = items.reduce((a,i)=>a+i.count,0);
    for (const i of items){
      if (i.count < minCount){
        const diff = minCount - i.count;
        i.count = minCount;
        assigned += diff;
      }
    }
    // Reconcile to exact total by adjusting counts using fractional remainders
    if (assigned < total){
      // Give extras to biggest fractional parts first
      const need = total - assigned;
      items.sort((a,b)=>b.frac - a.frac);
      for (let k=0; k<need; k++) items[k % items.length].count++;
    } else if (assigned > total){
      // Remove from largest counts with smallest fractional parts first
      let over = assigned - total;
      items.sort((a,b)=> (b.count - a.count) || (a.frac - b.frac));
      for (const i of items){
        if (!over) break;
        const reducible = Math.max(0, i.count - minCount);
        if (reducible > 0){
          const take = Math.min(reducible, over);
          i.count -= take;
          over -= take;
        }
      }
    }
    // Restore original section order for deterministic processing
    items.sort((a,b)=> SECTIONS.findIndex(s=>s.selector===a.selector) - SECTIONS.findIndex(s=>s.selector===b.selector));
    return items;
  }

  // Size tiers per viewport category
  function viewportCategory(){
    return window.perfBooster?.getCachedViewportCategory?.() || (() => {
      const w = window.innerWidth;
      if (w < 480) return 'xs';
      if (w < 768) return 'sm';
      if (w < 1024) return 'md';
      return 'lg';
    })();
  }
  const SIZE_RULES = {
    xs: { small:[80,110],   med:[110,140],  large:[140,160] },
    sm: { small:[90,130],   med:[130,170],  large:[170,200] },
    md: { small:[140,190],  med:[190,250],  large:[250,290] },
    lg: { small:[150,210],  med:[210,260],  large:[260,320] },
  };
  const SIZE_DIST = [
    { tier:'small', p:0.60 },
    { tier:'med',   p:0.85 },
    { tier:'large', p:1.00 },
  ];

  function pickTier(){
    const r = Math.random();
    return SIZE_DIST.find(d => r <= d.p).tier;
  }
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function rint(a,b){ return Math.floor(rand(a,b+1)); }
  function shuffle(arr){ return arr.map(v=>[Math.random(),v]).sort((a,b)=>a[0]-b[0]).map(p=>p[1]); }

  function getContentAvoidRects(sectionEl, sectionRect){
    const selectors = ['.hero__content', '.container', '.message', '.rsvp'];
    const zones = [];
    selectors.forEach(sel => {
      const el = sectionEl.querySelector(sel);
      if (el){
        const r = el.getBoundingClientRect();
        zones.push(expandRect(toLocalRect(r, sectionRect), AVOID_PAD));
      }
    });
    return zones;
  }
  function toLocalRect(rect, root){
    return { left: rect.left-root.left, top: rect.top-root.top, width: rect.width, height: rect.height, right: rect.right-root.left, bottom: rect.bottom-root.top };
  }
  function expandRect(r,p){ return { left:r.left-p, top:r.top-p, width:r.width+2*p, height:r.height+2*p, right:r.right+p, bottom:r.bottom+p }; }
  function intersects(a,b){ return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom); }

  // Spatial hash structure
  function Hash(){ this.map = new Map(); }
  Hash.prototype.key = function(x,y){ return (Math.floor(x/HASH_CELL))+','+(Math.floor(y/HASH_CELL)); };
  Hash.prototype.insert = function(box, payload){
    const minX = Math.floor(box.left / HASH_CELL);
    const maxX = Math.floor(box.right / HASH_CELL);
    const minY = Math.floor(box.top / HASH_CELL);
    const maxY = Math.floor(box.bottom / HASH_CELL);
    for (let gx=minX; gx<=maxX; gx++){
      for (let gy=minY; gy<=maxY; gy++){
        const k = gx+','+gy;
        if (!this.map.has(k)) this.map.set(k, []);
        this.map.get(k).push(payload);
      }
    }
  };
  Hash.prototype.query = function(box){
    const results = [];
    const seen = new Set();
    const minX = Math.floor(box.left / HASH_CELL);
    const maxX = Math.floor(box.right / HASH_CELL);
    const minY = Math.floor(box.top / HASH_CELL);
    const maxY = Math.floor(box.bottom / HASH_CELL);
    for (let gx=minX; gx<=maxX; gx++){
      for (let gy=minY; gy<=maxY; gy++){
        const k = gx+','+gy;
        const bucket = this.map.get(k);
        if (bucket){
          for (const item of bucket){
            if (!seen.has(item.id)){
              seen.add(item.id);
              results.push(item);
            }
          }
        }
      }
    }
    return results;
  };

  function ensureBgContainer(section){
    let box = section.querySelector(':scope > .flowers-bg');
    if (!box){
      box = document.createElement('div');
      box.className = 'flowers-bg';
      section.insertBefore(box, section.firstChild);
    }
    return box;
  }

  function generateLayout(){
    const cat = viewportCategory();
    const target = totalForViewport(cat);
    const sizeRules = SIZE_RULES[cat];
    const slots = shuffle(Array.from({ length: target }, (_, i) => ({
      uid: i + 1,
      image: (i % BASE_IMAGE_COUNT) + 1,
      reuseIndex: Math.floor(i / BASE_IMAGE_COUNT),
    })));
    const queue = [...slots];
    const layout = {
      meta: {
        version: LAYOUT_VERSION,
        cat,
        base: BASE_IMAGE_COUNT,
        target,
        placed: 0,
      },
      flowers: [],
    };

    // Pre-compute how many per section and assemble placement structures
    const dist = computeDistribution(target);
    const sections = dist.map((cfg) => {
      const sectionEl = cfg.el || document.querySelector(cfg.selector);
      if (!sectionEl) return null;
      const rect = sectionEl.getBoundingClientRect();
      return {
        cfg,
        el: sectionEl,
        rect,
        W: Math.max(10, rect.width),
        H: Math.max(10, rect.height),
        avoid: getContentAvoidRects(sectionEl, rect),
        hash: new Hash(),
        placed: [],
        need: Math.min(cfg.count, target),
      };
    }).filter(Boolean);

    // Helper to attempt placing one image into a section with tunables
    function tryPlaceIn(sec, slot, scale = 1, bufferScale = 1) {
      const tier = pickTier();
      const [minS, maxS] = sizeRules[tier];
      const size = Math.max(48, Math.floor(rint(minS, maxS) * scale));
      const buffer = size * (SPACING_SCALE * bufferScale);
      for (let t = 0; t < MAX_TRIES; t++) {
        const maxX = Math.max(SAFE_MARGIN, sec.W - size - SAFE_MARGIN);
        const maxY = Math.max(SAFE_MARGIN, sec.H - size - SAFE_MARGIN);
        const x = rand(SAFE_MARGIN, maxX);
        const y = rand(SAFE_MARGIN, maxY);
        const box = { left: x, top: y, right: x + size, bottom: y + size };
        // Avoid content
        let bad = false;
        for (const a of sec.avoid) {
          if (intersects(box, a)) {
            bad = true;
            break;
          }
        }
        if (bad) continue;
        // Avoid other flowers in this section
        const near = sec.hash.query({
          left: box.left - buffer,
          top: box.top - buffer,
          right: box.right + buffer,
          bottom: box.bottom + buffer,
        });
        for (const n of near) {
          const expanded = {
            left: n.x - buffer,
            top: n.y - buffer,
            right: n.x + n.size + buffer,
            bottom: n.y + n.size + buffer,
          };
          if (intersects(box, expanded)) {
            bad = true;
            break;
          }
        }
        if (bad) continue;
        const final = {
          uid: slot.uid,
          image: slot.image,
          reuseIndex: slot.reuseIndex,
          section: sec.cfg.key,
          selector: sec.cfg.selector,
          x,
          y,
          size,
          tier,
        };
        sec.placed.push(final);
        sec.hash.insert({ left: box.left, top: box.top, right: box.right, bottom: box.bottom }, { id: slot.uid, x, y, size });
        return final;
      }
      return null;
    }

    function fillSection(sec, targetCount, scaleOptions, guardFactor = 4) {
      if (!targetCount) return;
      let attempts = 0;
      const cap = Math.max(targetCount * MAX_TRIES, target * guardFactor);
      while (sec.placed.length < targetCount && queue.length && attempts < cap) {
        const slot = queue.shift();
        let placed = null;
        for (const [scale, bufferScale] of scaleOptions) {
          placed = tryPlaceIn(sec, slot, scale, bufferScale);
          if (placed) break;
        }
        if (placed) {
          layout.flowers.push(placed);
        } else {
          queue.push(slot);
        }
        attempts++;
      }
    }

    // Primary pass using intended distribution
    sections.forEach((sec) => {
      fillSection(sec, sec.need, [
        [1, 1],
        [0.92, 0.95],
      ]);
    });

    // Ensure minimum baseline per section with progressively smaller tiers
    const minCount = minPerSection();
    const byShort = [...sections].sort((a, b) => (a.placed.length - Math.max(minCount, a.need)) - (b.placed.length - Math.max(minCount, b.need)));
    byShort.forEach((sec) => {
      const targetCount = Math.max(minCount, Math.min(sec.need, target));
      if (sec.placed.length >= targetCount) return;
      fillSection(sec, targetCount, [
        [0.88, 0.92],
        [0.78, 0.85],
        [0.68, 0.8],
      ], 6);
    });

    // Distribute any leftovers into the largest sections for extra richness
    if (queue.length && layout.flowers.length < target) {
      const sorted = [...sections].sort((a, b) => b.W * b.H - a.W * a.H);
      let guard = target * 8;
      let idx = 0;
      while (queue.length && layout.flowers.length < target && guard-- > 0) {
        const sec = sorted[idx % sorted.length];
        const slot = queue.shift();
        const placed = tryPlaceIn(sec, slot, 0.7, 0.82) || tryPlaceIn(sec, slot, 0.6, 0.75) || tryPlaceIn(sec, slot, 0.52, 0.7);
        if (placed) {
          layout.flowers.push(placed);
        } else {
          queue.push(slot);
        }
        idx++;
      }
    }

    layout.meta.placed = layout.flowers.length;
    return layout;
  }

  function restoreLayout(){
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.flowers)) return null;
      const currentCat = viewportCategory();
      if (!parsed.meta || parsed.meta.version !== LAYOUT_VERSION) return null;
      if (parsed.meta.base !== BASE_IMAGE_COUNT) return null;
      if (parsed.meta.cat !== currentCat) return null;
      const expectedTarget = totalForViewport(currentCat);
      if (parsed.meta.target !== expectedTarget) return null;
      if (parsed.meta.placed !== parsed.flowers.length) return null;
      const minimumViable = Math.max(minPerSection() * SECTIONS.length, Math.floor(expectedTarget * 0.65));
      if (parsed.flowers.length < minimumViable) return null;
      return parsed;
    } catch(e){ return null; }
  }

  function persistLayout(layout){
    try {
      if (layout && layout.meta) {
        layout.meta.placed = Array.isArray(layout.flowers) ? layout.flowers.length : 0;
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
    } catch(e) {}
  }

  function mountLayout(layout){
    // improved: use DocumentFragment per section to minimize reflow & paint
    const bySection = new Map();
    layout.flowers.forEach(f => {
      if (!bySection.has(f.selector)) bySection.set(f.selector, []);
      bySection.get(f.selector).push(f);
    });
    bySection.forEach((flowers, selector) => {
      const sectionEl = document.querySelector(selector);
      if (!sectionEl) return;
      const box = ensureBgContainer(sectionEl);
      if (box.dataset.mounted === '1') return; // avoid duplicates
      const frag = document.createDocumentFragment();
      flowers.forEach(f => {
        const img = new Image();
        img.decoding = 'async';
        img.loading = 'lazy';
        img.alt = '';
        img.setAttribute('aria-hidden', 'true');
        img.className = 'flower ' + (Math.random() < 0.5 ? 'flower--soft' : 'flower--bold');
        img.src = `assets/flowers/${f.image}.webp`;
        img.onerror = function(){ this.onerror=null; this.src = `assets/flowers/png/${f.image}.png`; };
        img.style.left = f.x + 'px';
        img.style.top = f.y + 'px';
        img.style.width = f.size + 'px';
        img.style.height = f.size + 'px';
        img.dataset.flowerUid = f.uid;
        img.dataset.flowerReuse = f.reuseIndex;
        img.dataset.flowerImage = f.image;
        frag.appendChild(img);
      });
      box.appendChild(frag);
      box.dataset.mounted = '1';
      enableIdleMotion(box);
    });
  }

  function enableIdleMotion(container){
    if (typeof gsap === 'undefined') return;
    const els = container.querySelectorAll('.flower');
    els.forEach((el, i) => {
      const amp = isMobile() ? 4 : 7;
      const dx = (Math.random()*amp*2 - amp);
      const dy = (Math.random()*amp*2 - amp);
      const dur = (isMobile()? 6:9) + Math.random()*3;
      gsap.to(el, {
        x: dx,
        y: dy,
        duration: dur,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
      gsap.to(el, {
        scale: 1 + (isMobile()? 0.01 : 0.015),
        duration: dur*1.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    });
  }

  function animateToLayout(newLayout){
    if (typeof gsap === 'undefined') return mountFresh(newLayout);
    const idToTarget = new Map();
    document.querySelectorAll('.flowers-bg .flower').forEach(el => {
      const uid = parseInt(el.dataset.flowerUid, 10);
      if (!Number.isNaN(uid)) idToTarget.set(uid, el);
    });
    if (idToTarget.size !== newLayout.flowers.length) {
      mountFresh(newLayout);
      return;
    }
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut', duration: 0.8 } });
    let missing = false;
    newLayout.flowers.forEach(f => {
      const el = idToTarget.get(f.uid);
      if (!el) { missing = true; return; }
      el.dataset.flowerReuse = f.reuseIndex;
      el.dataset.flowerImage = f.image;
      tl.to(el, {
        left: f.x,
        top: f.y,
        width: f.size,
        height: f.size,
      }, 0);
    });
    if (missing) {
      mountFresh(newLayout);
      return;
    }
    tl.eventCallback('onComplete', () => {
      document.querySelectorAll('.flowers-bg').forEach(enableIdleMotion);
    });
  }

  function mountFresh(layout){
    document.querySelectorAll('.flowers-bg').forEach(box => { box.dataset.mounted=''; box.innerHTML=''; });
    mountLayout(layout);
  }

  const STATIC_LAYOUT_URL = 'assets/data/flowers-layout.json';

  function buildRuntimeLayoutFromStatic(payload){
    try {
      if (!payload || !payload.sections) return null;
      const cat = viewportCategory();
      const scaleMap = payload.scales || { xs:1, sm:1, md:1, lg:1 };
      const scale = scaleMap[cat] || 1;
      const overrides = (payload.breakpointOverrides && payload.breakpointOverrides[cat]) || {};

      const keyToSelector = SECTIONS.reduce((acc, s) => { acc[s.key] = s.selector; return acc; }, {});

      const runtime = { meta: { version: (payload.meta && payload.meta.version) || LAYOUT_VERSION, cat }, flowers: [] };
      let uid = 1;

      Object.keys(payload.sections).forEach(secKey => {
        const baseList = Array.isArray(payload.sections[secKey]) ? payload.sections[secKey] : [];
        const addl = Array.isArray(overrides[secKey]) ? overrides[secKey] : [];
        const all = baseList.concat(addl);
        const selector = keyToSelector[secKey] || null;
        if (!selector) return;
        const sectionEl = document.querySelector(selector);
        if (!sectionEl) return;
        const rect = sectionEl.getBoundingClientRect();
        const W = Math.max(10, rect.width);
        const H = Math.max(10, rect.height);

        const margin = SAFE_MARGIN;
        const usableW = Math.max(0, W - 2*margin);
        const usableH = Math.max(0, H - 2*margin);

        all.forEach(item => {
          const imgVal = item.img;
          let image = 1;
          if (typeof imgVal === 'number' && Number.isFinite(imgVal)) {
            image = Math.max(1, Math.min(26, Math.round(imgVal)));
          } else if (typeof imgVal === 'string') {
            const m = imgVal.match(/(\d{1,2})/);
            if (m) image = Math.max(1, Math.min(26, parseInt(m[1], 10)));
          }
          const baseSize = Math.max(48, Math.round((item.size || 160) * scale));
          const xPct = Math.max(0, Math.min(100, item.xPct ?? 50));
          const yPct = Math.max(0, Math.min(100, item.yPct ?? 50));
          const left = margin + Math.round((xPct/100) * Math.max(0, usableW - baseSize));
          const top  = margin + Math.round((yPct/100) * Math.max(0, usableH - baseSize));

          runtime.flowers.push({
            uid: uid++,
            image,
            reuseIndex: 0,
            section: secKey,
            selector,
            x: left,
            y: top,
            size: baseSize,
            tier: 'static'
          });
        });
      });

      runtime.meta.placed = runtime.flowers.length;
      return runtime;
    } catch(e){
      console.warn('[FlowerLayout] Static layout build failed', e);
      return null;
    }
  }

  function fetchStaticAndMount(){
    fetch(STATIC_LAYOUT_URL, { cache: 'no-cache' })
      .then(res => {
        if (!res.ok) throw new Error('HTTP '+res.status);
        return res.json();
      })
      .then(layout => {
        // Accept both legacy flat format and new structured one
        let runtime = null;
        if (layout && Array.isArray(layout.flowers)) {
          runtime = layout;
        } else {
          runtime = buildRuntimeLayoutFromStatic(layout);
        }
        if (!runtime || !Array.isArray(runtime.flowers)) throw new Error('Invalid static layout format');
        try { sessionStorage.setItem('flowersLayout', JSON.stringify(runtime)); } catch(e) {}
        mountLayout(runtime);
        // Static layout: we skip bindRelayout (no expensive recompute) for performance.
      })
      .catch(err => {
        console.warn('[FlowerLayout] Static load failed, generating:', err);
        const dyn = generateLayout();
        persistLayout(dyn);
        try { sessionStorage.setItem('flowersLayout', JSON.stringify(dyn)); } catch(e) {}
        mountLayout(dyn);
        bindRelayout();
      });
  }

  function init(){
    const cached = sessionStorage.getItem('flowersLayout');
    if (cached){
      try {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.flowers)) {
          mountLayout(parsed); // fastest path
          return; // no relayout binding (static layout)
        }
      } catch(e){ sessionStorage.removeItem('flowersLayout'); }
    }
    // No cached static layout; attempt fetch
    fetchStaticAndMount();
  }

  function bindRelayout(){
    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    let pending = false;
    function shouldRelayout(){
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dw = Math.abs(w - lastW);
      const dh = Math.abs(h - lastH);
      const orientationChanged = (w > h && lastW <= lastH) || (w <= h && lastW > lastH);
      return orientationChanged || (dw / Math.max(lastW,1) > 0.15) || (dh / Math.max(lastH,1) > 0.25);
    }
    function handle(){
      if (!shouldRelayout()) return;
      if (pending) return;
      pending = true;
      setTimeout(() => {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        pending = false;
        const fresh = generateLayout();
        persistLayout(fresh);
        animateToLayout(fresh);
      }, 180);
    }
    window.addEventListener('resize', handle, { passive: true });
    window.addEventListener('orientationchange', handle, { passive: true });
  }

  return { init };
})();

function initPetals() {
  if (!motionOK || typeof gsap === 'undefined') return;
  
  let layer = document.querySelector('.petals-layer');
  if (!layer) {
    layer = document.createElement('div');
    layer.className = 'petals-layer';
    document.body.appendChild(layer);
  }
  
  const MAX_ACTIVE = isMobile() ? 10 : 20;
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
  
  const initial = isMobile() ? 3 : 6;
  for (let i = 0; i < initial; i++) {
    setTimeout(() => spawnPetal(), i * 400);
  }
  scheduleNext();
}

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
  
  const map = L.map(mapDiv, {
    zoomControl: true,
    scrollWheelZoom: false,
    attributionControl: false,
    maxZoom: isMobile() ? 15 : 19,
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

function setupMapLazyLoad() {
  if (!('IntersectionObserver' in window) || !DOM.ubicacion) {
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

function initGiftModal() {
  const open = document.getElementById('giftOpen');
  const modal = DOM.giftModal;
  const img = DOM.giftImg;
  const downloadBtn = document.getElementById('giftDownload');
  const modalContent = modal ? modal.querySelector('.modal__content') : null;
  
  if (!open || !modal || !img || !downloadBtn || !modalContent) return;
  
  const REMOTE_URL = 'https://i.ibb.co/yFFc2XYW/qr-code.png';
  const LOCAL_URL = 'assets/qr-code.png';
  const FILENAME = 'qr-majito.png';
  let currentUrl = REMOTE_URL;
  
  let hasDownloaded = false;
  let guardShown = false;
  let guardImgEl = null;
  let guardResizeHandler = null;
  
  function resetGuard() {
    if (guardImgEl) {
      guardImgEl.remove();
      guardImgEl = null;
    }
    guardShown = false;
    modal.classList.remove('modal--guarded');
    if (guardResizeHandler) {
      window.removeEventListener('resize', guardResizeHandler);
      window.removeEventListener('orientationchange', guardResizeHandler);
      guardResizeHandler = null;
    }
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
        guardImgEl.setAttribute('aria-hidden', 'true');

        modalContent.appendChild(guardImgEl);

        const placeGuard = () => {
          if (!guardImgEl) return;
          const btnRect = closeBtn.getBoundingClientRect();
          const contentRect = modalContent.getBoundingClientRect();
          if (!btnRect.width || !contentRect.width) return;
          const guardWidth = guardImgEl.offsetWidth || guardImgEl.naturalWidth || 0;
          const guardHeight = guardImgEl.offsetHeight || guardImgEl.naturalHeight || 0;
          if (!guardWidth || !guardHeight) {
            requestAnimationFrame(placeGuard);
            return;
          }
          const idealLeft = btnRect.left - contentRect.left + btnRect.width / 2 - guardWidth / 2;
          const idealTop = btnRect.top - contentRect.top + btnRect.height / 2 - guardHeight / 2;
          const maxLeft = contentRect.width - guardWidth;
          const maxTop = contentRect.height - guardHeight;
          guardImgEl.style.left = `${Math.max(0, Math.min(maxLeft, idealLeft))}px`;
          guardImgEl.style.top = `${Math.max(0, Math.min(maxTop, idealTop))}px`;
        };

        if (!guardImgEl.complete || !guardImgEl.naturalWidth) {
          guardImgEl.addEventListener('load', () => requestAnimationFrame(placeGuard), { once: true });
        }
        requestAnimationFrame(placeGuard);

        guardResizeHandler = () => requestAnimationFrame(placeGuard);
        window.addEventListener('resize', guardResizeHandler, { passive: true });
        window.addEventListener('orientationchange', guardResizeHandler);
        
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

function init() {
  if (!DOM.hero) DOM.init();
  
  initHeroAnimations();
  initMessage();
  initDetails();
  initAnchors();
  
  FlowerLayout.init();
  setupMapLazyLoad();
  
  if (!isMobile()) {
    requestIdleCallback(() => {
      initParallaxBlobs();
      initPetals();
      revealSections();
    });
  } else {
    setTimeout(() => {
      revealSections();
    }, 500);
  }
  
  initGiftModal();
}

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

// ===== PERFORMANCE BOOSTER BLOCK =====
(function() {
  'use strict';
  
  // Tab visibility sleep/wake optimization
  let isTabVisible = true;
  let pausedAnimations = [];
  
  function pauseGSAP() {
    if (typeof gsap === 'undefined') return;
    pausedAnimations = gsap.globalTimeline.getChildren();
    gsap.globalTimeline.pause();
    ScrollTrigger?.pauseAll?.();
  }
  
  function resumeGSAP() {
    if (typeof gsap === 'undefined') return;
    gsap.globalTimeline.resume();
    ScrollTrigger?.resumeAll?.();
  }
  
  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
    if (isTabVisible) resumeGSAP();
    else pauseGSAP();
  });
  
  // Advanced intersection observer for simple reveals (replaces ScrollTrigger where possible)
  const simpleIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.revealed === '1') return;
        el.dataset.revealed = '1';
        
        if (typeof gsap !== 'undefined' && motionOK) {
          gsap.fromTo(el, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
          );
        } else {
          el.style.opacity = '1';
          el.style.transform = 'none';
        }
        simpleIO.unobserve(el);
      }
    });
  }, { rootMargin: '50px' });
  
  // Auto-observe simple reveal elements
  requestIdleCallback(() => {
    document.querySelectorAll('.card, .btn, .subtitle').forEach(el => {
      if (!el.closest('.hero')) simpleIO.observe(el);
    });
  });
  
  // Viewport category caching for flower layout
  let cachedVPCategory = null;
  let lastVPWidth = 0;
  
  function getCachedViewportCategory() {
    const w = window.innerWidth;
    if (w === lastVPWidth && cachedVPCategory) return cachedVPCategory;
    
    lastVPWidth = w;
    if (w < 480) cachedVPCategory = 'xs';
    else if (w < 768) cachedVPCategory = 'sm';
    else if (w < 1024) cachedVPCategory = 'md';
    else cachedVPCategory = 'lg';
    
    return cachedVPCategory;
  }
  
  // Force contain and will-change CSS optimizations
  function injectCSSOptimizations() {
    const style = document.createElement('style');
    style.textContent = `
      .flowers-bg { contain: layout style paint; }
      .flower { will-change: transform; contain: layout; }
      .petals-layer { contain: layout style; }
      .petal { will-change: transform; contain: layout; }
      .blob { will-change: transform; contain: layout; }
      .message__line { contain: layout; }
      .modal { contain: layout style; }
      .hero__content { contain: layout; }
    `;
    document.head.appendChild(style);
  }
  
  // Defer non-critical animations with requestAnimationFrame batching
  const deferredTasks = [];
  let isProcessingDeferred = false;
  
  function addDeferredTask(task) {
    deferredTasks.push(task);
    if (!isProcessingDeferred) {
      isProcessingDeferred = true;
      requestAnimationFrame(processDeferredTasks);
    }
  }
  
  function processDeferredTasks() {
    const start = performance.now();
    while (deferredTasks.length && (performance.now() - start) < 16) {
      const task = deferredTasks.shift();
      if (typeof task === 'function') task();
    }
    
    if (deferredTasks.length) {
      requestAnimationFrame(processDeferredTasks);
    } else {
      isProcessingDeferred = false;
    }
  }
  
  // Override original functions to use deferred system
  const originalInitPetals = window.initPetals;
  const originalInitParallaxBlobs = window.initParallaxBlobs;
  
  if (originalInitPetals) {
    window.initPetals = function() {
      addDeferredTask(originalInitPetals);
    };
  }
  
  if (originalInitParallaxBlobs) {
    window.initParallaxBlobs = function() {
      addDeferredTask(originalInitParallaxBlobs);
    };
  }
  
  // Memory-efficient flower layout caching
  const flowerLayoutCache = new Map();
  const maxCacheSize = 4;
  
  function cacheFlowerLayout(key, layout) {
    if (flowerLayoutCache.size >= maxCacheSize) {
      const firstKey = flowerLayoutCache.keys().next().value;
      flowerLayoutCache.delete(firstKey);
    }
    flowerLayoutCache.set(key, layout);
  }
  
  function getCachedFlowerLayout(key) {
    return flowerLayoutCache.get(key);
  }
  
  // Expose utilities globally
  window.perfBooster = {
    getCachedViewportCategory,
    addDeferredTask,
    cacheFlowerLayout,
    getCachedFlowerLayout,
    isTabVisible: () => isTabVisible
  };
  
  // Initialize CSS optimizations
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectCSSOptimizations);
  } else {
    injectCSSOptimizations();
  }
  
  // Cleanup on unload
  window.addEventListener('beforeunload', () => {
    pausedAnimations.length = 0;
    flowerLayoutCache.clear();
    deferredTasks.length = 0;
  });
  
})();

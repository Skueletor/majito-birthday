(()=>{
  const docReady = (fn) => {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  };

  const idle = (fn, timeout = 1000) => {
    if ('requestIdleCallback' in window) {
      return requestIdleCallback(fn, { timeout });
    }
    return setTimeout(fn, timeout);
  };

  const whenVisible = (el, handler, options = {}) => {
    if (!el) return () => {};
    const config = {
      root: options.root || null,
      threshold: options.threshold ?? 0.1,
      rootMargin: options.rootMargin || '0px',
      once: options.once !== false
    };
    let triggered = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        if (!config.once || !triggered) handler(entry);
        triggered = true;
        if (config.once) {
          observer.unobserve(entry.target);
          observer.disconnect();
        }
      });
    }, config);
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  };

  const rand = (min, max) => Math.random() * (max - min) + min;
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const motionQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
  const desktopQuery = window.matchMedia('(min-width: 768px)');

  const state = {
    motionAllowed: motionQuery.matches,
    desktop: desktopQuery.matches,
    lenis: null,
    lenisFrame: null,
    lenisScrollBound: false,
    gsapReady: false,
    mm: null,
    decorInitialized: false,
    decorSprites: [],
    petalsSystem: null,
    petalsObserver: null,
    petalsVisibilityHandler: null,
    heroVisible: false,
    mapInitialized: false
  };

  if (typeof motionQuery.addEventListener === 'function') motionQuery.addEventListener('change', onMotionChange);
  else motionQuery.addListener(onMotionChange);

  if (typeof desktopQuery.addEventListener === 'function') desktopQuery.addEventListener('change', onDesktopChange);
  else desktopQuery.addListener(onDesktopChange);

  docReady(() => {
    setupLenis();
    setupAnchors();
    setupModal();
    setupGsap();
    idle(() => {
      initDecorations();
      initPetals();
    }, 900);
    lazyLoadMap();
  });

  function setupGsap(){
    if (state.gsapReady) return;
    if (!window.gsap || !window.ScrollTrigger) {
      window.addEventListener('load', setupGsap, { once: true });
      return;
    }
    state.gsapReady = true;
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    state.mm = gsap.matchMedia();

    bindLenisToScrollTrigger();

    window.addEventListener('load', () => {
      requestAnimationFrame(() => {
        try { ScrollTrigger.refresh(); } catch (_){ }
        if (state.lenis?.resize) {
          try { state.lenis.resize(); } catch (_){ }
        }
      });
    }, { once: true });

    initHeroAnimations();
    initMessageAnimations();
    initDetailsAnimation();
    initPanelsReveal();
    initParallaxBlobs();
    initPetals();
  }

  function setupLenis(){
    if (!state.motionAllowed || state.lenis || typeof Lenis !== 'function') return;
    state.lenis = new Lenis({
      lerp: state.desktop ? 0.12 : 0.09,
      smoothWheel: state.desktop,
      smoothTouch: false,
      touchMultiplier: 1.2,
      wheelMultiplier: state.desktop ? 0.85 : 0.8,
      normalizeWheel: true
    });

    const raf = (time) => {
      if (!state.lenis) return;
      state.lenis.raf(time);
      state.lenisFrame = requestAnimationFrame(raf);
    };
    state.lenisFrame = requestAnimationFrame(raf);
    bindLenisToScrollTrigger();
  }

  function bindLenisToScrollTrigger(){
    if (!state.lenis || !state.gsapReady || state.lenisScrollBound || !window.ScrollTrigger) return;
    state.lenis.on('scroll', () => { window.ScrollTrigger && window.ScrollTrigger.update(); });
    state.lenisScrollBound = true;
  }

  function destroyLenis(){
    if (!state.lenis) return;
    try { state.lenis.destroy(); } catch (_){ }
    state.lenis = null;
    if (state.lenisFrame) cancelAnimationFrame(state.lenisFrame);
    state.lenisFrame = null;
    state.lenisScrollBound = false;
  }

  function refreshScrollTrigger(delay = 140){
    if (!window.ScrollTrigger) return;
    setTimeout(() => {
      try { window.ScrollTrigger.refresh(); } catch (_){ }
    }, delay);
  }

  function onMotionChange(event){
    state.motionAllowed = event.matches;
    if (!state.motionAllowed) {
      destroyLenis();
      state.petalsSystem?.stop(true);
      return;
    }
    setupLenis();
    bindLenisToScrollTrigger();
    if (state.petalsSystem) {
      if (state.heroVisible) state.petalsSystem.start();
    } else {
      initPetals();
    }
    refreshScrollTrigger();
  }

  function onDesktopChange(event){
    state.desktop = event.matches;
    if (state.lenis) {
      state.lenis.options.lerp = state.desktop ? 0.12 : 0.09;
      state.lenis.options.smoothWheel = state.desktop;
    }
    state.petalsSystem?.setDesktop?.(state.desktop);
  }

  function setupAnchors(){
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (event) => {
        const id = anchor.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        if (state.lenis) {
          state.lenis.scrollTo(target, { offset: -10 });
        } else {
          const top = target.getBoundingClientRect().top + window.scrollY - 10;
          window.scrollTo({ top, behavior: state.motionAllowed ? 'smooth' : 'auto' });
        }
      }, { passive: false });
    });
  }

  function initHeroAnimations(){
    const hero = document.querySelector('.hero__content');
    if (!hero) return;

    if (!state.motionAllowed || !window.gsap) {
      ['.overtitle', '.subtitle', '.btn--primary', '.title'].forEach((sel) => {
        const el = document.querySelector(sel);
        if (!el) return;
        el.style.opacity = 1;
        el.style.transform = 'none';
        if (sel === '.title') el.style.clipPath = 'none';
      });
      return;
    }

    const { gsap } = window;
    gsap.set(['.overtitle', '.subtitle', '.btn--primary'], { opacity: 0, y: 24 });
    gsap.set('.title', { clipPath: 'inset(0 0 100% 0)' });

    whenVisible(hero, () => {
      if (!state.mm) return;
      state.mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out', duration: 0.6 } });
        tl.to('.overtitle', { opacity: 1, y: 0 })
          .to('.title', { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power3.out' }, '-=0.35')
          .to('.subtitle', { opacity: 1, y: 0 }, '-=0.25')
          .to('.btn--primary', { opacity: 1, y: 0 }, '-=0.15');
      });

      state.mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.from(hero, { opacity: 0, y: 26, duration: 0.7, ease: 'power2.out' });
      });
    }, { once: true, rootMargin: '-5% 0px' });
  }

  function initMessageAnimations(){
    const section = document.querySelector('#mensaje');
    if (!section) return;
    const lines = Array.from(section.querySelectorAll('.message__line'));
    const title = section.querySelector('.message__title');

    if (!state.motionAllowed || !window.gsap || !window.ScrollTrigger) {
      if (title) {
        title.style.opacity = 1;
        title.style.transform = 'none';
      }
      lines.forEach((line) => {
        line.style.opacity = 1;
        line.style.transform = 'none';
      });
      return;
    }

    const { gsap } = window;
    if (!state.mm) return;

    const buildStoryTimeline = (options = {}) => {
      const {
        end = '+=200%',
        scrub = 0.75,
        pin = true,
        titleDuration = 0.6,
        lineDuration = 0.32,
        gap = 0.25,
        titleOffset = 20,
        lineOffset = 22,
        anticipatePin = 0.8
      } = options;

      if (title) gsap.set(title, { autoAlpha: 0, y: titleOffset });
      gsap.set(lines, { autoAlpha: 0, y: lineOffset });

      const tl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end,
          scrub,
          pin,
          anticipatePin,
          invalidateOnRefresh: true
        }
      });

      if (title) {
        tl.to(title, { autoAlpha: 1, y: 0, duration: titleDuration });
      }

      const [first, second, third] = lines;
      if (first) {
        tl.to({}, { duration: gap })
          .to(first, { autoAlpha: 1, y: 0, duration: lineDuration })
          .to({}, { duration: gap * 0.8 });
        if (second || third) {
          tl.to(first, { autoAlpha: 0, duration: Math.max(0.18, lineDuration * 0.65) });
        }
      }

      if (second) {
        tl.to(second, { autoAlpha: 1, y: 0, duration: lineDuration })
          .to({}, { duration: gap * 0.75 });
        if (third) {
          tl.to(second, { autoAlpha: 0, duration: Math.max(0.18, lineDuration * 0.6) });
        }
      }

      if (third) {
        tl.to(third, { autoAlpha: 1, y: 0, duration: lineDuration });
      }

      return () => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
        const targets = title ? [title, ...lines] : [...lines];
        gsap.set(targets, { clearProps: 'opacity,visibility,transform' });
      };
    };

    state.mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () =>
      buildStoryTimeline({
        end: '+=220%',
        scrub: 0.85,
        gap: 0.27,
        lineDuration: 0.32,
        titleDuration: 0.62,
        lineOffset: 22,
        anticipatePin: 0.85
      })
    );

    state.mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', () =>
      buildStoryTimeline({
        end: '+=180%',
        scrub: 0.65,
        gap: 0.22,
        lineDuration: 0.28,
        titleDuration: 0.5,
        lineOffset: 18,
        titleOffset: 18,
        anticipatePin: 0.9
      })
    );
  }

  function initDetailsAnimation(){
    const section = document.querySelector('#detalles');
    if (!section) return;
    const cards = section.querySelectorAll('.card');

    if (!state.motionAllowed || !window.gsap) {
      cards.forEach((card) => {
        card.style.opacity = 1;
        card.style.transform = 'none';
      });
      return;
    }

    const { gsap } = window;
    gsap.from(cards, {
      opacity: 0,
      y: 24,
      duration: 0.55,
      stagger: 0.12,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        toggleActions: 'play none none none',
        once: true
      }
    });
  }

  function initPanelsReveal(){
    if (!state.motionAllowed || !window.gsap) return;
    const { gsap } = window;
    gsap.utils.toArray('.panel').forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 26,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none none',
          once: true
        }
      });
    });
  }

  function initParallaxBlobs(){
    if (!state.motionAllowed || !state.mm || !window.gsap) return;
    state.mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
      const { gsap } = window;
      ['.blob--tl', '.blob--tr', '.blob--bl', '.blob--br'].forEach((selector, index) => {
        gsap.to(selector, {
          yPercent: index % 2 === 0 ? -7 : 9,
          xPercent: index % 2 === 0 ? 5 : -4,
          ease: 'none',
          scrollTrigger: {
            trigger: '#inicio',
            start: 'top top',
            end: '+=80%',
            scrub: 0.8
          }
        });
      });
    });
  }

  function initDecorations(){
    if (state.decorInitialized) return;
    state.decorInitialized = true;

    const heroBg = document.querySelector('.hero__bg');
    const mensaje = document.querySelector('#mensaje');
    const detalles = document.querySelector('#detalles');
    const ubicacion = document.querySelector('#ubicacion');
    const rsvp = document.querySelector('#rsvp');

    const sections = [
      { el: heroBg, flowers: state.desktop ? 14 : 9, beers: state.desktop ? 2 : 1, append: true },
      { el: mensaje, flowers: state.desktop ? 7 : 4, beers: 0 },
      { el: detalles, flowers: state.desktop ? 7 : 4, beers: 1 },
      { el: ubicacion, flowers: state.desktop ? 5 : 4, beers: 0 },
      { el: rsvp, flowers: state.desktop ? 5 : 4, beers: 1 }
    ];

    const queue = [];
    let flowerIndex = 1;
    const flowerTotal = 11;

    sections.forEach((section) => {
      if (!section.el) return;
      if (!section.el.style.position || section.el.style.position === 'static') {
        section.el.style.position = 'relative';
      }
      const total = section.flowers + section.beers;
      for (let i = 0; i < total; i += 1) {
        const isBeer = i >= section.flowers;
        queue.push({
          container: section.el,
          index: i,
          total: Math.max(total, 8),
          isBeer,
          append: section.append === true,
          getSrc: () => {
            if (isBeer) return pick(['assets/images/beer1.png', 'assets/images/beer2.png']);
            const src = `assets/flowers/${flowerIndex}.png`;
            flowerIndex = flowerIndex === flowerTotal ? 1 : flowerIndex + 1;
            return src;
          }
        });
      }
    });

    if (!queue.length) return;

    const renderSprite = (item) => {
      const img = document.createElement('img');
      img.className = `decor ${item.isBeer ? 'decor--beer' : 'decor--flower'}`;
      img.decoding = 'async';
      img.loading = 'lazy';
      img.alt = '';
      img.draggable = false;
      img.style.willChange = 'transform';
      const size = item.isBeer ? Math.round(rand(90, state.desktop ? 140 : 110)) : Math.round(rand(40, 115));
      img.style.width = `${size}px`;
      img.style.height = 'auto';
      Object.assign(img.style, edgePosition(item.index, item.total));
      img.style.transform = `rotate(${Math.round(rand(-16, 16))}deg)`;
      img.onerror = () => img.remove();
      img.src = item.getSrc();
      if (item.append) item.container.appendChild(img);
      else item.container.insertBefore(img, item.container.firstChild);
      state.decorSprites.push(img);
    };

    const pump = () => {
      queue.splice(0, 3).forEach(renderSprite);
      if (queue.length) {
        requestAnimationFrame(pump);
      } else if (state.motionAllowed && window.gsap) {
        animateDecorSprites();
      }
    };

    requestAnimationFrame(pump);
  }

  function edgePosition(index, total){
    const margin = 6;
    const segment = total / 4 || 1;
    const pos = {};
    const offsetVH = rand(1.5, 5.5);
    const offsetVW = rand(1.5, 5.5);

    if (index < segment) {
      const ratio = index / segment;
      pos.top = margin + ((100 - margin * 2) * ratio) + offsetVH;
      pos.left = margin + offsetVW;
    } else if (index < segment * 2) {
      const ratio = (index - segment) / segment;
      pos.top = margin + ((100 - margin * 2) * ratio) + offsetVH;
      pos.right = margin + offsetVW;
    } else if (index < segment * 3) {
      const ratio = (index - segment * 2) / segment;
      pos.bottom = margin + ((100 - margin * 2) * ratio) + offsetVH;
      pos.right = margin + offsetVW;
    } else {
      const ratio = (index - segment * 3) / segment;
      pos.bottom = margin + ((100 - margin * 2) * ratio) + offsetVH;
      pos.left = margin + offsetVW;
    }

    if (pos.top !== undefined) pos.top = `${pos.top}vh`;
    if (pos.bottom !== undefined) pos.bottom = `${pos.bottom}vh`;
    if (pos.left !== undefined) pos.left = `${pos.left}vw`;
    if (pos.right !== undefined) pos.right = `${pos.right}vw`;
    return pos;
  }

  function animateDecorSprites(){
    if (!window.gsap) return;
    const { gsap } = window;
    state.decorSprites.forEach((el, index) => {
      const deltaY = index % 2 ? -8 : 10;
      const deltaR = index % 2 ? -5 : 5;
      gsap.to(el, {
        y: deltaY,
        rotation: `+=${deltaR}`,
        duration: rand(3, 4.6),
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut'
      });
    });
  }

  function initPetals(){
    if (!state.motionAllowed || !window.gsap || state.petalsObserver) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const system = createPetalSystem();
    state.petalsSystem = system;
    state.petalsObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== hero) return;
        state.heroVisible = entry.isIntersecting;
        if (!state.motionAllowed) return;
        if (entry.isIntersecting) system.start();
        else system.stop();
      });
    }, { threshold: 0.2 });
    state.petalsObserver.observe(hero);

    if (!state.petalsVisibilityHandler) {
      const handler = () => {
        if (!state.petalsSystem) return;
        if (document.hidden) state.petalsSystem.stop();
        else if (state.motionAllowed && state.heroVisible) state.petalsSystem.start();
      };
      document.addEventListener('visibilitychange', handler);
      state.petalsVisibilityHandler = handler;
    }
  }

  function createPetalSystem(){
    let layer = null;
    let active = 0;
    let timer = null;
    let running = false;
    let maxActive = state.desktop ? 14 : 6;

    const ensureLayer = () => {
      if (!layer) {
        layer = document.querySelector('.petals-layer');
        if (!layer) {
          layer = document.createElement('div');
          layer.className = 'petals-layer';
          document.body.prepend(layer);
        }
      }
      return layer;
    };

    const spawn = () => {
      const root = ensureLayer();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const element = document.createElement('span');
      const variant = pick(['', ' p2', ' p3']);
      element.className = `petal${variant}`;
      element.style.left = `${rand(-40, vw + 40)}px`;
      element.style.top = `${rand(-140, -60)}px`;
      element.style.willChange = 'transform';
      root.appendChild(element);
      active += 1;

      const horizontalDrift = rand(vw * 0.12, vw * 0.26) * (Math.random() < 0.5 ? -1 : 1);
      const fallDuration = rand(12, state.desktop ? 20 : 16);
      const verticalDistance = vh + 90;

      window.gsap.to(element, {
        x: `+=${horizontalDrift}`,
        y: verticalDistance,
        rotation: `+=${rand(-40, 40)}`,
        ease: 'none',
        duration: fallDuration,
        onComplete: () => {
          active -= 1;
          window.gsap.killTweensOf(element);
          element.remove();
        }
      });

      window.gsap.to(element, {
        x: `+=${rand(24, 60) * (Math.random() < 0.5 ? -1 : 1)}`,
        rotation: `+=${rand(8, 16) * (Math.random() < 0.5 ? -1 : 1)}`,
        duration: rand(1.6, 2.4),
        yoyo: true,
        repeat: Math.ceil(fallDuration / 2),
        ease: 'sine.inOut'
      });
    };

    const schedule = () => {
      if (!running) return;
      timer = window.setTimeout(() => {
        if (!document.hidden && active < maxActive) spawn();
        schedule();
      }, rand(state.desktop ? 800 : 1200, state.desktop ? 1800 : 2400));
    };

    return {
      start(){
        if (!state.motionAllowed || running) return;
        running = true;
        for (let i = 0; i < Math.min(4, maxActive); i += 1) spawn();
        schedule();
      },
      stop(clear = false){
        running = false;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        if (clear && layer) {
          Array.from(layer.children).forEach((child) => child.remove());
          active = 0;
        }
      },
      setDesktop(isDesktop){
        maxActive = isDesktop ? 14 : 6;
      }
    };
  }

  function lazyLoadMap(){
    const wrap = document.getElementById('mapWrap');
    if (!wrap) return;
    whenVisible(wrap, () => initMap(wrap), { once: true, rootMargin: '0px 0px 260px' });
  }

  function initMap(wrap){
    if (state.mapInitialized) return;
    if (typeof L === 'undefined') {
      window.addEventListener('load', () => initMap(wrap), { once: true });
      return;
    }
    state.mapInitialized = true;

    const mapDiv = document.createElement('div');
    mapDiv.id = 'map';
    mapDiv.style.height = '100%';
    wrap.appendChild(mapDiv);

    const gmapsUrl = wrap.getAttribute('data-gmaps-url');
    const address = wrap.getAttribute('data-address') || '';
    const lat = parseFloat(wrap.getAttribute('data-lat'));
    const lng = parseFloat(wrap.getAttribute('data-lng'));

    const openBtn = document.getElementById('openGmaps');
    if (openBtn && gmapsUrl) openBtn.href = gmapsUrl;

    const map = L.map(mapDiv, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([lat || 0, lng || 0], !Number.isNaN(lat) && !Number.isNaN(lng) ? 15 : 2);

    const carto = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    });

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    carto.addTo(map);
    carto.on('tileerror', () => {
      if (!map.hasLayer(osm)) osm.addTo(map);
    });

    const placeMarker = (coords) => {
      const icon = L.divIcon({
        className: 'marker-pin',
        iconSize: [30, 30],
        popupAnchor: [0, -16]
      });
      const marker = L.marker(coords, { icon }).addTo(map);
      marker.bindPopup(`<b>Majito Birthday</b><br>${address || 'Ubicación'}`);
      map.setView(coords, 16, { animate: state.motionAllowed });
    };

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      placeMarker([lat, lng]);
    } else if (address) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`, {
        headers: { Accept: 'application/json' }
      })
        .then((response) => response.json())
        .then((results) => {
          if (Array.isArray(results) && results.length) {
            placeMarker([parseFloat(results[0].lat), parseFloat(results[0].lon)]);
          }
        })
        .catch(() => {});
    }
  }

  function setupModal(){
    const openBtn = document.getElementById('giftOpen');
    const modal = document.getElementById('giftModal');
    const img = document.getElementById('giftImg');
    const downloadBtn = document.getElementById('giftDownload');
    if (!openBtn || !modal || !img || !downloadBtn) return;
    const modalContent = modal.querySelector('.modal__content');
    const closeX = modal.querySelector('.modal__close-x');
    const closeBtn = document.getElementById('giftClose');

    img.decoding = 'async';
    img.loading = 'lazy';
    img.style.willChange = 'transform';

    const REMOTE_URL = 'https://i.ibb.co/yFFc2XYW/qr-code.png';
    const LOCAL_URL = 'assets/qr-code.png';
    const FILENAME = 'qr-majito.png';
    let currentUrl = REMOTE_URL;
    let hasDownloaded = false;
    let guardShown = false;
    let guardImg = null;

    const preload = () => {
      [REMOTE_URL, LOCAL_URL].forEach((src) => {
        const preloadImg = new Image();
        preloadImg.decoding = 'async';
        preloadImg.src = src;
      });
    };
    idle(preload, 1500);

    const resetGuard = () => {
      guardShown = false;
      modal.classList.remove('modal--guarded');
      if (closeX) closeX.hidden = true;
      if (guardImg) {
        guardImg.remove();
        guardImg = null;
      }
    };

    const onKey = (event) => {
      if (event.key === 'Escape') closeModal();
    };

    const openModal = () => {
      currentUrl = REMOTE_URL;
      img.onerror = () => {
        currentUrl = LOCAL_URL;
        img.onerror = null;
        img.src = LOCAL_URL;
      };
      img.src = currentUrl;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      if (modalContent) modalContent.style.willChange = 'transform, opacity';
      hasDownloaded = false;
      resetGuard();
      document.addEventListener('keydown', onKey);
    };

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      img.classList.remove('is-zoomed');
      document.removeEventListener('keydown', onKey);
      resetGuard();
      if (modalContent) {
        requestAnimationFrame(() => {
          modalContent.style.willChange = '';
        });
      }
    };

    openBtn.addEventListener('click', (event) => {
      event.preventDefault();
      openModal();
    });

    const backdrop = modal.querySelector('.modal__backdrop');
    if (backdrop) backdrop.addEventListener('click', closeModal);

    if (closeBtn) {
      closeBtn.addEventListener('click', (event) => {
        if (!hasDownloaded) {
          event.preventDefault();
          if (guardShown || !modalContent) return;
          guardShown = true;
          modal.classList.add('modal--guarded');
          if (closeX) closeX.hidden = false;
          guardImg = document.createElement('img');
          guardImg.src = 'assets/images/sticker.png';
          guardImg.alt = '';
          guardImg.className = 'sticker-guard';
          const btnRect = closeBtn.getBoundingClientRect();
          const contentRect = modalContent.getBoundingClientRect();
          const desiredWidth = Math.min(180, Math.max(120, Math.floor(window.innerWidth * 0.32)));
          guardImg.style.width = `${desiredWidth}px`;
          guardImg.style.left = `${Math.max(0, (btnRect.left - contentRect.left) + (btnRect.width / 2) - (desiredWidth / 2))}px`;
          guardImg.style.top = `${Math.max(0, (btnRect.top - contentRect.top) - desiredWidth * 0.55)}px`;
          modalContent.appendChild(guardImg);
          return;
        }
        closeModal();
      });
    }

    if (closeX) closeX.addEventListener('click', closeModal);

    img.addEventListener('click', () => {
      img.classList.toggle('is-zoomed');
    });

    const attemptDownload = async (url) => {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error('fetch failed');
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = FILENAME;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      link.remove();
    };

    downloadBtn.addEventListener('click', async () => {
      try {
        await attemptDownload(currentUrl);
      } catch (_) {
        const fallback = currentUrl === REMOTE_URL ? LOCAL_URL : REMOTE_URL;
        try {
          await attemptDownload(fallback);
          currentUrl = fallback;
        } catch (_error) {
          window.open(currentUrl, '_blank');
        }
      }
      hasDownloaded = true;
      resetGuard();
    });

    modal.querySelectorAll('[data-close]').forEach((btn) => {
      if (btn === closeBtn || btn === closeX || btn === backdrop) return;
      btn.addEventListener('click', closeModal);
    });
  }
})();

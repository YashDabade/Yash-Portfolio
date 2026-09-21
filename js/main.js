const TOTAL_FRAMES = 100;
const HERO_START = 1;
const HERO_END = 55;
const NEXT_START = 55;
const NEXT_END = 100;

function frameSrc(i) {
  return `animation1/frame_${String(i).padStart(3, "0")}.jpg`;
}

function preloadFrames(onProgress) {
  const images = {};
  let loaded = 0;
  const promises = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    const p = new Promise((resolve) => {
      img.onload = img.onerror = () => {
        loaded++;
        onProgress(loaded / TOTAL_FRAMES);
        resolve();
      };
    });
    img.src = frameSrc(i);
    images[i] = img;
    promises.push(p);
  }
  return { images, ready: Promise.all(promises) };
}

function setupScrollytelling(canvasId, wrapperId, frameStart, frameEnd, images) {
  const canvas = document.getElementById(canvasId);
  const wrapper = document.getElementById(wrapperId);
  const ctx = canvas.getContext("2d");
  let currentFrame = -1;

  function draw(frameIndex) {
    const img = images[frameIndex];
    if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    draw(currentFrame === -1 ? frameStart : currentFrame);
  }

  function update() {
    const rect = wrapper.getBoundingClientRect();
    const total = wrapper.offsetHeight - window.innerHeight;
    let progress = total > 0 ? -rect.top / total : 0;
    progress = Math.min(Math.max(progress, 0), 1);
    const frameIndex = Math.round(frameStart + progress * (frameEnd - frameStart));
    if (frameIndex !== currentFrame) {
      currentFrame = frameIndex;
      draw(frameIndex);
    }
    return progress;
  }

  window.addEventListener("resize", resize);
  resize();

  return { update, wrapper };
}

function setupRevealObserver() {
  const targets = document.querySelectorAll(".fade-up, .stagger, .iris-reveal");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible", "is-open");
        }
      });
    },
    { threshold: 0.25 }
  );
  targets.forEach((el) => obs.observe(el));
}

function setupNav() {
  const nav = document.getElementById("site-nav");
  const toggle = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 60) {
      nav.classList.add("nav-solid");
    } else {
      nav.classList.remove("nav-solid");
    }
  });

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("hidden");
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => mobileMenu.classList.add("hidden"))
    );
  }
}

function setupYear() {
  const el = document.getElementById("year");
  if (el) el.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupRevealObserver();
  setupYear();

  const loader = document.getElementById("loader");
  const loaderFill = document.getElementById("loader-fill");

  const { images, ready } = preloadFrames((frac) => {
    if (loaderFill) loaderFill.style.width = `${Math.round(frac * 100)}%`;
  });

  const heroScroll = setupScrollytelling("hero-canvas", "hero-scroll", HERO_START, HERO_END, images);
  const nextScroll = setupScrollytelling("next-canvas", "next-scroll", NEXT_START, NEXT_END, images);

  function onScroll() {
    heroScroll.update();
    nextScroll.update();
  }

  ready.then(() => {
    if (loader) {
      setTimeout(() => loader.classList.add("hidden"), 250);
    }
    onScroll();
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
});

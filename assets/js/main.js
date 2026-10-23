/* =========================================================
   POLA — interactions
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const fmtINR = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

  document.documentElement.classList.remove("no-js");

  /* ---------------- Products ---------------- */
  const PRODUCTS = {
    orb:  { id: "orb",  name: "Orb mini",    size: "30ml",  price: 199,  spec: "30ml · key ring · flight-safe", desc: "Key ring, flight-safe. Lives on your keys, passes airport security." },
    clip: { id: "clip", name: "Clip",        size: "120ml", price: 549,  spec: "120ml · clips to the bag",       desc: "Clips to the bag. The hero bottle — the one people see." },
    puck: { id: "puck", name: "Puck refill", size: "500ml", price: 1199, spec: "500ml · stays home",             desc: "Stays home. Refill keeps loyal users near the clinical price." },
  };
  const bottleMarkup = {
    orb:  '<div class="bottle bottle--orb"><i class="ring"></i><i class="cap"></i><i class="body"><b>pola</b><small>30 ml</small></i></div>',
    clip: '<div class="bottle bottle--clip"><i class="carabiner"></i><i class="cap"></i><i class="body"><b>pola</b></i></div>',
    puck: '<div class="bottle bottle--puck"><i class="cap marble marble--yellow"></i><i class="body"><b>pola</b><small>refill 500 ml</small></i></div>',
  };

  /* ---------------- Toast ---------------- */
  const toastEl = $("[data-toast]");
  let toastT;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  };

  /* ---------------- Hero split ---------------- */
  const splitTarget = $("[data-split]");
  if (splitTarget) {
    const text = splitTarget.textContent;
    splitTarget.innerHTML = [...text]
      .map((ch) => `<span class="char-wrap" aria-hidden="true"><span class="char">${ch}</span></span>`)
      .join("");
  }

  /* ---------------- Preloader ---------------- */
  const pre = $(".preloader");
  const preCount = $(".preloader__count");
  const preWord = $(".preloader__word");
  const preBar = $(".preloader__bar");
  let introPlayed = false;

  const playIntro = () => {
    if (introPlayed) return;
    introPlayed = true;
    pre.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    if (lenis) lenis.start();
    const chars = $$(".hero__title .char");
    if (reduceMotion) return;
    chars.forEach((c, i) => {
      c.animate(
        [{ transform: "translateY(105%) rotate(8deg)" }, { transform: "translateY(0) rotate(0)" }],
        { duration: 1200, delay: 250 + i * 90, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }
      );
    });
    $$("[data-hero-fade]").forEach((el, i) => {
      el.animate(
        [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }],
        { duration: 1000, delay: 650 + i * 110, easing: "cubic-bezier(.16,1,.3,1)", fill: "both" }
      );
    });
    $$(".hero__bottles .float").forEach((el, i) => {
      el.animate(
        [{ opacity: 0, transform: "translateY(120px) scale(.7)" }, { opacity: 1, transform: "none" }],
        { duration: 1400, delay: 500 + i * 120, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" }
      );
    });
    // celebratory burst
    setTimeout(() => {
      const t = $(".hero__title");
      if (!t) return;
      const r = t.getBoundingClientRect();
      mist.burst(r.left + r.width * 0.9, r.top + r.height * 0.3, 90);
    }, 900);
  };

  const runPreloader = () => {
    if (reduceMotion) {
      pre.style.display = "none";
      playIntro();
      return;
    }
    const start = performance.now();
    const min = 1500;
    let loaded = document.readyState === "complete";
    window.addEventListener("load", () => (loaded = true), { once: true });
    const tick = (now) => {
      const t = now - start;
      let p = clamp(t / min, 0, 1);
      if (!loaded) p = Math.min(p, 0.9);
      if (t > 4000) p = 1; // never block forever
      const eased = 1 - Math.pow(1 - p, 3);
      const pct = Math.round(eased * 100);
      preCount.textContent = String(pct).padStart(3, "0");
      preWord.style.setProperty("--p", pct + "%");
      preBar.style.setProperty("--pf", eased);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(playIntro, 200);
    };
    requestAnimationFrame(tick);
  };

  /* ---------------- Lenis / GSAP ---------------- */
  let lenis = null;
  const initSmooth = () => {
    if (reduceMotion || typeof window.Lenis !== "function") return;
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    lenis.stop();
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  };

  const scrollToTarget = (target) => {
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -20 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  };

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const t = $(id);
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t);
      history.replaceState(null, "", id);
    });
  });

  const initGsapScenes = () => {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero title drifts and the cover darkens as you leave it
    gsap.to(".hero__title", {
      yPercent: 30, scale: 0.92, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".hero__bottles", {
      yPercent: -25, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });

    // Footer wordmark rises
    gsap.fromTo(".footer__big", { yPercent: 40 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });
  };

  /* ---------------- Reveal on scroll ---------------- */
  const initReveal = () => {
    const els = $$("[data-reveal]");
    // stagger siblings
    const groups = new Map();
    els.forEach((el) => {
      const p = el.parentElement;
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p).push(el);
    });
    groups.forEach((list) => list.forEach((el, i) => el.style.setProperty("--d", `${Math.min(i, 5) * 0.08}s`)));

    if (!("IntersectionObserver" in window) || reduceMotion) {
      els.forEach((el) => el.classList.add("is-in"));
      $$("[data-count]").forEach(runCounter);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.classList.add("is-in");
          $$("[data-count]", el).forEach(runCounter);
          const scr = el.closest(".section")?.querySelector("[data-scramble]");
          if (scr && !scr.dataset.done) { scr.dataset.done = 1; scramble(scr); }
          io.unobserve(el);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((el) => io.observe(el));

    // counters not inside a reveal
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.5 });
    $$("[data-count]").filter((c) => !c.closest("[data-reveal]")).forEach((c) => cio.observe(c));
  };

  /* ---------------- Counters ---------------- */
  function runCounter(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = 1;
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || "0", 10);
    const comma = el.dataset.format === "comma";
    const fmt = (v) => {
      const n = dec ? v.toFixed(dec) : Math.round(v).toString();
      return comma ? Number(n).toLocaleString("en-IN") : n;
    };
    if (reduceMotion) { el.textContent = fmt(end); return; }
    const dur = 1600;
    const t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(end * e);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Scramble text ---------------- */
  const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";
  function scramble(el) {
    if (reduceMotion) return;
    let node = el.querySelector(".scr");
    if (!node) {
      const textNode = [...el.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim());
      if (!textNode) return;
      node = document.createElement("span");
      node.className = "scr";
      node.textContent = textNode.textContent;
      el.replaceChild(node, textNode);
    }
    const final = node.dataset.final || node.textContent;
    node.dataset.final = final;
    let frame = 0;
    const total = 22;
    cancelAnimationFrame(node._raf);
    const run = () => {
      frame++;
      node.textContent = [...final].map((ch, i) => {
        if (ch === " ") return " ";
        return i / final.length < frame / total ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }).join("");
      if (frame < total) node._raf = requestAnimationFrame(run);
      else node.textContent = final;
    };
    run();
  }
  $$("[data-scramble]").forEach((el) => el.addEventListener("mouseenter", () => scramble(el)));

  /* ---------------- Cursor, magnetic, tilt ---------------- */
  const initPointerFX = () => {
    if (!finePointer || reduceMotion) return;
    document.body.classList.add("has-cursor");
    const cur = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $(".cursor__label");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });
    window.addEventListener("pointerdown", () => cur.classList.add("is-down"));
    window.addEventListener("pointerup", () => cur.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => (cur.style.opacity = 0));
    document.addEventListener("mouseenter", () => (cur.style.opacity = 1));

    const loop = () => {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    const hoverSel = "a, button, input, select, label, [data-tilt], .dot";
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest(hoverSel);
      const lab = e.target.closest("[data-cursor]");
      cur.classList.toggle("is-hover", !!t);
      if (lab) { label.textContent = lab.dataset.cursor; cur.classList.add("is-label"); }
      else cur.classList.remove("is-label");
    });

    // magnetic
    $$("[data-magnetic]").forEach((el) => {
      const strength = el.classList.contains("btn") ? 0.3 : 0.4;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--bx", `${(x - r.width / 2) * strength}px`);
        el.style.setProperty("--by", `${(y - r.height / 2) * strength}px`);
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--bx", "0px"); el.style.setProperty("--by", "0px"); });
    });

    // tilt + glare
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", `${(px - 0.5) * 8}deg`);
        el.style.setProperty("--rx", `${(0.5 - py) * 8}deg`);
        el.style.setProperty("--gx", `${px * 100}%`);
        el.style.setProperty("--gy", `${py * 100}%`);
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });

    // hero bottles follow the cursor
    const floats = $$(".hero .float");
    const hero = $(".hero");
    let hx = 0, hy = 0, tx = 0, ty = 0;
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
    });
    hero.addEventListener("pointerleave", () => { tx = 0; ty = 0; });
    const heroLoop = () => {
      hx = lerp(hx, tx, 0.06); hy = lerp(hy, ty, 0.06);
      floats.forEach((f) => {
        const d = parseFloat(f.dataset.depth || 1);
        f.style.transform = `translate3d(${hx * -60 * d}px, ${hy * -50 * d}px, 0) rotate(${hx * 10 * d}deg)`;
      });
      requestAnimationFrame(heroLoop);
    };
    heroLoop();
  };

  /* ---------------- Mist canvas (spray) ---------------- */
  const mist = (() => {
    const cvs = $(".mist-canvas");
    const ctx = cvs.getContext("2d");
    const parts = [];
    const COLORS = ["rgba(60,200,180,", "rgba(255,245,236,", "rgba(255,92,127,", "rgba(143,240,225,"];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = false;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cvs.width = innerWidth * dpr; cvs.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const emit = (x, y, n = 8, dir = -Math.PI / 2, spread = Math.PI / 2.2) => {
      if (reduceMotion) return;
      for (let i = 0; i < n; i++) {
        const a = dir + (Math.random() - 0.5) * spread;
        const sp = 2 + Math.random() * 6;
        parts.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          r: 1 + Math.random() * 3.5, life: 0, max: 50 + Math.random() * 60,
          c: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      if (parts.length > 900) parts.splice(0, parts.length - 900);
      if (!running) { running = true; requestAnimationFrame(draw); }
    };

    const burst = (x, y, n = 60) => emit(x, y, n, -Math.PI / 2, Math.PI * 2);

    const draw = () => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        p.vx *= 0.96; p.vy = p.vy * 0.96 + 0.025;
        p.x += p.vx; p.y += p.vy;
        p.r += 0.06;
        const a = 1 - p.life / p.max;
        if (a <= 0) { parts.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.fillStyle = p.c + (a * 0.55).toFixed(3) + ")";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (parts.length) requestAnimationFrame(draw);
      else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    };

    // click & hold to spray
    let holding = false, sx = 0, sy = 0, holdRaf;
    const interactive = "a, button, input, select, textarea, label, .drawer, .form, .calc, [data-chart]";
    window.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(interactive)) return;
      holding = true; sx = e.clientX; sy = e.clientY;
      const loop = () => { if (!holding) return; emit(sx, sy, 6); holdRaf = requestAnimationFrame(loop); };
      loop();
    });
    window.addEventListener("pointermove", (e) => { sx = e.clientX; sy = e.clientY; }, { passive: true });
    const stop = () => { holding = false; cancelAnimationFrame(holdRaf); };
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);

    return { emit, burst };
  })();

  /* ---------------- Nav, progress, section tracker ---------------- */
  const nav = $("[data-nav]");
  const navNum = $("[data-nav-num]");
  const navName = $("[data-nav-name]");
  const progress = $(".scroll-progress");
  const sections = $$("[data-section]");
  const navLinks = $$(".nav__links a");
  const lightZones = [$(".hero"), $(".waitlist")];
  const timeline = $("[data-timeline]");
  const tlFill = $("[data-timeline-fill]");
  const weeks = $$(".week");
  const quoteWords = [];

  // split quote words
  const quoteP = $("[data-words]");
  if (quoteP) {
    const words = quoteP.textContent.trim().split(/\s+/);
    quoteP.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
    quoteWords.push(...$$(".w", quoteP));
  }

  let lastY = window.scrollY;
  let currentSec = null;
  const onScroll = () => {
    const y = window.scrollY;
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty("--sp", h > 0 ? (y / h).toFixed(4) : 0);

    // hide on down, show on up
    if (y > 200 && y > lastY + 4 && !document.body.classList.contains("menu-open")) nav.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 200) nav.classList.remove("is-hidden");
    lastY = y;

    // on light background?
    const navMid = 40;
    const onLight = lightZones.some((z) => { if (!z) return false; const r = z.getBoundingClientRect(); return r.top <= navMid && r.bottom >= navMid; });
    nav.classList.toggle("on-light", onLight);

    // current section
    const probe = innerHeight * 0.35;
    let found = sections[0];
    for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= probe) found = s; }
    if (found !== currentSec) {
      currentSec = found;
      navNum.textContent = found.dataset.section;
      navName.textContent = found.dataset.name;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + found.id));
    }

    // timeline
    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const p = clamp((innerHeight * 0.75 - r.top) / (r.height * 0.9), 0, 1);
      tlFill.style.setProperty("--tp", p.toFixed(3));
      weeks.forEach((w, i) => w.classList.toggle("is-reached", p >= (i / weeks.length) + 0.02));
    }

    // quote lighting
    if (quoteWords.length) {
      const r = quoteP.getBoundingClientRect();
      const p = clamp((innerHeight * 0.85 - r.top) / (innerHeight * 0.5), 0, 1);
      const lit = Math.round(p * quoteWords.length);
      quoteWords.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    }
  };
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); }
  }, { passive: true });

  /* ---------------- Mobile menu ---------------- */
  const burger = $("[data-burger]");
  const menu = $("[data-mobile-menu]");
  function closeMenu() {
    if (!menu.classList.contains("is-open")) return;
    menu.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
    if (lenis) lenis.start();
  }
  burger.addEventListener("click", () => {
    const open = !menu.classList.contains("is-open");
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------------- Shop selector ---------------- */
  const shop = $("[data-shop]");
  let selected = "orb";
  const selectProduct = (id, fx = true) => {
    selected = id;
    const p = PRODUCTS[id];
    shop.dataset.active = id;
    $$("[data-shop-tab]", shop).forEach((t) => {
      const on = t.dataset.shopTab === id;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
    });
    $$("[data-shop-bottle]", shop).forEach((b) => b.classList.toggle("is-active", b.dataset.shopBottle === id));
    $("[data-shop-name]", shop).textContent = p.name;
    $("[data-shop-desc]", shop).textContent = p.desc;
    $("[data-shop-price]", shop).textContent = fmtINR(p.price);
    $("[data-shop-spec]", shop).textContent = p.spec;
    if (fx) {
      const st = $(".shop__stage", shop).getBoundingClientRect();
      mist.emit(st.left + st.width / 2, st.top + st.height * 0.35, 40, -Math.PI / 2, Math.PI);
    }
  };
  $$("[data-shop-tab]", shop).forEach((t) => t.addEventListener("click", () => selectProduct(t.dataset.shopTab)));
  $(".shop__tabs", shop).addEventListener("keydown", (e) => {
    const ids = Object.keys(PRODUCTS);
    let i = ids.indexOf(selected);
    if (e.key === "ArrowRight") i = (i + 1) % ids.length;
    else if (e.key === "ArrowLeft") i = (i - 1 + ids.length) % ids.length;
    else return;
    e.preventDefault();
    selectProduct(ids[i]);
    $(`[data-shop-tab="${ids[i]}"]`, shop).focus();
  });
  const stage = $(".shop__stage", shop);
  stage.setAttribute("data-cursor", "Spray");
  stage.addEventListener("click", (e) => mist.emit(e.clientX, e.clientY, 50, -Math.PI / 2, Math.PI / 1.5));

  /* ---------------- Bag ---------------- */
  const BAG_KEY = "pola-bag-v1";
  let bag = {};
  try { bag = JSON.parse(localStorage.getItem(BAG_KEY)) || {}; } catch (_) { bag = {}; }
  const saveBag = () => { try { localStorage.setItem(BAG_KEY, JSON.stringify(bag)); } catch (_) {} };
  const bagCountEl = $("[data-bag-count]");
  const bagItems = $("[data-bag-items]");
  const bagTotal = $("[data-bag-total]");
  const drawer = $("[data-drawer]");
  let lastFocus = null;

  const renderBag = () => {
    const ids = Object.keys(bag).filter((k) => bag[k] > 0 && PRODUCTS[k]);
    const count = ids.reduce((s, k) => s + bag[k], 0);
    const total = ids.reduce((s, k) => s + bag[k] * PRODUCTS[k].price, 0);
    bagCountEl.textContent = count;
    bagCountEl.classList.toggle("has-items", count > 0);
    bagTotal.textContent = fmtINR(total);
    if (!ids.length) {
      bagItems.innerHTML = '<div class="drawer__empty"><b>Your bag is empty.</b>Pick a bottle in section 01 to tell us what to make first.</div>';
      return;
    }
    bagItems.innerHTML = ids.map((k) => {
      const p = PRODUCTS[k];
      return `<div class="bag-item">
        <div class="bag-item__thumb">${bottleMarkup[k]}</div>
        <div><div class="bag-item__name">${p.name}</div><div class="bag-item__meta">${p.size} · ${fmtINR(p.price)}</div></div>
        <div class="qty" role="group" aria-label="Quantity for ${p.name}">
          <button data-qty="-1" data-id="${k}" aria-label="Decrease">−</button><span>${bag[k]}</span><button data-qty="1" data-id="${k}" aria-label="Increase">+</button>
        </div>
      </div>`;
    }).join("");
  };
  bagItems.addEventListener("click", (e) => {
    const b = e.target.closest("[data-qty]");
    if (!b) return;
    const id = b.dataset.id;
    bag[id] = clamp((bag[id] || 0) + parseInt(b.dataset.qty, 10), 0, 20);
    if (!bag[id]) delete bag[id];
    saveBag(); renderBag();
  });

  const openBag = () => {
    lastFocus = document.activeElement;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
    setTimeout(() => $(".drawer__close", drawer).focus(), 50);
  };
  const closeBag = () => {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
    if (lastFocus) lastFocus.focus();
  };
  $$("[data-open-bag]").forEach((b) => b.addEventListener("click", openBag));
  $$("[data-close-bag]").forEach((b) => b.addEventListener("click", closeBag));
  $("[data-bag-reserve]").addEventListener("click", () => {
    const top = Object.keys(bag).sort((a, b) => bag[b] - bag[a])[0];
    if (top) {
      const radio = $(`input[name="bottle"][value="${PRODUCTS[top].name}"]`);
      if (radio) radio.checked = true;
    }
    closeBag();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if (drawer.classList.contains("is-open")) closeBag(); closeMenu(); }
    if (e.key === "Tab" && drawer.classList.contains("is-open")) {
      const f = $$("button, a[href], input", drawer.querySelector(".drawer__panel"));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  $("[data-add-to-bag]").addEventListener("click", (e) => {
    bag[selected] = clamp((bag[selected] || 0) + 1, 0, 20);
    saveBag(); renderBag();
    bagCountEl.classList.remove("bump"); void bagCountEl.offsetWidth; bagCountEl.classList.add("bump");
    const r = e.currentTarget.getBoundingClientRect();
    mist.burst(r.left + r.width / 2, r.top + r.height / 2, 50);
    toast(`${PRODUCTS[selected].name} added — reserved, not charged.`);
  });

  /* ---------------- Positioning chart ---------------- */
  const chart = $("[data-chart]");
  const tip = $("[data-chart-tip]");
  const showTip = (dot) => {
    tip.innerHTML = `<b>${dot.textContent}</b>${dot.dataset.tip}`;
    tip.classList.add("is-visible");
    $$(".dot", chart).forEach((d) => d.classList.toggle("is-hot", d === dot));
  };
  const hideTip = () => { tip.classList.remove("is-visible"); $$(".dot", chart).forEach((d) => d.classList.remove("is-hot")); };
  $$(".dot", chart).forEach((d) => {
    d.addEventListener("pointerenter", () => showTip(d));
    d.addEventListener("focus", () => showTip(d));
    d.addEventListener("click", () => showTip(d));
    d.addEventListener("blur", hideTip);
  });
  chart.addEventListener("pointerleave", hideTip);
  $$("[data-chart-filter]").forEach((b) => b.addEventListener("click", () => {
    const f = b.dataset.chartFilter;
    $$("[data-chart-filter]").forEach((x) => x.classList.toggle("is-active", x === b));
    $$(".dot", chart).forEach((d) => {
      const r = d.dataset.region;
      d.classList.toggle("is-dim", f !== "all" && r !== f && r !== "pola");
    });
  }));

  /* ---------------- Market calculator ---------------- */
  const calc = $("[data-calc]");
  const inputs = {};
  $$("[data-calc-in]", calc).forEach((i) => (inputs[i.dataset.calcIn] = i));
  const out = $("[data-calc-out]", calc);
  const formula = $("[data-calc-formula]", calc);
  const label = (k) => $(`[data-calc-label="${k}"]`, calc);
  let shown = 135;

  const setFill = (inp) => {
    const p = ((inp.value - inp.min) / (inp.max - inp.min)) * 100;
    inp.style.setProperty("--fill", p + "%");
  };
  const updateCalc = () => {
    const share = parseFloat(inputs.share.value);
    const members = parseFloat(inputs.members.value);
    const bottles = parseInt(inputs.bottles.value, 10);
    const price = parseInt(inputs.price.value, 10);
    const cr = (share / 100) * members * 1e6 * bottles * price / 1e7;
    label("share").textContent = share + "%";
    label("members").textContent = members.toFixed(1) + "M";
    label("bottles").textContent = bottles;
    label("price").textContent = fmtINR(price);
    formula.textContent = `${share}% × ${members.toFixed(1)}M × ${bottles} bottle${bottles > 1 ? "s" : ""}/yr × ${fmtINR(price)}`;
    Object.values(inputs).forEach(setFill);
    const from = shown, to = cr, t0 = performance.now();
    cancelAnimationFrame(out._raf);
    const step = (now) => {
      const p = reduceMotion ? 1 : clamp((now - t0) / 450, 0, 1);
      shown = from + (to - from) * (1 - Math.pow(1 - p, 3));
      out.textContent = Math.round(shown).toLocaleString("en-IN");
      if (p < 1) out._raf = requestAnimationFrame(step);
    };
    step(performance.now());
  };
  Object.values(inputs).forEach((i) => i.addEventListener("input", updateCalc));
  $$("[data-calc-preset]", calc).forEach((b) => b.addEventListener("click", () => {
    inputs.share.value = 5; inputs.bottles.value = 4; inputs.price.value = 549;
    inputs.members.value = b.dataset.calcPreset === "2030" ? 23.3 : 12.3;
    $$("[data-calc-preset]", calc).forEach((x) => x.classList.toggle("is-active", x === b));
    updateCalc();
  }));
  Object.values(inputs).forEach(setFill);

  /* ---------------- Waitlist ---------------- */
  const form = $("[data-waitlist]");
  const msg = $("[data-form-msg]");
  const WL_KEY = "pola-waitlist-v1";
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.elements.name;
    const email = form.elements.email;
    let ok = true;
    [name, email].forEach((f) => f.classList.remove("is-invalid"));
    if (!name.value.trim()) { name.classList.add("is-invalid"); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { email.classList.add("is-invalid"); ok = false; }
    if (!ok) { msg.textContent = "Add your name and a valid email."; (name.classList.contains("is-invalid") ? name : email).focus(); return; }
    const entry = {
      name: name.value.trim(), email: email.value.trim(),
      bottle: form.elements.bottle.value, persona: form.elements.persona.value, city: form.elements.city.value,
      bag, at: new Date().toISOString(),
    };
    try {
      const list = JSON.parse(localStorage.getItem(WL_KEY) || "[]");
      list.push(entry);
      localStorage.setItem(WL_KEY, JSON.stringify(list));
    } catch (_) {}
    const first = entry.name.split(" ")[0];
    msg.textContent = `You're on the list, ${first}. ${entry.bottle} noted for ${entry.city}.`;
    const btn = form.querySelector('[type="submit"]');
    btn.textContent = "On the list ✓";
    btn.disabled = true;
    const r = btn.getBoundingClientRect();
    mist.burst(r.left + r.width / 2, r.top, 120);
    toast("Waitlist joined. We'll be in touch for the gym-bag audit.");
  });

  /* ---------------- Boot ---------------- */
  initSmooth();
  renderBag();
  selectProduct("orb", false);
  initReveal();
  initPointerFX();
  onScroll();
  window.addEventListener("load", () => { initGsapScenes(); if (window.ScrollTrigger) ScrollTrigger.refresh(); });
  runPreloader();
})();

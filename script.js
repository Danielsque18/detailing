(function () {
  "use strict";

  /* ===== Настройки формы =====
     "demo"     — заявка никуда не уходит (для показа)
     "telegram" — открывается чат с владельцем с готовым текстом заявки */
  var FORM = { mode: "demo", telegram: "assalameu", brand: "Lucido" };

  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var G = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  var motion = !!(G && ST) && !reduce;

  function $(s, ctx) { return (ctx || document).querySelector(s); }
  function $$(s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); }

  // номер карточки нужен для смещения в стопке
  $$(".svc").forEach(function (s, i) {
    s.style.setProperty("--i", i);
    var d = document.createElement("span"); d.className = "svc__dim"; s.appendChild(d);
  });

  /* =========================================================
     Стоимость: переключатель кузова
     ========================================================= */
  var seg = $(".seg");
  var pill = $(".seg__pill");
  var prices = $$(".plan__price");
  function fmt(n) { return "от " + n.toLocaleString("ru-RU") + " ₽"; }
  function placePill() {
    var checked = $("input:checked", seg);
    if (!checked) return;
    var span = checked.nextElementSibling;
    pill.style.width = span.offsetWidth + "px";
    pill.style.transform = "translateX(" + span.offsetLeft + "px)";
  }
  function setPrices(mult, animate) {
    prices.forEach(function (p) {
      var to = Math.round(Number(p.dataset.base) * mult / 500) * 500;
      var from = Number(p.dataset.now || p.dataset.base);
      p.dataset.now = to;
      if (!animate || !G) { p.textContent = fmt(to); return; }
      var o = { v: from };
      G.to(o, { v: to, duration: .7, ease: "power3.out", onUpdate: function () { p.textContent = fmt(Math.round(o.v / 100) * 100); } });
    });
  }
  seg.addEventListener("change", function (e) { placePill(); setPrices(Number(e.target.value), !reduce); });
  window.addEventListener("resize", placePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
  placePill();

  /* =========================================================
     Форма записи
     ========================================================= */
  var form = $("#bookingForm");
  var note = $("#formNote");
  $$("[data-pick]").forEach(function (b) {
    b.addEventListener("click", function () {
      var r = $('input[name="plan"][value="' + b.dataset.pick + '"]', form);
      if (r) r.checked = true;
    });
  });
  function bodyName() {
    var c = $('input[name="body"]:checked');
    return c ? c.nextElementSibling.textContent.toLowerCase() : "";
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var car = form.elements.car, name = form.elements.name, phone = form.elements.phone;
    var ok = true;
    [car, name, phone].forEach(function (i) {
      var empty = i.value.trim() === "";
      i.classList.toggle("is-error", empty);
      if (empty) ok = false;
    });
    if (!ok) { note.textContent = "Заполните автомобиль, имя и телефон."; return; }
    var plan = $('input[name="plan"]:checked', form);
    var text = "Здравствуйте! Хочу записаться на осмотр в " + FORM.brand + ".\n" +
      "Автомобиль: " + car.value.trim() + " (" + bodyName() + ")\n" +
      "Интересует: " + (plan ? plan.value : "") + "\n" +
      "Имя: " + name.value.trim() + "\nТелефон: " + phone.value.trim();
    if (FORM.mode === "telegram" && FORM.telegram) {
      window.open("https://t.me/" + FORM.telegram + "?text=" + encodeURIComponent(text), "_blank", "noopener");
      note.textContent = "Открылся Telegram. Нажмите «Отправить», и мы подтвердим время.";
    } else {
      note.textContent = name.value.trim() + ", заявка принята. Перезвоним в течение часа.";
    }
    form.reset();
  });

  /* =========================================================
     Свет: лампа осмотра
     ========================================================= */
  var lamp = $("#lamp");
  var hint = $("#lampHint");
  if (!fine) hint.textContent = "Ведите пальцем по крылу. Это наш свет.";
  var lx = 50, ly = 45, tx = 50, ty = 45, hovering = false, lampVisible = false, lampRaf = 0, t0 = performance.now();
  function lampLoop(now) {
    if (!hovering && !reduce) {
      // свет сам медленно ходит по крылу, пока посетитель его не взял
      var t = (now - t0) / 1000;
      tx = 50 + Math.cos(t * .45) * 28;
      ty = 46 + Math.sin(t * .9) * 16;
    }
    lx += (tx - lx) * .09;
    ly += (ty - ly) * .09;
    lamp.style.setProperty("--x", lx.toFixed(2) + "%");
    lamp.style.setProperty("--y", ly.toFixed(2) + "%");
    lampRaf = lampVisible ? requestAnimationFrame(lampLoop) : 0;
  }
  function lampMove(e) {
    var r = lamp.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width * 100;
    ty = (e.clientY - r.top) / r.height * 100;
  }
  lamp.addEventListener("pointerenter", function (e) { hovering = true; lampMove(e); });
  lamp.addEventListener("pointermove", function (e) { hovering = true; lampMove(e); });
  lamp.addEventListener("pointerleave", function () { hovering = false; t0 = performance.now() - 2000; });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) {
      lampVisible = en[0].isIntersecting;
      if (lampVisible && !lampRaf) lampRaf = requestAnimationFrame(lampLoop);
    }).observe(lamp);
  } else {
    lampVisible = true; requestAnimationFrame(lampLoop);
  }

  /* =========================================================
     Без анимаций дальше не идём
     ========================================================= */
  if (!motion) {
    var l = $("#loader"); if (l) l.remove();
    return;
  }
  root.classList.add("has-motion");
  G.registerPlugin(ST);
  if (Split) G.registerPlugin(Split);

  /* ---------- Плавная прокрутка ---------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: .085, wheelMultiplier: .95 });
    lenis.on("scroll", ST.update);
    G.ticker.add(function (t) { lenis.raf(t * 1000); });
    G.ticker.lagSmoothing(0);
  }
  $$("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
      else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY, behavior: "smooth" });
    });
  });

  /* ---------- Шапка прячется при прокрутке вниз ---------- */
  var nav = $("#nav"), lastY = 0;
  function onScrollNav(y) {
    if (Math.abs(y - lastY) < 6) return;
    nav.classList.toggle("is-hidden", y > lastY && y > innerHeight * .5);
    lastY = y;
  }
  if (lenis) lenis.on("scroll", function (e) { onScrollNav(e.scroll); });
  else window.addEventListener("scroll", function () { onScrollNav(scrollY); }, { passive: true });

  /* ---------- Магнитные кнопки ---------- */
  if (fine) {
    $$("[data-magnetic]").forEach(function (b) {
      var qx = G.quickTo(b, "x", { duration: .6, ease: "power3.out" });
      var qy = G.quickTo(b, "y", { duration: .6, ease: "power3.out" });
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * .3);
        qy((e.clientY - r.top - r.height / 2) * .4);
      });
      b.addEventListener("pointerleave", function () { qx(0); qy(0); });
    });
  }

  /* ---------- Всё, что зависит от шрифтов, запускаем после их загрузки ---------- */
  var fontsReady = document.fonts && document.fonts.ready
    ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1500); })])
    : Promise.resolve();

  fontsReady.then(function () {
    var heroChars = splitChars($(".hero__word"));
    intro(heroChars);
    scenes();
    ST.refresh();
  });

  function splitChars(el) {
    if (Split) return new Split(el, { type: "chars", charsClass: "char" }).chars;
    var text = el.textContent; el.textContent = "";
    return Array.prototype.map.call(text, function (c) {
      var s = document.createElement("span"); s.className = "char"; s.textContent = c; el.appendChild(s); return s;
    });
  }

  /* ---------- Заставка и вход ---------- */
  function intro(heroChars) {
    var loader = $("#loader");
    var seen = false;
    try { seen = !!sessionStorage.getItem("lucido-seen"); sessionStorage.setItem("lucido-seen", "1"); } catch (e) {}

    if (lenis) lenis.stop();
    var tl = G.timeline({ defaults: { ease: "expo.out" }, onComplete: function () { if (lenis) lenis.start(); loader.remove(); } });
    G.set(heroChars, { yPercent: 115 });
    G.set(".hero__img", { scale: 1.32 });
    G.set([".hero__kicker", ".hero__aside"], { autoAlpha: 0, y: 24 });

    if (!seen) {
      var lw = $("#loaderWord");
      var lChars = splitChars(lw);
      lw.style.overflow = "hidden";
      G.set(lChars, { yPercent: 110, display: "inline-block" });
      tl.to(lChars, { yPercent: 0, duration: 1.1, stagger: .06 })
        .to("#loaderLine", { scaleX: 1, duration: 1.3, ease: "power2.inOut" }, "<.1")
        .to(lChars, { yPercent: -110, duration: .8, stagger: .04, ease: "expo.in" }, "+=.15")
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1.1, ease: "expo.inOut" }, "-=.35");
    } else {
      tl.to(loader, { autoAlpha: 0, duration: .5, ease: "power2.out" });
    }
    tl.to(".hero__img", { scale: 1.08, duration: 2.4, ease: "expo.out" }, seen ? 0 : "-=.75")
      .to(heroChars, { yPercent: 0, duration: 1.5, stagger: .07 }, "<.15")
      .to([".hero__kicker", ".hero__aside"], { autoAlpha: 1, y: 0, duration: 1.2, stagger: .12 }, "<.5");
  }

  /* ---------- Сцены прокрутки ---------- */
  function scenes() {
    var mm = G.matchMedia();

    // первый экран: фото уходит медленнее страницы, слово поднимается
    G.to(".hero__img", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    G.to(".hero__word", { yPercent: -40, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // заголовки разделов проявляются построчно
    $$(".title").forEach(function (t) {
      if (!Split) return;
      var s = new Split(t, { type: "lines", linesClass: "line-in" });
      s.lines.forEach(function (l) {
        var w = document.createElement("div"); w.className = "line-mask";
        l.parentNode.insertBefore(w, l); w.appendChild(l);
      });
      G.from(s.lines, { yPercent: 108, duration: 1.3, ease: "expo.out", stagger: .09, scrollTrigger: { trigger: t, start: "top 86%" } });
    });

    // манифест: слова загораются по мере прокрутки
    var man = $("#manifest");
    if (Split) {
      var ms = new Split(man, { type: "words", wordsClass: "word" });
      G.to(ms.words, { opacity: 1, ease: "none", stagger: .1, scrollTrigger: { trigger: man, start: "top 78%", end: "bottom 42%", scrub: true } });
    }

    // цифры
    G.from(".figures li", { y: 40, autoAlpha: 0, duration: 1.1, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".figures", start: "top 85%" } });

    // параллакс и раскрытие фото
    $$("[data-parallax]").forEach(function (f) {
      G.to(f, { yPercent: Number(f.dataset.parallax), ease: "none", scrollTrigger: { trigger: f, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".editorial .mask, .process__wide .mask").forEach(function (m) {
      G.fromTo(m, { clipPath: "inset(18% 12% 18% 12% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: m, start: "top 92%", end: "top 35%", scrub: true } });
      G.fromTo(m.querySelector("img"), { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // услуги: карточки складываются стопкой
    mm.add("(min-width: 900px)", function () {
      var cards = $$(".svc");
      cards.forEach(function (c, i) {
        if (i === cards.length - 1) return;
        var st = { trigger: cards[i + 1], start: "top bottom", end: "top " + (96 + (i + 1) * 16) + "px", scrub: true };
        G.to(c, { scale: .92 + i * .015, ease: "none", scrollTrigger: st });
        G.to(c.querySelector(".svc__dim"), { opacity: .6, ease: "none", scrollTrigger: st });
      });
      cards.forEach(function (c) {
        G.fromTo(c.querySelector(".svc__img img"), { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "top 100px", scrub: true } });
      });
    });

    // галерея: горизонтальная прокрутка, закреплённая на экране
    mm.add("(min-width: 900px)", function () {
      var track = $("#galleryTrack");
      var dist = function () { return Math.max(track.scrollWidth - innerWidth, 0); };
      var tween = G.to(track, {
        x: function () { return -dist(); }, ease: "none",
        scrollTrigger: { trigger: "#galleryPin", start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      $$(".shot .mask img").forEach(function (img) {
        G.fromTo(img, { xPercent: -8, scale: 1.18 }, { xPercent: 8, ease: "none", scrollTrigger: { trigger: img.closest(".shot"), containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
      });
    });

    // процесс: линия прорисовывается, этапы появляются по очереди
    var steps = $$(".tstep");
    mm.add("(min-width: 900px)", function () {
      var tl = G.timeline({ scrollTrigger: { trigger: ".timeline", start: "top 78%", end: "bottom 55%", scrub: .6 } });
      tl.to("#rail", { scaleX: 1, ease: "none", duration: 1 }, 0);
      steps.forEach(function (s, i) { tl.from(s, { y: 46, autoAlpha: 0, ease: "power2.out", duration: .3 }, i * .17); });
    });
    mm.add("(max-width: 899px)", function () {
      steps.forEach(function (s) { G.from(s, { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 88%" } }); });
    });

    // пакеты и запись
    G.from(".plan", { y: 60, autoAlpha: 0, duration: 1.2, ease: "expo.out", stagger: .12, scrollTrigger: { trigger: ".plans", start: "top 82%" } });
    G.fromTo(".booking__img img", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".booking", start: "top bottom", end: "bottom bottom", scrub: true } });
    G.from(".footer__word", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom bottom", scrub: true } });

    window.addEventListener("load", function () { ST.refresh(); });
  }
})();

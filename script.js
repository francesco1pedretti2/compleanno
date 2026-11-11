const people = {
  francesco: {
    name: "Francesco",
    intro: "Un pensiero mio per il tuo compleanno.",
    photo: "",
    letter: "Cara nonna, mi manca passare intere giornate da te, come facevamo da piccoli: andare in piscina, andare all'orto, prendere piccoli pulcini e coniglietti, giocare a casa tua con i legnetti, aspettare che finisse di piovere per poter stare fuori a scoppiare le bolle di sapone, tu che insisti per darci il gelato, andare nei boschi e i viaggi in Calabria, con tante figure, urla, litigate, bagni al mare, esaurimenti, caldo insopportabile e avventure mistiche. Ora, purtroppo, le cose sono cambiate: sono cresciuto, gli impegni sono aumentati e la scuola mi stanca. Detto questo Ti voglio tanto bene, Ti auguro tutto il bene del mondo e mi piacerebbe passare pi\u00f9 tempo con te.",
    sign: "Francesco"
  }
};

const modal = document.getElementById("personModal");
const modalName = document.getElementById("modalName");
const modalIntro = document.getElementById("modalIntro");
const modalLetter = document.getElementById("modalLetter");
const modalSign = document.getElementById("modalSign");
const modalPhotoText = document.getElementById("modalPhotoText");
const modalPhoto = document.querySelector(".modal-photo");
const modalLayout = document.querySelector(".modal-layout");
let previousFocus = null;
let photoFlight = null;

function preparePhotoFlight(source) {
  if (REDUCE || !source) return null;
  const photo = source.querySelector(".person-photo");
  if (!photo) return null;
  const rect = photo.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const clone = photo.cloneNode(true);
  const previousVisibility = photo.style.visibility;
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");
  clone.setAttribute("tabindex", "-1");
  clone.style.cssText += `;position:fixed;z-index:110;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0;transform:translate3d(0,0,0);transform-origin:top left;transition:none;pointer-events:none;overflow:hidden;will-change:transform,opacity;`;
  photo.style.visibility = "hidden";
  modalPhoto.classList.remove("photo-arrived");
  modalPhoto.classList.add("photo-arriving");
  document.body.append(clone);
  photoFlight = { clone, photo, previousVisibility, sourceRect: rect, animation: null, frame: 0, revealTimer: 0 };
  return photoFlight;
}

function finishPhotoFlight(arrived = false) {
  if (!photoFlight) return;
  const flight = photoFlight;
  photoFlight = null;
  if (flight.frame) cancelAnimationFrame(flight.frame);
  if (flight.revealTimer) clearTimeout(flight.revealTimer);
  if (flight.animation && flight.animation.playState !== "finished") flight.animation.cancel();
  flight.clone.remove();
  flight.photo.style.visibility = flight.previousVisibility;
  modalPhoto.classList.remove("photo-arriving");
  modalPhoto.classList.toggle("photo-arrived", arrived);
}

function animatePhotoFlight(flight) {
  if (photoFlight !== flight || !modal.classList.contains("is-open")) return;
  const target = modalPhoto.getBoundingClientRect();
  const source = flight.sourceRect;
  if (!target.width || !target.height) {
    finishPhotoFlight();
    return;
  }
  const dx = target.left - source.left;
  const dy = target.top - source.top;
  const scaleX = target.width / source.width;
  const scaleY = target.height / source.height;
  const arc = Math.min(70, Math.abs(dy) * .16 + 24);
  flight.animation = flight.clone.animate([
    { offset: 0, transform: "translate3d(0,0,0) scale(1,1)" },
    { offset: .52, transform: `translate3d(${dx * .52}px,${dy * .52 - arc}px,0) scale(${1 + (scaleX - 1) * .52},${1 + (scaleY - 1) * .52})` },
    { offset: 1, transform: `translate3d(${dx}px,${dy}px,0) scale(${scaleX},${scaleY})` }
  ], { duration: 1450, easing: "cubic-bezier(.22,.75,.22,1)", fill: "forwards" });
  flight.animation.onfinish = () => finishPhotoFlight(true);
  flight.revealTimer = setTimeout(() => {
    if (photoFlight !== flight) return;
    modalPhoto.classList.add("photo-arrived");
    flight.clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 290, easing: "ease-out", fill: "forwards" });
  }, 1450 * .8);
}

function openPerson(key, source) {
  const person = people[key] || people.francesco;
  previousFocus = document.activeElement;
  const hasPhoto = typeof person.photo === "string" && person.photo.includes("<img");
  const flight = hasPhoto ? preparePhotoFlight(source) : null;
  pauseEmbers();
  inkSet(modalName, person.name, 1550, true);
  inkSet(modalIntro, person.intro, 2200, true);
  inkSet(modalLetter, person.letter, 2700, true);
  const signDelay = 2700 + (modalLetter._t || 0) + 180;
  inkSet(modalSign, person.sign, signDelay, true);
  modalPhotoText.innerHTML = person.photo || "";
  modalPhoto.classList.toggle("has-photo", hasPhoto);
  modalLayout.classList.toggle("without-photo", !hasPhoto);
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("modalClose").focus();
  if (flight) flight.frame = requestAnimationFrame(() => {
    flight.frame = requestAnimationFrame(() => animatePhotoFlight(flight));
  });
}
function closePerson() {
  finishPhotoFlight();
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  startEmbers();
  if (previousFocus) previousFocus.focus();
}

document.querySelectorAll("[data-person]").forEach((button) => {
  button.addEventListener("click", () => openPerson(button.dataset.person, button));
});
document.getElementById("modalClose").addEventListener("click", closePerson);
modal.addEventListener("click", (event) => {
  if (event.target.dataset.close === "true") closePerson();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && photoZoom.classList.contains("is-open")) closePhotoZoom();
  else if (event.key === "Escape" && modal.classList.contains("is-open")) closePerson();
});

const mosaicPhotoButton = document.getElementById("mosaicZoomOpen");
const mosaicPhoto = mosaicPhotoButton.querySelector(".mosaic-photo");
const photoZoom = document.getElementById("photoZoom");
const photoZoomImage = document.getElementById("photoZoomImage");
const photoZoomStage = document.getElementById("photoZoomStage");
const photoZoomReset = document.getElementById("photoZoomReset");
let photoZoomPreviousFocus = null;
let photoZoomScale = 1;
let photoZoomX = 0;
let photoZoomY = 0;
let photoZoomDrag = null;

function renderPhotoZoom() {
  photoZoomImage.style.transform = `translate3d(${photoZoomX}px,${photoZoomY}px,0) scale(${photoZoomScale})`;
  photoZoomReset.textContent = `${Math.round(photoZoomScale * 100)}%`;
}

function setPhotoZoom(scale, point) {
  const nextScale = Math.min(5, Math.max(1, scale));
  if (point) {
    const rect = photoZoomStage.getBoundingClientRect();
    const x = point.x - rect.left - rect.width / 2;
    const y = point.y - rect.top - rect.height / 2;
    const factor = nextScale / photoZoomScale;
    photoZoomX = x - (x - photoZoomX) * factor;
    photoZoomY = y - (y - photoZoomY) * factor;
  } else if (nextScale === 1) {
    photoZoomX = 0;
    photoZoomY = 0;
  } else {
    const factor = nextScale / photoZoomScale;
    photoZoomX *= factor;
    photoZoomY *= factor;
  }
  photoZoomScale = nextScale;
  if (photoZoomScale === 1) {
    photoZoomX = 0;
    photoZoomY = 0;
  }
  renderPhotoZoom();
}

function openPhotoZoom() {
  if (!mosaicPhoto.complete || !mosaicPhoto.naturalWidth) return;
  photoZoomPreviousFocus = document.activeElement;
  photoZoomImage.src = mosaicPhoto.currentSrc || mosaicPhoto.src;
  photoZoomImage.alt = mosaicPhoto.alt;
  setPhotoZoom(1);
  photoZoom.classList.add("is-open");
  photoZoom.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  document.getElementById("photoZoomClose").focus();
}

function closePhotoZoom() {
  photoZoom.classList.remove("is-open");
  photoZoom.setAttribute("aria-hidden", "true");
  document.body.style.overflow = modal.classList.contains("is-open") ? "hidden" : "";
  if (photoZoomPreviousFocus) photoZoomPreviousFocus.focus();
}

function updateMosaicPhotoAvailability() {
  const available = mosaicPhoto.complete && mosaicPhoto.naturalWidth > 0;
  mosaicPhotoButton.classList.toggle("is-empty", !available);
  mosaicPhotoButton.disabled = !available;
}
mosaicPhoto.addEventListener("load", updateMosaicPhotoAvailability);
mosaicPhoto.addEventListener("error", updateMosaicPhotoAvailability);
updateMosaicPhotoAvailability();
mosaicPhotoButton.addEventListener("click", openPhotoZoom);
document.getElementById("photoZoomClose").addEventListener("click", closePhotoZoom);
photoZoom.addEventListener("click", (event) => {
  if (event.target.dataset.zoomClose === "true") closePhotoZoom();
});
photoZoom.addEventListener("click", (event) => {
  const button = event.target.closest("[data-zoom-step]");
  if (button) setPhotoZoom(photoZoomScale * (button.dataset.zoomStep === "1" ? 1.5 : 1 / 1.5));
});
photoZoomReset.addEventListener("click", () => setPhotoZoom(1));
photoZoomStage.addEventListener("wheel", (event) => {
  event.preventDefault();
  setPhotoZoom(photoZoomScale * Math.exp(-event.deltaY * .001), { x: event.clientX, y: event.clientY });
}, { passive: false });
photoZoomStage.addEventListener("dblclick", (event) => {
  setPhotoZoom(photoZoomScale === 1 ? 2 : 1, { x: event.clientX, y: event.clientY });
});
photoZoomStage.addEventListener("pointerdown", (event) => {
  if (photoZoomScale === 1 || event.button !== 0) return;
  photoZoomDrag = { x: event.clientX, y: event.clientY, offsetX: photoZoomX, offsetY: photoZoomY };
  photoZoomImage.classList.add("is-dragging");
  photoZoomStage.setPointerCapture(event.pointerId);
});
photoZoomStage.addEventListener("pointermove", (event) => {
  if (!photoZoomDrag) return;
  photoZoomX = photoZoomDrag.offsetX + event.clientX - photoZoomDrag.x;
  photoZoomY = photoZoomDrag.offsetY + event.clientY - photoZoomDrag.y;
  renderPhotoZoom();
});
const finishPhotoZoomDrag = () => {
  photoZoomDrag = null;
  photoZoomImage.classList.remove("is-dragging");
};
photoZoomStage.addEventListener("pointerup", finishPhotoZoomDrag);
photoZoomStage.addEventListener("pointercancel", finishPhotoZoomDrag);

// Reveal gli elementi quando entrano nella schermata.
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = [...entry.target.parentElement.children];
      const index = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${Math.min(index * 75, 420)}ms`;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

// ===== Inchiostro, carta bruciata, particelle =====
const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
let magic = false;
const LITE = /lite/.test(location.search);
const ready = Promise.all([new Promise(r => setTimeout(r, REDUCE ? 0 : 2100)), document.fonts ? document.fonts.ready : 0]);
function split(el) {
  const walk = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) return f.append(t);
        const w = document.createElement("span"); w.className = "w";
        [...t].forEach(ch => { const s = document.createElement("span"); s.className = "ch"; s.textContent = ch; w.append(s); });
        f.append(w);
      });
      c.replaceWith(f);
    } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
  });
  el.setAttribute("aria-label", el.textContent);
  walk(el);
  const chars = el.querySelectorAll(".ch");
  if (chars.length > 60) {
    const ws = el.querySelectorAll(".w");
    ws.forEach((w, i) => w.style.setProperty("--wi", i));
    el._t = ws.length * 40 + 800; el.classList.add("long");
  } else {
    chars.forEach((c, i) => c.style.setProperty("--i", i));
    el._t = chars.length * 65 + 900;
  }
  el.classList.add("ink");
}
async function write(el, waitForReady = true) {
  if (waitForReady) await ready;
  await new Promise(r => setTimeout(r, +el.dataset.d || 150));
  el.classList.add("writing");
  setTimeout(() => {
    el.classList.add("dry");
    if (el.id === "typewriterText") { const r = el.getBoundingClientRect(); celebrate(r.left + r.width / 2, r.top + r.height / 2); }
  }, el._t);
}
function inkSet(el, text, d, immediate = false) {
  el.classList.remove("writing", "dry", "ink", "long"); el.textContent = text; el.dataset.d = d;
  if (REDUCE) return; split(el); write(el, !immediate);
}
const dedEl = document.getElementById("typewriterText");
dedEl.dataset.t = dedEl.textContent;
document.getElementById("replayButton").addEventListener("click", () => inkSet(dedEl, dedEl.dataset.t, 100));

if (!REDUCE) {
  const seq = new Map();
  const inkObs = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    inkObs.unobserve(e.target);
    const s = e.target.closest(".hero"), k = seq.get(s) || 0;
    if (s) { seq.set(s, k + 1); e.target.dataset.d = k * 700; }
    write(e.target);
  }), { threshold: .3 });
  document.querySelectorAll("h1,h2,.section-kicker,.hero-subtitle,.intro-text,.quote-inner p,.quote-signature,.side-note,.mosaic-heading>p:last-child,.finale-content>p,.notes h3,.notes p,.dedication-note").forEach(el => {
    if (el.closest(".modal")) return;
    split(el); inkObs.observe(el);
  });
  // le carte ritrovano il loro posto dopo l'entrata
  document.querySelectorAll(".reveal").forEach(el => new MutationObserver((m, o) => {
    if (el.classList.contains("is-visible")) { o.disconnect(); setTimeout(() => { el.classList.remove("reveal", "is-visible"); el.style.transitionDelay = ""; }, 1800); }
  }).observe(el, { attributes: true, attributeFilter: ["class"] }));
}
// Burn intro
const burnEl = document.getElementById("introBurn");
if (REDUCE || LITE) burnEl.remove(); else setTimeout(() => burnEl.remove(), 2500);

// Braci e polvere dorata (sprite pre-renderizzato, niente shadowBlur)
const cv = document.getElementById("embers"), cx = cv.getContext("2d");
const spr = document.createElement("canvas"); spr.width = spr.height = 24;
{ const c = spr.getContext("2d"), g = c.createRadialGradient(12, 12, 0, 12, 12, 12);
  g.addColorStop(0, "#ffe9a8"); g.addColorStop(.35, "#ffb347cc"); g.addColorStop(1, "#ffb34700");
  c.fillStyle = g; c.fillRect(0, 0, 24, 24); }
let P = [];
function size() { cv.width = innerWidth >> 1; cv.height = innerHeight >> 1; cx.setTransform(.5, 0, 0, .5, 0, 0); }
addEventListener("resize", size); size();
function spawn(x, y, b) {
  const a = Math.random() * 6.28, s = b ? 1 + Math.random() * 4 : .3 + Math.random() * .6;
  P.push({ x, y, vx: b ? Math.cos(a) * s : (Math.random() - .5) * .4, vy: b ? Math.sin(a) * s - 1 : -s, r: 1 + Math.random() * 2, l: b ? 70 + Math.random() * 70 : 300 + Math.random() * 300 });
}
let particleLimit = 16;
function burst(x, y, n) { if (!REDUCE) for (let i = 0; i < Math.min(n, particleLimit); i++) spawn(x, y, true); }
function celebrate(x, y) {
  if (REDUCE) return;
  const sparkCount = Math.max(12, Math.min(20, particleLimit + 4));
  const colors = ["#b72e3d", "#d34b50", "#e7b45d"];
  const centers = [
    { x: Math.max(28, x - 62), y: Math.max(48, y - 24) },
    { x: Math.min(innerWidth - 28, x + 62), y: Math.max(48, y - 68) }
  ];
  centers.forEach((center, burstIndex) => {
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + burstIndex * .16;
      const speed = 1.2 + Math.random() * 2.3;
      const life = 48 + Math.random() * 24;
      P.push({
        kind: "firework",
        x: center.x,
        y: center.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 1.4,
        color: colors[(i + burstIndex) % colors.length],
        l: life,
        maxL: life
      });
    }
  });
  for (let i = 0; i < 9; i++) {
    const life = 95 + Math.random() * 45;
    P.push({
      kind: "heart",
      x: x + (Math.random() - .5) * 112,
      y: y + 12 + Math.random() * 20,
      vx: (Math.random() - .5) * 1.5,
      vy: -1.5 - Math.random() * 1.5,
      size: 7 + Math.random() * 6,
      rotation: (Math.random() - .5) * .8,
      spin: (Math.random() - .5) * .025,
      color: colors[Math.floor(Math.random() * 2)],
      l: life,
      maxL: life
    });
  }
}
let last = 0, frames = 0, frameTime = 0, emberRaf = 0;
function tick(t) {
  emberRaf = 0;
  if (document.hidden || modal.classList.contains("is-open")) return;
  const raw = t - last, dt = Math.min(2.5, raw / 16.67 || 1); last = t;
  frameTime += raw;
  if (++frames >= 90) {
    const fps = frames * 1000 / frameTime;
    particleLimit = fps < 50 ? 8 : fps > 57 ? 16 : particleLimit;
    frames = 0;
    frameTime = 0;
  }
  cx.clearRect(0, 0, innerWidth, innerHeight);
  if (P.length < Math.min(magic ? 40 : 16, particleLimit) && Math.random() < .3 * dt) spawn(Math.random() * innerWidth, innerHeight + 10);
  for (let i = P.length - 1; i >= 0; i--) {
    const p = P[i];
    p.l -= dt;
    if (p.l <= 0) { P.splice(i, 1); continue; }
    const previousX = p.x, previousY = p.y;
    p.x += (p.vx + (p.kind ? 0 : Math.sin(p.l / 30) * .2)) * dt;
    p.y += p.vy * dt;
    if (p.kind === "firework") {
      p.vx *= Math.pow(.986, dt);
      p.vy += .035 * dt;
    } else if (p.kind === "heart") {
      p.vx *= Math.pow(.99, dt);
      p.vy += .018 * dt;
      p.rotation += p.spin * dt;
    } else if (p.vy > -.3) p.vy *= Math.pow(.985, dt);
    cx.globalAlpha = p.kind ? Math.min(1, p.l / 18) : Math.min(1, p.l / 60) * (.55 + .45 * Math.sin(p.l / 6));
    if (p.kind === "firework") {
      cx.beginPath();
      cx.moveTo(previousX, previousY);
      cx.lineTo(p.x, p.y);
      cx.strokeStyle = p.color;
      cx.lineWidth = p.r;
      cx.stroke();
    } else if (p.kind === "heart") {
      cx.save();
      cx.translate(p.x, p.y);
      cx.rotate(p.rotation);
      cx.scale(p.size / 16, p.size / 16);
      cx.beginPath();
      cx.moveTo(0, 5);
      cx.bezierCurveTo(-12, -2, -8, -9, -3, -8);
      cx.bezierCurveTo(0, -8, 0, -5, 0, -4);
      cx.bezierCurveTo(1, -8, 5, -10, 8, -7);
      cx.bezierCurveTo(13, -2, 8, 3, 0, 10);
      cx.closePath();
      cx.fillStyle = p.color;
      cx.fill();
      cx.restore();
    } else {
      const d = p.r * 6; cx.drawImage(spr, p.x - d / 2, p.y - d / 2, d, d);
    }
  }
  emberRaf = requestAnimationFrame(tick);
}
function startEmbers() {
  if (REDUCE || LITE || document.hidden || modal.classList.contains("is-open") || emberRaf) return;
  last = performance.now();
  emberRaf = requestAnimationFrame(tick);
}
function pauseEmbers() {
  if (emberRaf) cancelAnimationFrame(emberRaf);
  emberRaf = 0;
}
document.addEventListener("visibilitychange", () => document.hidden ? pauseEmbers() : startEmbers());
if (!REDUCE && !LITE) { setTimeout(() => { burst(innerWidth / 2, innerHeight * .55, 40); startEmbers(); }, 1900); } else cv.remove();

// Gocce d'inchiostro al click, parallasse e barra di scrittura
addEventListener("click", e => {
  if (REDUCE || e.target.closest(".letter-card")) return;
  for (let i = 0; i < 4; i++) {
    const d = document.createElement("i"), s = 6 + Math.random() * 16;
    d.className = "drop";
    d.style.cssText = `left:${e.clientX + (Math.random() - .5) * 50}px;top:${e.clientY + (Math.random() - .5) * 50}px;width:${s}px;height:${s}px;animation-delay:${i * 40}ms`;
    document.body.append(d); setTimeout(() => d.remove(), 1900);
  }
});
const heroArt = document.querySelector(".hero-art");
let mx = 0, my = 0, mraf = 0;
addEventListener("pointermove", e => {
  mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
  if (mraf) return;
  mraf = requestAnimationFrame(() => { mraf = 0; if (scrollY < innerHeight) { heroArt.style.setProperty("--mx", mx); heroArt.style.setProperty("--my", my); } });
}, { passive: true });
const bar = document.getElementById("inkProgress");
let sraf = 0;
addEventListener("scroll", () => {
  if (sraf) return;
  sraf = requestAnimationFrame(() => { sraf = 0; bar.style.transform = `scaleX(${scrollY / (document.documentElement.scrollHeight - innerHeight)})`; });
}, { passive: true });

// Mette in pausa le animazioni della copertina quando non si vede
const heroEl = document.querySelector(".hero");
new IntersectionObserver(([e]) => heroEl.classList.toggle("hero-off", !e.isIntersecting)).observe(heroEl);
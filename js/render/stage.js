// Stage: one WebGL canvas over a paper-and-ink backdrop. The world turns in your hand; the sky stays put.
import { THREE, ease } from './kit.js';
import { rngFor } from '../engine/codec.js';

export function createStage(host, { transparent = true } = {}) {
  host.classList.add('stage');
  const back = document.createElement('div'); back.className = 'stage-back';
  const orn = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); orn.setAttribute('class', 'stage-ornament'); orn.setAttribute('viewBox', '0 0 100 100'); orn.setAttribute('preserveAspectRatio', 'xMidYMid meet'); orn.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); canvas.className = 'stage-canvas';
  host.append(back, orn, canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, preserveDrawingBuffer: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  const pivot = new THREE.Group(); // user rotation is applied here
  scene.add(pivot);

  let current = null, dist = 6, zoom = 1, running = true, last = performance.now(), autoSpin = 0.12, idleFor = 99;
  const tweens = [];
  const vel = { x: 0, y: 0 };

  function size() {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the world plus its moons on narrow screens.
    dist = 6.2 / Math.min(1, camera.aspect * 1.25);
    placeCamera();
  }
  function placeCamera() { camera.position.set(0, 0.42 * zoom, dist * zoom); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(size); ro.observe(host);

  /* -------- input: drag to turn, pinch / wheel to zoom, tap to pick -------- */
  const ptrs = new Map();
  let drag = null, pinch = null, downAt = null;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (ptrs.size === 1) drag = { x: e.clientX, y: e.clientY };
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: zoom }; drag = null; }
    idleFor = 0;
  });
  canvas.addEventListener('pointermove', e => {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; zoom = clampZ(pinch.z * pinch.d / Math.max(20, Math.hypot(a.x - b.x, a.y - b.y))); placeCamera(); return; }
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY };
    const k = 4.2 / Math.max(300, host.clientHeight);
    vel.x = dx * k; vel.y = dy * k;
    turn(vel.x, vel.y);
    idleFor = 0;
  });
  const end = e => {
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch = null;
    if (ptrs.size === 0) {
      drag = null;
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 6 && performance.now() - downAt.t < 400) tap(e);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', e => { ptrs.delete(e.pointerId); drag = null; pinch = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom = clampZ(zoom * (1 + e.deltaY * 0.001)); placeCamera(); }, { passive: false });
  const clampZ = z => Math.min(1.5, Math.max(0.45, z));
  const qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
  function turn(ax, ay) {
    qy.setFromAxisAngle(Y, ax); qx.setFromAxisAngle(X, ay);
    pivot.quaternion.premultiply(qy).premultiply(qx);
  }

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let onPick = null;
  function tap(e) {
    if (!onPick) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pivot.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) { onPick(o.userData.pick); return; }
    }
  }

  /* -------- loop -------- */
  function frame(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    idleFor += dt;
    if (!drag) {
      vel.x *= 0.92; vel.y *= 0.92;
      if (Math.abs(vel.x) + Math.abs(vel.y) > 0.0004) turn(vel.x, vel.y);
      else if (idleFor > 2.5 && autoSpin) turn(autoSpin * dt * Math.min(1, (idleFor - 2.5) / 2), 0);
    }
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      if (tw.t < tw.delay) continue;
      const k = Math.min(1, (tw.t - tw.delay) / tw.dur);
      tw.fn(tw.ease(k));
      if (k >= 1) { tweens.splice(i, 1); tw.done(); }
    }
    current?.update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(t => { last = t; size(); frame(t); });

  /* -------- api -------- */
  return {
    host, renderer, scene, camera, pivot,
    set onPick(fn) { onPick = fn; },
    set autoSpin(v) { autoSpin = v; },
    setWorld(api, { keepRotation = false } = {}) {
      if (current) { pivot.remove(current.world); scene.remove(current.skyLayer); current.dispose?.(); }
      current = api;
      if (!api) return;
      pivot.add(api.world); scene.add(api.skyLayer);
      if (!keepRotation) { pivot.quaternion.identity(); turn(0, 0.18); }
    },
    backdrop(bg, dark, seed = 'x', ink = '#6B6386') {
      host.style.setProperty('--sky-a', bg[0]);
      host.style.setProperty('--sky-b', bg[1]);
      host.classList.toggle('is-dark', !!dark);
      drawOrnament(orn, seed, ink, dark);
    },
    tween(dur, fn, e = ease.outCubic, delay = 0) {
      return new Promise(done => tweens.push({ dur, fn, ease: e, delay, t: 0, done }));
    },
    /** Turn the world so a local direction faces the viewer. */
    focus(dir, dur = 1.2) {
      const from = pivot.quaternion.clone();
      const want = new THREE.Vector3(0, 0.25, 1).normalize();
      const to = new THREE.Quaternion().setFromUnitVectors(dir.clone().normalize(), want);
      idleFor = -dur;
      vel.x = vel.y = 0;
      return this.tween(dur, k => pivot.quaternion.slerpQuaternions(from, to, k), ease.inOut);
    },
    /** PNG of the current view at a given size (transparent background). */
    capture(w = 1024, h = 1024, { object = false } = {}) {
      const ow = renderer.domElement.width, oh = renderer.domElement.height, oa = camera.aspect, pr = renderer.getPixelRatio();
      renderer.setPixelRatio(1);
      renderer.setSize(w, h, false);
      camera.aspect = w / h; dist = (object ? 4.6 : 6.2) / Math.min(1, camera.aspect * 1.25); placeCamera();
      // As an object on a shelf: the world and what orbits it, without the sky behind.
      const hidden = object && current ? current.skyLayer.children.slice(1).filter(o => o.visible) : [];
      hidden.forEach(o => { o.visible = false; });
      renderer.render(scene, camera);
      hidden.forEach(o => { o.visible = true; });
      const url = renderer.domElement.toDataURL('image/png');
      renderer.setPixelRatio(pr);
      renderer.setSize(ow / pr, oh / pr, false);
      camera.aspect = oa; size();
      return url;
    },
    pause() { running = false; },
    resume() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    dispose() { running = false; ro.disconnect(); current?.dispose?.(); renderer.dispose(); host.replaceChildren(); }
  };
}

/* -------- hand-drawn ornament: orbit rings, dotted trails, four-point sparkles -------- */
function drawOrnament(svg, seed, ink, dark) {
  const r = rngFor(seed, 'ornament');
  const NS = 'http://www.w3.org/2000/svg';
  svg.replaceChildren();
  const add = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); svg.appendChild(n); return n; };
  const wobblyEllipse = (cx, cy, rx, ry, rot, jitter) => {
    let d = '';
    const n = 72;
    const p1 = r() * 6, p2 = r() * 6, f1 = 2 + Math.floor(r() * 3), f2 = 5 + Math.floor(r() * 4);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, j = 1 + jitter * (Math.sin(a * f1 + p1) * 0.6 + Math.sin(a * f2 + p2) * 0.4);
      const x = Math.cos(a) * rx * j, y = Math.sin(a) * ry * j;
      const xr = cx + x * Math.cos(rot) - y * Math.sin(rot), yr = cy + x * Math.sin(rot) + y * Math.cos(rot);
      d += (i ? 'L' : 'M') + xr.toFixed(2) + ' ' + yr.toFixed(2);
    }
    return d;
  };
  const accents = dark ? ['#F7E38C', '#9FE6F0', '#F4B8D0', '#C9B8FF'] : ['#F2CF5B', '#69C8D8', '#EE9DB4', '#9C8BE0'];
  const op = dark ? 0.55 : 0.5;
  add('path', { d: wobblyEllipse(50, 50, 41, 41, 0, 0.012), fill: 'none', stroke: ink, 'stroke-width': 0.22, opacity: op * 0.8 });
  add('path', { d: wobblyEllipse(50, 50, 46, 44, r() * 3, 0.02), fill: 'none', stroke: accents[Math.floor(r() * 4)], 'stroke-width': 0.35, 'stroke-dasharray': '0.1 1.6', 'stroke-linecap': 'round', opacity: op + 0.2 });
  add('path', { d: wobblyEllipse(50, 50, 48, 17, -0.35 + r() * 0.2, 0.01), fill: 'none', stroke: ink, 'stroke-width': 0.18, opacity: op * 0.6 });
  // planets-on-orbit dots, like a flash sheet
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2, rr = [41, 46, 44][i];
    add('circle', { cx: 50 + Math.cos(a) * rr, cy: 50 + Math.sin(a) * rr, r: 0.8 + r() * 1.2, fill: accents[i], opacity: 0.85 });
  }
  const sparkle = (x, y, s, color) => {
    const k = s * 0.22;
    add('path', { d: `M${x} ${y - s} Q${x + k} ${y - k} ${x + s} ${y} Q${x + k} ${y + k} ${x} ${y + s} Q${x - k} ${y + k} ${x - s} ${y} Q${x - k} ${y - k} ${x} ${y - s}Z`, fill: color, opacity: 0.9 });
  };
  for (let i = 0; i < 14; i++) {
    const a = r() * Math.PI * 2, d = 30 + r() * 24;
    const x = 50 + Math.cos(a) * d, y = 50 + Math.sin(a) * d;
    if (x < 2 || x > 98 || y < 2 || y > 98) continue;
    if (r() < 0.6) sparkle(x, y, 0.8 + r() * 1.8, accents[i % 4]);
    else add('circle', { cx: x, cy: y, r: 0.25 + r() * 0.4, fill: accents[(i + 1) % 4], opacity: 0.8 });
  }
}

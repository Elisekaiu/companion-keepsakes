// Tiny Planet renderer. Deterministic: (spec, seed) -> the same world every time.
// Every object is registered under the slot that caused it, so the reveal can build the world
// one sealed pick at a time, and the story can point at what came from whom.
import { THREE, toon, glow, mesh, group, stand, outline, mixHex, shade, noise3, fib, points, spriteTex, setInk, inkMaterial, indexed } from './kit.js';
import { rngFor } from '../engine/codec.js';
export { THREE };

const V = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
// Reserved places: the dwelling faces you from the top; the two wonders stand left (human) and right (AI);
// the secret is buried on the far side, so you have to turn the world to find it.
export const SPOTS = {
  dwelling: V(0, 0.84, 0.54),
  wonderH: V(-0.78, 0.12, 0.62),
  wonderA: V(0.78, 0.12, 0.62),
  secret: V(0.15, -0.25, -0.95)
};

const CANOPY = {
  meadow: ['#7FB77E', '#93C88A', '#A8D69A'], flowers: ['#86BF86', '#F2B6C6', '#9ECF91'], dunes: ['#A9B97F', '#C3C98E', '#8FA674'],
  snow: ['#6F9C8C', '#7FAE9C', '#FFFFFF'], crystal: ['#B9A6EE', '#D4C6FA', '#9C8BE0'], moss: ['#4E9E90', '#68C2AE', '#3E8580'],
  autumn: ['#E58E5A', '#F0B35F', '#D46E58'], cloud: ['#B9E3D3', '#F6C9DA', '#D9D0F5']
};

export function build(spec, seed) { return buildPlanet(spec, seed); }

export function buildPlanet(spec, seed) {
  const rand = rngFor(seed, 'planet');
  const N = noise3(rand);
  const pal = spec.palette;
  const P = spec.picks;
  setInk(pal.dark ? '#0A0D24' : mixHex(pal.ink, '#3A3350', 0.5));

  const world = new THREE.Group();     // turns with the user's hand
  const skyLayer = new THREE.Group();  // fixed behind the world
  const parts = {};                    // slot -> [Object3D]
  const tickers = [];
  const add = (slot, obj, parent = world) => { (parts[slot] ||= []).push(obj); parent.add(obj); return obj; };

  /* ---------------- terrain ---------------- */
  const land = P.land.id, water = P.water.id;
  const coverage = { sea: 0.42, lakes: 0.16, frozen: 0.2, springs: 0.08 }[water] || 0;
  const amp = { dunes: 0.22, cloud: 0.2, snow: 0.3, crystal: 0.34 }[land] || 0.3;
  const raw = dir => {
    let h = N(dir.x * 1.7 + 3, dir.y * 1.7, dir.z * 1.7, 4);
    if (land === 'dunes') h += 0.05 * Math.sin((dir.x * 9 + dir.z * 5) + N(dir.x * 3, dir.y * 3, dir.z * 3) * 6);
    if (land === 'cloud') h = Math.abs(h) * 0.9 + 0.03 * N(dir.x * 6, dir.y * 6, dir.z * 6);
    for (const k of ['dwelling', 'wonderH', 'wonderA', 'secret']) {
      const d = dir.dot(SPOTS[k]);
      if (d > 0.93) h = Math.max(h, 0.12 + (d - 0.93) * 0.4);
    }
    return h;
  };
  const geo = indexed(new THREE.IcosahedronGeometry(1, 28));
  const pos = geo.attributes.position;
  const dirs = [], raws = new Float32Array(pos.count);
  const tmp = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { tmp.fromBufferAttribute(pos, i).normalize(); dirs.push(tmp.clone()); raws[i] = raw(tmp); }
  const sorted = Float32Array.from(raws).sort();
  // With water, the lowest `coverage` share of the ground sits under the sea. Without it, the world stays round.
  const T = coverage ? sorted[Math.floor(sorted.length * coverage)] : sorted[Math.floor(sorted.length * 0.5)];
  const lo = sorted[0], hi = sorted[sorted.length - 1];
  const radiusOf = coverage
    ? (h => h > T ? 1.004 + amp * (h - T) : 0.97 - amp * 0.8 * (T - h))
    : (h => 1 + amp * 0.45 * (h - T));
  const surface = dir => radiusOf(raw(dir.clone().normalize()));
  const colors = new Float32Array(pos.count * 3);
  const c0 = new THREE.Color(pal.land[0]), c1 = new THREE.Color(pal.land[1]), c2 = new THREE.Color(pal.land[2]);
  const shore = new THREE.Color(mixHex(pal.land[0], '#F4E6C4', 0.55)), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const h = raws[i], r = radiusOf(h);
    pos.setXYZ(i, dirs[i].x * r, dirs[i].y * r, dirs[i].z * r);
    const e = coverage ? (h - T) / Math.max(0.001, hi - T) : (h - lo) / Math.max(0.001, hi - lo);
    if (e < 0.5) c.copy(c1).lerp(c0, e * 2); else c.copy(c0).lerp(c2, (e - 0.5) * 2);
    if (coverage && e < 0.05 && e > -0.02 && water !== 'frozen') c.lerp(shore, 0.6);
    // soft patches, so the ground reads as painted rather than flat
    const patch = N(dirs[i].x * 4.1 + 9, dirs[i].y * 4.1, dirs[i].z * 4.1, 2);
    if (patch > 0.08) c.lerp(c2, Math.min(0.45, (patch - 0.08) * 2.2)); else if (patch < -0.1) c.lerp(c1, Math.min(0.4, (-0.1 - patch) * 2));
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const landMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap });
  if (land === 'moss') { landMat.emissive = new THREE.Color(pal.glow); landMat.emissiveIntensity = spec.flags.glowLand ? 0.32 : 0.1; }
  const terrain = outline(new THREE.Mesh(geo, landMat), 0.009);
  add('land', terrain);
  // A soft atmosphere: the sky's own light, caught at the world's edge.
  const atmo = new THREE.Mesh(new THREE.SphereGeometry(1.16, 48, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
    uniforms: { c: { value: new THREE.Color(pal.dark ? pal.light : mixHex(pal.bg[1], '#ffffff', 0.4)) }, k: { value: pal.dark ? 0.45 : 0.32 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 c; uniform float k; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(1.0-abs(dot(vN,vV)),2.2); float edge=smoothstep(0.0,0.35,abs(dot(vN,vV))); gl_FragColor=vec4(c, f*edge*k); }'
  }));
  add('sky', atmo);
  // Grey stand-in used before the land is revealed.
  const greyMat = toon(pal.dark ? '#5F6488' : '#D9D3DE');
  terrain.userData.landMat = landMat; terrain.userData.greyMat = greyMat;

  // Land details that belong to the land pick.
  const landDirs = fib(1400).filter(d => raw(d) > T + 0.015 && !nearSpot(d, 0.22));
  shuffle(landDirs, rand);
  if (land === 'flowers') add('land', scatterInstanced(landDirs.slice(0, 320), surface, [
    { geo: new THREE.IcosahedronGeometry(0.014, 1), color: '#ffffff', y: 0.012, palette: pal.dots }
  ], rand, 0.9, 1.3));
  if (land === 'crystal' || land === 'snow') add('land', scatterInstanced(landDirs.slice(320, land === 'crystal' ? 360 : 345), surface, [
    { geo: new THREE.OctahedronGeometry(0.03, 0), color: land === 'crystal' ? pal.shards : '#F4F8FF', y: 0.02, sy: 2.2, ink: 0.08, opts: { flat: true, emissive: land === 'crystal' ? '#6F5BC9' : '#000', emissiveIntensity: 0.15 } }
  ], rand, 0.6, 1.5));

  /* ---------------- water ---------------- */
  if (coverage) {
    const wc = pal.water;
    const wm = toon(wc, { opacity: water === 'frozen' ? 0.96 : 0.86, emissive: spec.flags.reflect ? '#3E9C94' : (water === 'frozen' ? '#AFCFE8' : '#000'), emissiveIntensity: spec.flags.reflect ? 0.35 : (water === 'frozen' ? 0.15 : 0) });
    add('water', new THREE.Mesh(new THREE.SphereGeometry(0.988, 72, 48), wm));
    if (water === 'springs') {
      const low = fib(500).filter(d => raw(d) < T - 0.01);
      shuffle(low, rand);
      low.slice(0, 5).forEach((d, i) => {
        const steam = new THREE.Group();
        for (let k = 0; k < 4; k++) steam.add(mesh(new THREE.IcosahedronGeometry(0.025, 1), toon('#FFFFFF', { opacity: 0.7 })));
        stand(steam, d, 1.0);
        add('water', steam);
        tickers.push((t) => steam.children.forEach((s, k) => { const ph = (t * 0.35 + k / 4 + i * 0.13) % 1; s.position.set(Math.sin(ph * 6 + k) * 0.02, ph * 0.22, 0); s.scale.setScalar(0.6 + ph * 1.4); s.material.opacity = 0.75 * (1 - ph); }));
      });
    }
  } else if (water === 'river') {
    const pts = [], ph = rand() * 6;
    for (let i = 0; i < 220; i++) {
      const th = (i / 220) * Math.PI * 2, lat = 0.32 * Math.sin(2 * th + ph) + 0.12 * Math.sin(5 * th);
      const d = new THREE.Vector3(Math.cos(lat) * Math.cos(th), Math.sin(lat), Math.cos(lat) * Math.sin(th));
      pts.push(d.multiplyScalar(surface(d) + 0.006));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const bright = spec.flags.glowRiver;
    add('water', group(
      new THREE.Mesh(new THREE.TubeGeometry(curve, 440, 0.011, 6, true), glow(bright ? '#E6FBFF' : pal.water)),
      new THREE.Mesh(new THREE.TubeGeometry(curve, 220, bright ? 0.028 : 0.022, 6, true), new THREE.MeshBasicMaterial({ color: pal.water, transparent: true, opacity: bright ? 0.28 : 0.16, blending: THREE.AdditiveBlending, depthWrite: false }))
    ));
  } else if (water === 'floating') {
    landDirs.slice(400, 405).forEach((d, i) => {
      const pond = mesh(new THREE.SphereGeometry(0.075, 20, 14), toon(pal.water, { opacity: 0.88 }), { ink: 0.06, scale: [1, 0.42, 1] });
      const holder = new THREE.Group(); holder.add(pond);
      stand(holder, d, surface(d) + 0.22 + rand() * 0.12);
      add('water', holder);
      tickers.push(t => { pond.position.y = Math.sin(t * 1.2 + i) * 0.025; });
    });
  }

  /* ---------------- growth ---------------- */
  const growth = P.growth.id;
  const canopy = CANOPY[land] || CANOPY.meadow;
  const gCount = { round: 42, pines: 60, mushrooms: 14, crystaltrees: 26, lanterns: 70, puffs: 30, reeds: 90 }[growth];
  const gDirs = landDirs.slice(420, 420 + gCount);
  const trunk = '#9C7A63';
  const templates = {
    round: [{ geo: new THREE.CylinderGeometry(0.007, 0.01, 0.06, 6), color: trunk, y: 0.03 }, { geo: new THREE.IcosahedronGeometry(0.042, 1), color: canopy[0], y: 0.085, ink: 0.1, palette: canopy }],
    pines: [{ geo: new THREE.CylinderGeometry(0.006, 0.008, 0.03, 5), color: trunk, y: 0.015 }, { geo: new THREE.ConeGeometry(0.04, 0.075, 7), color: canopy[0], y: 0.06, ink: 0.1, palette: canopy.slice(0, 2) }, { geo: new THREE.ConeGeometry(0.028, 0.055, 7), color: land === 'snow' ? '#FFFFFF' : canopy[1], y: 0.1, ink: 0.1 }],
    mushrooms: [{ geo: new THREE.CylinderGeometry(0.018, 0.026, 0.12, 8), color: '#F6EBDD', y: 0.06, ink: 0.08 }, { geo: new THREE.SphereGeometry(0.075, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), color: '#EE8C96', y: 0.115, ink: 0.06, palette: ['#EE8C96', '#F3B37A', '#B79BEA', '#8EC5E8'] }],
    crystaltrees: [{ geo: new THREE.CylinderGeometry(0.005, 0.008, 0.05, 5), color: '#B5A3D8', y: 0.025 }, { geo: new THREE.OctahedronGeometry(0.045, 0), color: '#CFC2FF', y: 0.09, sy: 1.5, ink: 0.08, opts: { opacity: 0.85, flat: true, emissive: '#7A68D8', emissiveIntensity: 0.25 }, palette: ['#CFC2FF', '#BFE6FF', '#FFD6EC'] }],
    lanterns: [{ geo: new THREE.CylinderGeometry(0.003, 0.003, 0.06, 4), color: '#6E8F70', y: 0.03 }, { geo: new THREE.IcosahedronGeometry(0.016, 1), color: '#FFD98A', y: 0.065, glow: true, palette: spec.flags.glowGrowth ? ['#FFE7A3', '#FFD27A', '#FFF2C8'] : ['#F5C987', '#F4B69A', '#F6DFA0'] }],
    puffs: [{ geo: new THREE.CylinderGeometry(0.006, 0.009, 0.07, 5), color: '#C9A88E', y: 0.035 }, { geo: new THREE.IcosahedronGeometry(0.045, 2), color: '#F8C7DA', y: 0.095, ink: 0.08, palette: ['#F8C7DA', '#C6E3F7', '#FBE4B0', '#D9CCF7'] }],
    reeds: [{ geo: new THREE.ConeGeometry(0.008, 0.09, 4), color: canopy[1], y: 0.045, palette: canopy }]
  };
  add('growth', scatterInstanced(gDirs, surface, templates[growth], rand, 0.7, 1.25));
  if (growth === 'lanterns' && spec.flags.glowGrowth) {
    const glowPts = new Float32Array(gDirs.length * 3);
    gDirs.forEach((d, i) => { const p = d.clone().multiplyScalar(surface(d) + 0.065); glowPts.set([p.x, p.y, p.z], i * 3); });
    add('growth', points(glowPts, { size: 0.12, color: '#FFD98A', opacity: 0.55, additive: true }));
  }

  /* ---------------- dwelling ---------------- */
  const dwell = buildDwelling(P.dwelling.id, spec, tickers, rand);
  if (P.dwelling.id === 'train') { add('dwelling', dwell); }
  else { stand(dwell, SPOTS.dwelling, surface(SPOTS.dwelling) - 0.005, 0.3); add('dwelling', dwell); }

  /* ---------------- wonders ---------------- */
  spec.wonders.forEach((w, i) => {
    const spot = i === 0 ? SPOTS.wonderH : SPOTS.wonderA;
    const obj = buildWonder(w.id, spot, surface, tickers, rand, pal, i);
    add(i === 0 ? 'wonderH' : 'wonderA', obj);
  });

  /* ---------------- secret (ground half's line) ---------------- */
  const secretLine = spec.lines.find(l => l.key === 'secret');
  if (secretLine?.text) {
    const mark = group(
      mesh(new THREE.BoxGeometry(0.075, 0.012, 0.016), toon('#C7524E'), { rot: [0, 0.78, 0] }),
      mesh(new THREE.BoxGeometry(0.075, 0.012, 0.016), toon('#C7524E'), { rot: [0, -0.78, 0] }),
      mesh(new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), toon(shade(pal.land[1], 0.85)), { pos: [0, -0.03, 0] })
    );
    stand(mark, SPOTS.secret, surface(SPOTS.secret) + 0.004);
    mark.userData.pick = 'secret';
    mark.children.forEach(ch => ch.userData.pick = 'secret');
    add('secret', mark);
  }

  /* ---------------- sky: light, background things ---------------- */
  const sky = P.sky.id;
  const hemi = new THREE.HemisphereLight(pal.light, pal.dark ? '#4A4F7E' : '#E9DDE6', pal.dark ? 0.95 : 1.25);
  const key = new THREE.DirectionalLight(pal.light, pal.dark ? 1.5 : 1.9);
  key.position.set(-3, 3.5, 4);
  const lights = group(hemi, key);
  skyLayer.add(lights);
  if (pal.dark) {
    const n = 260, sp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) sp.set([(rand() - 0.5) * 14, (rand() - 0.5) * 10, -4 - rand() * 4], i * 3);
    const stars = points(sp, { size: 0.09, color: '#FFFFFF', shape: 'star', opacity: 0.9 });
    add('sky', stars, skyLayer);
    tickers.push(t => { stars.material.opacity = 0.7 + 0.25 * Math.sin(t * 1.7); });
  }
  if (sky === 'aurora') add('sky', aurora(tickers), skyLayer);
  if (sky === 'eclipse') add('sky', eclipse(), skyLayer);
  if (sky === 'dawn' || sky === 'sunset' || sky === 'noon') {
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('dot', '#ffffff'), color: sky === 'noon' ? '#FFF6D8' : '#FFD7B0', transparent: true, opacity: 0.9, depthWrite: false }));
    sun.position.set(-2.6, 1.9, -3); sun.scale.setScalar(1.6);
    add('sky', sun, skyLayer);
  }

  /* ---------------- moons ---------------- */
  add('moon', buildMoons(P.moon.id, spec, tickers, rand, pal));

  /* ---------------- air ---------------- */
  const airObj = buildAir(P.air.id, spec, surface, tickers, rand, pal, landDirs);
  add('air', airObj, airObj.userData.skyFixed ? skyLayer : world);

  /* ---------------- visitor ---------------- */
  const vis = buildVisitor(P.visitor.id, spec, surface, tickers, rand, pal);
  add('visitor', vis);

  /* ---------------- api ---------------- */
  let time = 0;
  const setLandRevealed = on => { terrain.material = on ? landMat : greyMat; };
  return {
    world, skyLayer, parts, spots: { ...SPOTS, front: new THREE.Vector3(0, 0.12, 1) }, terrain,
    update(dt) { time += dt; for (const f of tickers) f(time, dt); },
    setLandRevealed,
    /** Before the reveal: a grey, unlit world and nothing else. */
    prepareReveal() {
      setLandRevealed(false);
      for (const [slot, objs] of Object.entries(parts)) if (slot !== 'land') objs.forEach(o => { o.visible = false; });
      parts.land.slice(1).forEach(o => { o.visible = false; });
    },
    /** A slot with its own way of appearing. Returns true if handled. */
    reveal(slot, tween) {
      if (slot !== 'land') return false;
      setLandRevealed(true); parts.land.forEach(o => { o.visible = true; });
      tween(0.6, e => terrain.scale.setScalar(1 + Math.sin(e * Math.PI) * 0.04));
      return true;
    },
    revealAll() { setLandRevealed(true); for (const objs of Object.values(parts)) objs.forEach(o => { o.visible = true; }); },
    dispose() {
      [world, skyLayer].forEach(g => g.traverse(o => { o.geometry?.dispose?.(); }));
    }
  };
}

/* ======================================================================= helpers */

function nearSpot(d, ang) {
  const c = Math.cos(ang);
  return Object.values(SPOTS).some(s => d.dot(s) > c);
}
function shuffle(a, rand) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

/** One InstancedMesh (+ outline) per template part; per-instance colour from part.palette. */
function scatterInstanced(dirs, surface, template, rand, sMin, sMax) {
  const g = new THREE.Group();
  const n = dirs.length;
  const base = dirs.map(d => {
    const o = new THREE.Object3D();
    stand(o, d, surface(d) - 0.004, rand() * 6.28);
    const s = sMin + rand() * (sMax - sMin);
    o.scale.setScalar(s);
    o.updateMatrix();
    return { m: o.matrix.clone(), pick: rand() };
  });
  for (const part of template) {
    const mat = part.glow ? new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }) : toon('#ffffff', part.opts || {}).clone();
    const im = new THREE.InstancedMesh(part.geo, mat, n);
    const local = new THREE.Matrix4().compose(new THREE.Vector3(0, part.y || 0, 0), new THREE.Quaternion(), new THREE.Vector3(1, part.sy || 1, 1));
    const m = new THREE.Matrix4(), col = new THREE.Color();
    let hull = null;
    if (part.ink) {
      hull = new THREE.InstancedMesh(part.geo, inkMaterial(), n);
      hull.userData.inkHull = true;
    }
    base.forEach((b, i) => {
      m.multiplyMatrices(b.m, local);
      im.setMatrixAt(i, m);
      const pal = part.palette || [part.color];
      im.setColorAt(i, col.set(pal[Math.floor(b.pick * pal.length) % pal.length]));
      if (hull) { const mh = m.clone().multiply(new THREE.Matrix4().makeScale(1 + part.ink, 1 + part.ink, 1 + part.ink)); hull.setMatrixAt(i, mh); }
    });
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
    g.add(im);
    if (hull) g.add(hull);
  }
  return g;
}

function line(points3, color, opacity = 1) {
  const geo = new THREE.BufferGeometry().setFromPoints(points3);
  return new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
}

function edges(m, color = '#2E2A44') {
  const l = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 20), new THREE.LineBasicMaterial({ color }));
  m.add(l);
  return m;
}

/* ----------------------------------------------------------------- dwellings */
function buildDwelling(id, spec, tickers, rand) {
  const s = 1;
  const winGlow = glow('#FFE3A0');
  const cream = toon('#F6EEE2'), rose = toon('#E58F8C'), blueRoof = toon('#8DA6E0'), wood = toon('#B98D6E');
  const ink = 0.05;
  switch (id) {
    case 'cottage': {
      return group(
        mesh(new THREE.BoxGeometry(0.16, 0.11, 0.12), cream, { pos: [0, 0.055, 0], ink }),
        mesh(new THREE.ConeGeometry(0.135, 0.09, 4), rose, { pos: [0, 0.155, 0], rot: [0, Math.PI / 4, 0], scale: [1, 1, 0.8], ink }),
        mesh(new THREE.BoxGeometry(0.025, 0.05, 0.025), wood, { pos: [0.045, 0.19, 0.02], ink }),
        mesh(new THREE.PlaneGeometry(0.035, 0.035), winGlow, { pos: [-0.035, 0.06, 0.061] }),
        mesh(new THREE.PlaneGeometry(0.03, 0.055), toon('#9B6F5A'), { pos: [0.035, 0.0275, 0.061] })
      );
    }
    case 'lighthouse': {
      const g = new THREE.Group();
      for (let i = 0; i < 4; i++) g.add(mesh(new THREE.CylinderGeometry(0.045 - i * 0.006, 0.05 - i * 0.006, 0.06, 14), i % 2 ? rose : cream, { pos: [0, 0.03 + i * 0.06, 0], ink }));
      g.add(mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.04, 10), winGlow, { pos: [0, 0.26, 0] }));
      g.add(mesh(new THREE.ConeGeometry(0.038, 0.05, 10), rose, { pos: [0, 0.305, 0], ink }));
      if (spec.flags.beam) {
        const beam = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#FFF0B8', transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
        beam.rotation.z = Math.PI / 2; beam.position.x = 0.3;
        const pivot = group(beam); pivot.position.y = 0.26; g.add(pivot);
        tickers.push(t => { pivot.rotation.y = t * 0.9; });
      }
      return g;
    }
    case 'observatory': {
      const tele = mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.12, 8), toon('#6C6F96'), { ink });
      const telePivot = group(tele); tele.position.y = 0.05; telePivot.position.set(0, 0.15, 0);
      telePivot.rotation.z = spec.flags.aim ? -0.9 : -0.5; telePivot.rotation.x = spec.flags.aim ? -0.4 : 0;
      return group(
        mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.1, 16), cream, { pos: [0, 0.05, 0], ink }),
        mesh(new THREE.SphereGeometry(0.078, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon('#C9D2EE'), { pos: [0, 0.1, 0], ink }),
        telePivot,
        mesh(new THREE.PlaneGeometry(0.025, 0.04), winGlow, { pos: [0, 0.05, 0.081] })
      );
    }
    case 'greenhouse': {
      const glass = new THREE.MeshToonMaterial({ color: '#D8F3EE', transparent: true, opacity: 0.45, depthWrite: false, gradientMap: toon('#fff').gradientMap });
      const box = edges(mesh(new THREE.BoxGeometry(0.17, 0.09, 0.11), glass, { pos: [0, 0.045, 0] }), '#5F8C80');
      const roof = edges(mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 3, 1), glass, { pos: [0, 0.115, 0], rot: [0, 0, Math.PI / 2] }), '#5F8C80');
      const plants = [];
      for (let i = 0; i < 5; i++) plants.push(mesh(new THREE.IcosahedronGeometry(0.02, 1), toon(['#7FBF85', '#F2A9C0', '#9ED29A'][i % 3]), { pos: [-0.06 + i * 0.03, 0.02, (i % 2 - 0.5) * 0.04] }));
      return group(box, roof, plants);
    }
    case 'shrine': {
      const red = toon('#D9635B');
      return group(
        mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), red, { pos: [-0.06, 0.065, 0.06], ink }),
        mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.13, 6), red, { pos: [0.06, 0.065, 0.06], ink }),
        mesh(new THREE.BoxGeometry(0.17, 0.014, 0.018), toon('#3E3448'), { pos: [0, 0.135, 0.06], ink }),
        mesh(new THREE.BoxGeometry(0.14, 0.01, 0.014), red, { pos: [0, 0.11, 0.06] }),
        mesh(new THREE.BoxGeometry(0.07, 0.06, 0.06), toon('#E9D9C2'), { pos: [0, 0.03, -0.03], ink }),
        mesh(new THREE.ConeGeometry(0.065, 0.04, 4), toon('#4E5D7D'), { pos: [0, 0.08, -0.03], rot: [0, Math.PI / 4, 0], ink })
      );
    }
    case 'tower': {
      const g = group(
        mesh(new THREE.CylinderGeometry(0.05, 0.058, 0.2, 14), cream, { pos: [0, 0.1, 0], ink }),
        mesh(new THREE.ConeGeometry(0.068, 0.11, 14), blueRoof, { pos: [0, 0.255, 0], ink }),
        mesh(new THREE.PlaneGeometry(0.02, 0.03), winGlow, { pos: [0, 0.15, 0.052] })
      );
      const flag = mesh(new THREE.PlaneGeometry(0.04, 0.022), new THREE.MeshBasicMaterial({ color: '#E58F8C', side: THREE.DoubleSide }), { pos: [0.02, 0.32, 0] });
      g.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4), wood, { pos: [0, 0.32, 0] }), flag);
      tickers.push(t => { flag.rotation.y = Math.sin(t * 3) * 0.3; });
      return g;
    }
    case 'windmill': {
      const blades = new THREE.Group();
      for (let i = 0; i < 4; i++) { const b = mesh(new THREE.BoxGeometry(0.018, 0.11, 0.004), cream, { pos: [0, 0.055, 0], ink: 0.15 }); const p = group(b); p.rotation.z = i * Math.PI / 2; blades.add(p); }
      blades.position.set(0, 0.16, 0.05);
      tickers.push((t, dt) => { blades.rotation.z -= dt * 0.9; });
      return group(
        mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.16, 8), toon('#EADCC8'), { pos: [0, 0.08, 0], ink }),
        mesh(new THREE.ConeGeometry(0.045, 0.06, 8), rose, { pos: [0, 0.19, 0], ink }),
        blades
      );
    }
    case 'train': {
      // A rail ring around the world, slightly tilted, with a little train that always comes back around.
      const ring = new THREE.Group();
      const R = 1.2;
      ring.add(mesh(new THREE.TorusGeometry(R, 0.006, 6, 160), toon('#8C7B9C')));
      for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; ring.add(mesh(new THREE.BoxGeometry(0.008, 0.04, 0.012), wood, { pos: [Math.cos(a) * R, Math.sin(a) * R, 0], rot: [0, 0, a] })); }
      const cars = [];
      const colorsT = ['#E58F8C', '#F6EEE2', '#8DA6E0', '#F6EEE2'];
      for (let i = 0; i < 4; i++) {
        const car = group(mesh(new THREE.BoxGeometry(0.07, 0.04, 0.045), toon(colorsT[i]), { ink: 0.08, pos: [0, 0, 0.03] }));
        if (i === 0) car.add(mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6), toon('#3E3448'), { pos: [0.02, 0, 0.065], rot: [Math.PI / 2, 0, 0] }));
        car.add(mesh(new THREE.PlaneGeometry(0.02, 0.014), glow('#FFE3A0'), { pos: [0, 0.021, 0.035], rot: [-Math.PI / 2, 0, 0] }));
        ring.add(car); cars.push(car);
      }
      tickers.push(t => cars.forEach((car, i) => { const a = t * 0.25 - i * 0.065; car.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); car.rotation.z = a + Math.PI / 2; }));
      ring.rotation.set(Math.PI / 2 - 0.35, 0, 0.2);
      // a small station on the reserved spot, so the dwelling slot is visible from the front
      return ring;
    }
  }
  return new THREE.Group();
}

/* ----------------------------------------------------------------- wonders */
function buildWonder(id, spot, surface, tickers, rand, pal, idx) {
  const r0 = surface(spot) - 0.005;
  const ink = 0.05;
  let g = new THREE.Group();
  switch (id) {
    case 'island': {
      const rock = mesh(new THREE.ConeGeometry(0.14, 0.2, 7), toon('#A897B8', { flat: true }), { rot: [Math.PI, 0, 0], ink });
      const top = mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.03, 7), toon(pal.land[0], { flat: true }), { pos: [0, 0.11, 0], ink });
      const tree = group(mesh(new THREE.CylinderGeometry(0.006, 0.009, 0.05, 5), toon('#9C7A63'), { pos: [0, 0.15, 0] }), mesh(new THREE.IcosahedronGeometry(0.035, 1), toon('#8CC48A'), { pos: [0.0, 0.19, 0], ink: 0.1 }));
      const house = mesh(new THREE.BoxGeometry(0.035, 0.03, 0.03), toon('#F6EEE2'), { pos: [0.06, 0.14, 0.02], ink: 0.08 });
      const isle = group(rock, top, tree, house);
      const holder = group(isle);
      stand(holder, spot, r0 + 0.32);
      tickers.push(t => { isle.position.y = Math.sin(t * 0.9 + idx) * 0.025; isle.rotation.y = t * 0.1; });
      return holder;
    }
    case 'spire': {
      g.add(mesh(new THREE.OctahedronGeometry(0.06, 0), toon('#CFE6FF', { opacity: 0.88, flat: true, emissive: '#7E8BEA', emissiveIntensity: 0.3 }), { pos: [0, 0.2, 0], scale: [1, 3.6, 1], ink: 0.06 }));
      for (let i = 0; i < 4; i++) { const a = i * 1.7; g.add(mesh(new THREE.OctahedronGeometry(0.03, 0), toon(['#E7D8FF', '#CFE6FF', '#FFD9EE'][i % 3], { opacity: 0.9, flat: true }), { pos: [Math.cos(a) * 0.06, 0.04, Math.sin(a) * 0.06], scale: [1, 2.2, 1], rot: [Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4], ink: 0.08 })); }
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('star'), color: '#FFFFFF', transparent: true, depthWrite: false }));
      sp.position.y = 0.44; sp.scale.setScalar(0.12); g.add(sp);
      tickers.push(t => { sp.material.rotation = t * 0.6; sp.scale.setScalar(0.1 + Math.sin(t * 2) * 0.02); });
      break;
    }
    case 'road': {
      // A glowing road leaving the spot and curling around the world.
      const pts = [];
      const axis = new THREE.Vector3(0, 1, 0).cross(spot).normalize().applyAxisAngle(spot, 0.6 * (idx ? -1 : 1));
      for (let i = 0; i <= 80; i++) {
        const d = spot.clone().applyAxisAngle(axis, (i / 80) * 1.9 * (idx ? -1 : 1));
        const tw = d.clone().applyAxisAngle(spot, Math.sin(i / 9) * 0.05);
        pts.push(tw.multiplyScalar(surface(tw) + 0.006));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const road = group(
        new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.016, 5), glow('#FFE7B0')),
        new THREE.Mesh(new THREE.TubeGeometry(curve, 100, 0.04, 6), new THREE.MeshBasicMaterial({ color: '#FFD98A', transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }))
      );
      for (let i = 4; i <= 80; i += 12) {
        const p = pts[i], lamp = group(mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.05, 4), toon('#5C5470'), { pos: [0, 0.025, 0] }), mesh(new THREE.IcosahedronGeometry(0.01, 1), glow('#FFF1C2'), { pos: [0, 0.055, 0] }));
        stand(lamp, p.clone().normalize(), p.length() - 0.004); road.add(lamp);
      }
      return road;
    }
    case 'bridge': {
      const pts = [];
      for (let i = 0; i <= 40; i++) { const k = i / 40; pts.push(new THREE.Vector3(Math.sin(k * 2.2) * 0.25 * k, k * 0.75, -Math.sin(k * 3) * 0.08)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.006, 4), toon('#B49378')));
      for (let i = 1; i <= 24; i++) {
        const k = i / 25, p = curve.getPointAt(k), tng = curve.getTangentAt(k);
        const plank = mesh(new THREE.BoxGeometry(0.06, 0.006, 0.02), toon(i % 2 ? '#E8D5BC' : '#D9BFA0'), { ink: 0.2 });
        plank.position.copy(p); plank.lookAt(p.clone().add(tng)); g.add(plank);
      }
      const star = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('star'), color: '#FFF3B8', transparent: true, depthWrite: false }));
      star.position.copy(pts[40]).add(new THREE.Vector3(0, 0.06, 0)); star.scale.setScalar(0.16); g.add(star);
      tickers.push(t => { star.material.rotation = -t * 0.5; });
      break;
    }
    case 'lighttree': {
      g.add(mesh(new THREE.CylinderGeometry(0.014, 0.026, 0.2, 7), toon('#8E6E5E'), { pos: [0, 0.1, 0], ink }));
      g.add(mesh(new THREE.IcosahedronGeometry(0.1, 2), toon('#556E8E', { opacity: 0.35 }), { pos: [0, 0.26, 0], scale: [1.2, 0.9, 1.2] }));
      const n = 70, p = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(0.06 + rand() * 0.07); p.set([d.x * 1.3, 0.26 + d.y, d.z * 1.3], i * 3); }
      const lights = points(p, { size: 0.045, color: '#FFE6A6', additive: true });
      g.add(lights);
      tickers.push(t => { lights.material.opacity = 0.75 + 0.25 * Math.sin(t * 2.3 + idx); });
      break;
    }
    case 'upfall': {
      g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.012, 20), toon(pal.water || '#9ED3F0'), { pos: [0, 0.006, 0], ink: 0.06 }));
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.055, 0.36, 14, 1, true), new THREE.MeshBasicMaterial({ color: '#BFE8FF', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
      col.position.y = 0.18; g.add(col);
      const n = 40, p = new Float32Array(n * 3), seedY = Float32Array.from({ length: n }, () => rand());
      const drops = points(p, { size: 0.03, color: '#E8F7FF' }); g.add(drops);
      tickers.push(t => {
        const a = drops.geometry.attributes.position;
        for (let i = 0; i < n; i++) { const k = (seedY[i] + t * 0.25) % 1, ang = i * 2.4; a.setXYZ(i, Math.cos(ang) * (0.03 + k * 0.04), k * 0.42, Math.sin(ang) * (0.03 + k * 0.04)); }
        a.needsUpdate = true;
      });
      break;
    }
    case 'arch': {
      g.add(mesh(new THREE.TorusGeometry(0.11, 0.028, 6, 14, Math.PI), toon('#BDB6C9', { flat: true }), { pos: [0, 0.0, 0], ink }));
      g.add(mesh(new THREE.PlaneGeometry(0.17, 0.1), new THREE.MeshBasicMaterial({ color: '#E9E1FF', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }), { pos: [0, 0.05, 0] }));
      break;
    }
    case 'door': {
      const frame = toon('#F3ECE4'), panel = toon('#8FA7D9');
      g.add(mesh(new THREE.BoxGeometry(0.014, 0.17, 0.02), frame, { pos: [-0.05, 0.085, 0], ink: 0.1 }));
      g.add(mesh(new THREE.BoxGeometry(0.014, 0.17, 0.02), frame, { pos: [0.05, 0.085, 0], ink: 0.1 }));
      g.add(mesh(new THREE.BoxGeometry(0.114, 0.014, 0.02), frame, { pos: [0, 0.17, 0], ink: 0.1 }));
      g.add(mesh(new THREE.PlaneGeometry(0.086, 0.156), glow('#FFE8B8'), { pos: [0, 0.08, -0.002] }));
      const door = mesh(new THREE.BoxGeometry(0.086, 0.156, 0.01), panel, { pos: [0.043, 0, 0], ink: 0.06 });
      door.add(mesh(new THREE.SphereGeometry(0.006, 6, 6), toon('#E9C46A'), { pos: [0.03, 0, 0.008] }));
      const hinge = group(door); hinge.position.set(-0.043, 0.08, 0.004);
      g.add(hinge);
      tickers.push(t => { hinge.rotation.y = -0.55 - Math.sin(t * 0.6) * 0.1; });
      break;
    }
  }
  stand(g, spot, r0, idx ? -0.4 : 0.4);
  return g;
}

/* ----------------------------------------------------------------- sky things */
function aurora(tickers) {
  const g = new THREE.Group();
  const mats = [];
  [['#7DF2C9', -0.2, 0], ['#A98BFF', 0.35, 1.3], ['#6FD6F2', 0.75, 2.4]].forEach(([color, y, ph]) => {
    const geo = new THREE.PlaneGeometry(9, 1.3, 90, 1);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { t: { value: 0 }, c: { value: new THREE.Color(color) }, ph: { value: ph } },
      vertexShader: 'uniform float t; uniform float ph; varying vec2 vUv; void main(){ vUv=uv; vec3 p=position; p.y+=sin(p.x*0.9+t*0.5+ph)*0.35; p.z+=cos(p.x*0.6+t*0.3+ph)*0.5; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);} ',
      fragmentShader: 'uniform vec3 c; uniform float t; varying vec2 vUv; void main(){ float a=smoothstep(0.0,0.35,vUv.y)*smoothstep(1.0,0.45,vUv.y); a*=0.35+0.65*pow(0.5+0.5*sin(vUv.x*70.0+sin(vUv.x*9.0+t*0.7)*3.0),2.0); gl_FragColor=vec4(c, a*0.5);} '
    });
    mats.push(mat);
    const m = new THREE.Mesh(geo, mat);
    m.position.set(0, 1.2 + y, -3.4 - y); m.rotation.z = 0.18;
    g.add(m);
  });
  tickers.push(t => mats.forEach(m => { m.uniforms.t.value = t; }));
  return g;
}

function eclipse() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  const r = x.createRadialGradient(128, 128, 40, 128, 128, 126);
  r.addColorStop(0, 'rgba(255,240,210,0)'); r.addColorStop(0.42, 'rgba(255,231,190,1)'); r.addColorStop(0.5, 'rgba(255,214,160,0.55)'); r.addColorStop(1, 'rgba(255,200,150,0)');
  x.fillStyle = r; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#120E1C'; x.beginPath(); x.arc(128, 128, 52, 0, 7); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.position.set(2.1, 1.5, -3.5); s.scale.setScalar(2.2);
  return s;
}

/* ----------------------------------------------------------------- moons */
function moonBall(r, color, ink = 0.06) {
  const m = mesh(new THREE.IcosahedronGeometry(r, 3), toon(color), { ink });
  for (let i = 0; i < 3; i++) {
    const cr = mesh(new THREE.CircleGeometry(r * (0.18 + i * 0.07), 12), toon(shade(color, 0.88)));
    const d = new THREE.Vector3(Math.sin(i * 2.1), Math.cos(i * 1.3) * 0.6, 0.8).normalize();
    cr.position.copy(d.multiplyScalar(r * 1.003)); cr.lookAt(cr.position.clone().multiplyScalar(2));
    m.add(cr);
  }
  return m;
}
function orbit(obj, radius, speed, tilt, phase, tickers) {
  const pivot = new THREE.Group();
  obj.position.set(radius, 0, 0);
  pivot.add(obj);
  const holder = group(pivot); holder.rotation.set(tilt, 0, tilt * 0.6);
  tickers.push(t => { pivot.rotation.y = phase + t * speed; });
  return holder;
}
function rings(pal) {
  const g = new THREE.Group();
  const geo = new THREE.RingGeometry(1.38, 1.9, 128, 6);
  const cols = [], p = geo.attributes.position, c = new THREE.Color();
  const bands = pal.dark ? ['#B9B4E8', '#8E9AD6', '#D7C9F2', '#A5C8E8'] : ['#E8CFE0', '#C9D6F0', '#F3E0C2', '#D7CCF0'];
  for (let i = 0; i < p.count; i++) { const r = Math.hypot(p.getX(i), p.getY(i)); c.set(bands[Math.floor((r - 1.38) / 0.52 * 7) % bands.length]); cols.push(c.r, c.g, c.b); }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false })));
  // Ink orbit lines at the edges, in the hand-drawn flash style.
  for (const r of [1.36, 1.93, 2.08]) {
    const pts = []; for (let i = 0; i <= 160; i++) { const a = i / 160 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    g.add(line(pts, pal.dark ? '#E6E3FF' : '#6B6386', r > 2 ? 0.35 : 0.6));
  }
  g.rotation.set(Math.PI / 2 - 0.42, 0.18, 0);
  return g;
}
function buildMoons(id, spec, tickers, rand, pal) {
  const g = new THREE.Group();
  const pearl = pal.dark ? '#EDE8FF' : '#F4EEDF';
  if (id === 'one' || id === 'ringmoon') g.add(orbit(moonBall(0.13, pearl), 2.0, 0.22, 0.35, 1.2, tickers));
  if (id === 'twin') {
    g.add(orbit(moonBall(0.12, pearl), 1.95, 0.22, 0.3, 0.6, tickers));
    g.add(orbit(moonBall(0.085, '#D9CCF6'), 2.35, 0.16, -0.25, 3.4, tickers));
  }
  if (id === 'rings' || id === 'ringmoon') { const r = rings(pal); g.add(r); tickers.push(t => { r.rotation.z = t * 0.03; }); }
  if (id === 'comet') {
    const head = mesh(new THREE.IcosahedronGeometry(0.045, 2), glow('#F2FBFF'));
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.5, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#BDE6FF', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    tail.rotation.x = -Math.PI / 2; tail.position.z = 0.25;
    const comet = group(head, tail);
    const pivot = group(comet);
    const holder = group(pivot); holder.rotation.set(0.5, 0, -0.3);
    tickers.push(t => { const a = t * 0.12 + 2; comet.position.set(Math.cos(a) * 2.3, 0, Math.sin(a) * 1.2); comet.rotation.y = Math.atan2(Math.sin(a) * 2.3, -Math.cos(a) * 1.2); });
    g.add(holder);
  }
  if (id === 'crescent') {
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.32, Math.PI * 0.5, Math.PI * 1.5, false);
    s.absarc(0.13, 0, 0.26, Math.PI * 1.5, Math.PI * 0.5, true);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 3, curveSegments: 24 });
    geo.center();
    const m = mesh(geo, toon('#F7DC8A', { emissive: '#F2C25E', emissiveIntensity: 0.25 }), { ink: 0.05 });
    const holder = group(m); holder.position.set(-1.65, 1.15, -0.3); holder.rotation.z = -0.5;
    tickers.push(t => { m.position.y = Math.sin(t * 0.8) * 0.05; m.rotation.y = Math.sin(t * 0.4) * 0.25; });
    g.add(holder);
  }
  if (id === 'sun2') {
    const sun = group(mesh(new THREE.IcosahedronGeometry(0.11, 3), glow('#FFD58A')));
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('dot'), color: '#FFC37A', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(0.9); sun.add(halo);
    const light = new THREE.PointLight('#FFB877', 2.2, 4, 1.5); sun.add(light);
    g.add(orbit(sun, 2.0, 0.15, -0.4, 4.0, tickers));
  }
  return g;
}

/* ----------------------------------------------------------------- air */
function buildAir(id, spec, surface, tickers, rand, pal, landDirs) {
  const g = new THREE.Group();
  const shellPts = (n, rMin, rMax) => { const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(rMin + rand() * (rMax - rMin)); p.set([d.x, d.y, d.z], i * 3); } return p; };
  const fallInward = (pts, speed, rMin, rMax, swirl = 0) => {
    const a = pts.geometry.attributes.position, v = new THREE.Vector3();
    tickers.push((t, dt) => {
      for (let i = 0; i < a.count; i++) {
        v.fromBufferAttribute(a, i);
        let r = v.length() - speed * dt;
        if (r < rMin) r = rMax;
        v.setLength(r);
        if (swirl) v.applyAxisAngle(new THREE.Vector3(0, 1, 0), swirl * dt);
        a.setXYZ(i, v.x, v.y, v.z);
      }
      a.needsUpdate = true;
    });
  };
  switch (id) {
    case 'clouds': {
      for (let i = 0; i < 8; i++) {
        const cl = new THREE.Group();
        const k = 3 + Math.floor(rand() * 3);
        for (let j = 0; j < k; j++) cl.add(mesh(new THREE.IcosahedronGeometry(0.04 + rand() * 0.03, 2), toon(pal.dark ? '#C9CDE8' : '#FFFFFF'), { pos: [(j - k / 2) * 0.05, rand() * 0.025, rand() * 0.02], ink: 0.04 }));
        const holder = orbit(cl, 1.34 + rand() * 0.12, 0.05 + rand() * 0.05, (rand() - 0.5) * 1.6, rand() * 6, tickers);
        g.add(holder);
      }
      break;
    }
    case 'snow': { const p = points(shellPts(380, 1.02, 2.0), { size: 0.045, color: '#FFFFFF', shape: 'flake' }); g.add(p); fallInward(p, 0.12, 1.02, 2.0, 0.05); break; }
    case 'petals': { const p = points(shellPts(240, 1.02, 2.0), { size: 0.05, color: '#F7B9CC', shape: 'petal' }); g.add(p); fallInward(p, 0.09, 1.02, 2.0, 0.25); break; }
    case 'rain': {
      const n = 130, p = new Float32Array(n * 6), base = [];
      for (let i = 0; i < n; i++) { const d = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(); base.push({ d, r: 1.05 + rand() * 0.9 }); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
      const ls = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#B9D3F0', transparent: true, opacity: 0.38 }));
      g.add(ls);
      tickers.push((t, dt) => { base.forEach((b, i) => { b.r -= dt * 0.9; if (b.r < 1.02) b.r = 1.95; const a = b.d.clone().multiplyScalar(b.r), c = b.d.clone().multiplyScalar(b.r + 0.035); p.set([a.x, a.y, a.z, c.x, c.y, c.z], i * 6); }); geo.attributes.position.needsUpdate = true; });
      break;
    }
    case 'fireflies': {
      const n = 90, p = new Float32Array(n * 3), base = [];
      for (let i = 0; i < n; i++) { const d = landDirs[(i * 7) % landDirs.length] || new THREE.Vector3(0, 1, 0); base.push({ d, h: 0.04 + rand() * 0.18, ph: rand() * 6 }); }
      const pts = points(p, { size: 0.06, color: '#E9FF9C', additive: true });
      g.add(pts);
      tickers.push(t => { base.forEach((b, i) => { const q = b.d.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.sin(t * 0.3 + b.ph) * 0.06).multiplyScalar(surface(b.d) + b.h + Math.sin(t + b.ph) * 0.03); p.set([q.x, q.y, q.z], i * 3); }); pts.geometry.attributes.position.needsUpdate = true; pts.material.opacity = 0.75 + 0.25 * Math.sin(t * 3); });
      break;
    }
    case 'rainbow': {
      const bow = new THREE.Group();
      ['#F4A7B0', '#F6C99A', '#F7E39C', '#B7E2B0', '#A9CDF0', '#C7B4F0'].forEach((col, i) => bow.add(mesh(new THREE.TorusGeometry(0.62 - i * 0.035, 0.016, 6, 64, Math.PI), toon(col, { opacity: 0.9 }))));
      const holder = group(bow);
      const d = new THREE.Vector3(-0.2, 0.55, 0.8).normalize();
      stand(holder, d, 0.9, 0.2);
      bow.rotation.y = 0.5;
      g.add(holder);
      break;
    }
    case 'meteors': {
      const streaks = [];
      for (let i = 0; i < 4; i++) {
        const s = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.02), new THREE.MeshBasicMaterial({ color: '#FFF4D6', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        g.add(s); streaks.push({ s, ph: i / 4 });
      }
      tickers.push(t => streaks.forEach((m, i) => {
        const k = (t * 0.22 + m.ph) % 1;
        m.s.position.set(2.6 - k * 5.2 + i * 0.3, 2.2 - k * 2.6 - i * 0.25, -1.5 - i * 0.4);
        m.s.rotation.z = 0.48;
        m.s.material.opacity = k < 0.6 ? Math.sin(k / 0.6 * Math.PI) * 0.9 : 0;
      }));
      // Meteors belong to the sky around the world, not to the world: re-parented by the stage.
      g.userData.skyFixed = true;
      break;
    }
    case 'bubbles': {
      const n = 26, base = [];
      for (let i = 0; i < n; i++) {
        const b = mesh(new THREE.IcosahedronGeometry(0.03 + rand() * 0.03, 2), new THREE.MeshToonMaterial({ color: ['#D6F0FF', '#FFE0F0', '#E8E0FF'][i % 3], transparent: true, opacity: 0.5, gradientMap: toon('#fff').gradientMap }));
        g.add(b); base.push({ b, d: landDirs[(i * 13) % landDirs.length] || new THREE.Vector3(0, 1, 0), ph: rand() });
      }
      tickers.push(t => base.forEach(o => { const k = (t * 0.12 + o.ph) % 1; o.b.position.copy(o.d).multiplyScalar(surface(o.d) + 0.05 + k * 0.8); o.b.scale.setScalar(k > 0.92 ? 1 + (k - 0.92) * 8 : 1); o.b.material.opacity = k > 0.92 ? 0.5 * (1 - (k - 0.92) / 0.08) : 0.5; }));
      break;
    }
  }
  return g;
}

/* ----------------------------------------------------------------- visitors */
function crane(color) {
  const mat = toon(color, { flat: true, side: THREE.DoubleSide });
  const tri = (a, b, c) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c], 3)); geo.computeVertexNormals(); return edges(new THREE.Mesh(geo, mat), '#3B4C9A'); };
  const body = group(
    tri([-0.2, 0, 0], [0.2, 0, 0], [0, -0.13, 0.04]), tri([-0.2, 0, 0], [0.2, 0, 0], [0, -0.13, -0.04]),
    tri([0.1, 0, 0], [0.18, 0, 0], [0.42, 0.32, 0]), tri([0.42, 0.32, 0], [0.38, 0.3, 0], [0.48, 0.26, 0]),
    tri([-0.1, 0, 0], [-0.2, 0, 0], [-0.44, 0.26, 0])
  );
  const wingL = group(tri([-0.14, 0, 0], [0.14, 0, 0], [0, 0.04, 0.5]));
  const wingR = group(tri([-0.14, 0, 0], [0.14, 0, 0], [0, 0.04, -0.5]));
  const c = group(body, wingL, wingR);
  c.userData.wings = [wingL, wingR];
  c.scale.setScalar(0.34);
  return c;
}
function buildVisitor(id, spec, surface, tickers, rand, pal) {
  const g = new THREE.Group();
  const ink = 0.05;
  const flyAround = (obj, r, speed, tilt, phase, bob = 0.04) => {
    const pivot = new THREE.Group(); pivot.add(obj);
    const holder = group(pivot); holder.rotation.set(tilt, 0, tilt * 0.5);
    tickers.push(t => { const a = phase + t * speed; obj.position.set(Math.cos(a) * r, Math.sin(t * 1.3 + phase) * bob, -Math.sin(a) * r); obj.rotation.y = a + (speed > 0 ? 0 : Math.PI); });
    g.add(holder);
  };
  switch (id) {
    case 'whale': {
      const body = mesh(new THREE.SphereGeometry(0.1, 20, 14), toon('#A8B8EA'), { scale: [2.1, 0.95, 1], ink });
      const belly = mesh(new THREE.SphereGeometry(0.096, 18, 12), toon('#EEF1FF'), { scale: [1.9, 0.75, 0.9], pos: [0.01, -0.022, 0] });
      const tail = mesh(new THREE.ConeGeometry(0.07, 0.12, 4), toon('#97A8E0'), { rot: [Math.PI / 2, 0, Math.PI / 2], pos: [-0.24, 0.02, 0], scale: [1, 1, 0.25], ink });
      const fin = mesh(new THREE.SphereGeometry(0.04, 8, 6), toon('#97A8E0'), { pos: [0.04, -0.06, 0.09], scale: [1.4, 0.3, 0.8] });
      const eye = mesh(new THREE.SphereGeometry(0.009, 6, 6), toon('#2B2950'), { pos: [0.16, 0.0, 0.07] });
      const eye2 = eye.clone(); eye2.position.z = -0.07;
      const whale = group(body, belly, tail, fin, eye, eye2);
      // rotate so +x (nose) points along -z travel... flyAround sets rotation.y; nose along +x means facing tangent when y=a.
      whale.rotation.y = Math.PI / 2; // nose (+x) faces the direction of travel (-z)
      tickers.push(t => { tail.rotation.y = Math.sin(t * 2) * 0.3; });
      flyAround(group(whale), spec.flags.whaleLow ? 1.38 : 1.62, 0.12, 0.25, 0.8, 0.06);
      break;
    }
    case 'cranes': {
      const cols = ['#F6F3EA', '#AFC6F2', '#F4E08A', '#BDE3F0', '#F6F3EA'];
      cols.forEach((col, i) => {
        const c = crane(col);
        tickers.push(t => { const f = Math.sin(t * 5 + i) * 0.5; c.userData.wings[0].rotation.x = f; c.userData.wings[1].rotation.x = -f; });
        const holder = group(c); holder.rotation.y = Math.PI / 2;
        flyAround(group(holder), spec.flags.perch && i < 2 ? 1.15 : 1.42 + i * 0.05, 0.2, 0.4 - i * 0.12, i * 0.45);
      });
      break;
    }
    case 'jelly': {
      for (let i = 0; i < 4; i++) {
        const col = ['#F7B6D6', '#C6B4F6', '#A8E1F2', '#FFD3B0'][i];
        const dome = mesh(new THREE.SphereGeometry(0.06, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), toon(col, { opacity: 0.85, emissive: col, emissiveIntensity: 0.35 }), { ink: 0.06 });
        const j = group(dome);
        for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; j.add(line([new THREE.Vector3(Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035), new THREE.Vector3(Math.cos(a) * 0.03, -0.06, Math.sin(a) * 0.03), new THREE.Vector3(Math.cos(a) * 0.04, -0.12, Math.sin(a) * 0.04)], col, 0.8)); }
        const d = new THREE.Vector3(Math.cos(i * 1.6), 0.4 - i * 0.25, Math.sin(i * 1.6)).normalize();
        const holder = group(j); stand(holder, d, 1.45 + (i % 2) * 0.15);
        tickers.push(t => { j.position.y = Math.sin(t * 0.9 + i) * 0.06; dome.scale.set(1 + Math.sin(t * 2.4 + i) * 0.08, 1 - Math.sin(t * 2.4 + i) * 0.08, 1 + Math.sin(t * 2.4 + i) * 0.08); });
        g.add(holder);
      }
      break;
    }
    case 'koi': {
      for (let i = 0; i < 3; i++) {
        const body = mesh(new THREE.SphereGeometry(0.05, 14, 10), toon('#FFF6EE'), { scale: [1.9, 0.62, 0.72], ink });
        const patch = mesh(new THREE.SphereGeometry(0.046, 12, 8), toon(i === 1 ? '#3E3448' : '#F08A5D'), { scale: [1.1, 0.5, 0.62], pos: [0.03, 0.012, 0] });
        const tail = mesh(new THREE.ConeGeometry(0.035, 0.07, 3), toon('#F4A47E', { side: THREE.DoubleSide }), { rot: [0, 0, Math.PI / 2], pos: [-0.11, 0, 0], scale: [1, 1, 0.15] });
        const koi = group(body, patch, tail);
        tickers.push(t => { tail.rotation.y = Math.sin(t * 6 + i) * 0.5; koi.rotation.y = Math.sin(t * 3 + i) * 0.12; });
        const holder = group(koi); holder.rotation.y = Math.PI / 2;
        flyAround(group(holder), 1.36 + i * 0.03, 0.32, 0.9 - i * 0.05, i * 0.4, 0.03);
      }
      break;
    }
    case 'birds': {
      for (let i = 0; i < 9; i++) {
        const mat = toon(pal.dark ? '#E7E4FF' : '#5D5677', { side: THREE.DoubleSide });
        const wl = mesh(new THREE.PlaneGeometry(0.06, 0.016), mat, { pos: [0, 0, 0.028], rot: [Math.PI / 2, 0, 0] });
        const wr = mesh(new THREE.PlaneGeometry(0.06, 0.016), mat, { pos: [0, 0, -0.028], rot: [Math.PI / 2, 0, 0] });
        const pl = group(wl), pr = group(wr);
        const bird = group(pl, pr);
        tickers.push(t => { const f = Math.sin(t * 8 + i) * 0.6; pl.rotation.x = f; pr.rotation.x = -f; });
        const holder = group(bird); holder.rotation.y = Math.PI / 2;
        flyAround(group(holder), 1.5 + (i % 3) * 0.06, 0.25, 0.5 + (i % 3) * 0.05, Math.floor(i / 3) * 0.12 + (i % 3) * 0.05, 0.02);
      }
      break;
    }
    case 'balloon': {
      const geo = new THREE.SphereGeometry(0.11, 16, 14);
      const cols = [], p = geo.attributes.position, c = new THREE.Color();
      for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getZ(i), p.getX(i)); c.set(Math.floor((a + Math.PI) / (Math.PI / 4)) % 2 ? '#F4A7B0' : '#FFF4E4'); cols.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const env = mesh(geo, new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toon('#fff').gradientMap }), { scale: [1, 1.15, 1], ink });
      const basket = mesh(new THREE.BoxGeometry(0.045, 0.035, 0.045), toon('#B98D6E'), { pos: [0, -0.2, 0], ink: 0.1 });
      const b = group(env, basket);
      for (const [x, z] of [[0.02, 0.02], [-0.02, 0.02], [0.02, -0.02], [-0.02, -0.02]]) b.add(line([new THREE.Vector3(x, -0.18, z), new THREE.Vector3(x * 3, -0.09, z * 3)], '#6B5B6E'));
      flyAround(b, 1.7, 0.07, 0.35, 0.3, 0.05);
      break;
    }
    case 'fox': {
      const orange = toon('#EE9A5F'), white = toon('#FFF6EE');
      const fox = group(
        mesh(new THREE.SphereGeometry(0.045, 14, 10), orange, { scale: [1.4, 0.7, 1], pos: [0, 0.03, 0], ink: 0.08 }),
        mesh(new THREE.SphereGeometry(0.03, 12, 10), orange, { pos: [0.055, 0.035, 0.02], ink: 0.08 }),
        mesh(new THREE.ConeGeometry(0.012, 0.025, 4), orange, { pos: [0.06, 0.068, 0.005] }),
        mesh(new THREE.ConeGeometry(0.012, 0.025, 4), orange, { pos: [0.065, 0.065, 0.035] }),
        mesh(new THREE.SphereGeometry(0.03, 12, 10), orange, { scale: [1.8, 0.7, 0.8], pos: [-0.02, 0.025, 0.055], rot: [0, 0.8, 0], ink: 0.08 }),
        mesh(new THREE.SphereGeometry(0.016, 10, 8), white, { pos: [0.03, 0.025, 0.08] })
      );
      const d = SPOTS.dwelling.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), spec.flags.foxHome ? 0.2 : -0.45).normalize();
      stand(fox, d, surface(d) - 0.004, 1.2);
      const zz = new THREE.Sprite(new THREE.SpriteMaterial({ map: spriteTex('dot'), color: '#ffffff', transparent: true, opacity: 0.6, depthWrite: false }));
      zz.scale.setScalar(0.03); fox.add(zz);
      tickers.push(t => { const k = (t * 0.3) % 1; zz.position.set(0.06, 0.08 + k * 0.1, 0.02); zz.material.opacity = 0.7 * (1 - k); fox.children[0].scale.y = 0.7 + Math.sin(t * 1.5) * 0.03; });
      g.add(fox);
      break;
    }
  }
  return g;
}

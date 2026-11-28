// Weltreise: Städte, Wahrzeichen, Menschen, Flug-Szene
import * as THREE from './three.min.js';
import * as MD from './w3d-models.js?v=8';
import { makeSky, makeSnowfall, mergeStatic } from './w3d-world.js?v=8';

export const DEST = [
  { id: 'volketswil', name: 'Volketswil', land: 'Schweiz', x: .515, y: .30, style: 'swiss', snow: true },
  { id: 'zuerich', name: 'Zürich', land: 'Schweiz', x: .512, y: .295, style: 'swiss', snow: true, landmark: 'grossmuenster', lake: true },
  { id: 'berge', name: 'Zermatt', land: 'Schweiz', x: .51, y: .315, style: 'chalet', snow: true, landmark: 'matterhorn' },
  { id: 'paris', name: 'Paris', land: 'Frankreich', x: .5, y: .29, style: 'paris', snow: false, landmark: 'eiffel' },
  { id: 'london', name: 'London', land: 'England', x: .495, y: .265, style: 'london', snow: false, landmark: 'bigben' },
  { id: 'newyork', name: 'New York', land: 'USA', x: .29, y: .33, style: 'ny', snow: true, landmark: 'liberty' },
  { id: 'tokio', name: 'Tokio', land: 'Japan', x: .87, y: .36, style: 'tokio', snow: false, landmark: 'pagoda' },
  { id: 'suedpol', name: 'Südpol', land: 'Antarktis', x: .5, y: .93, style: 'polar', snow: true, landmark: 'station' }
];

const M = {};
const mat = (k, o) => M[k] || (M[k] = new THREE.MeshStandardMaterial(o));
function shadeAll(g) { g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
function winTex(cols, rows, lit = .6, base = '#2a2f3a') {
  const c = document.createElement('canvas'); c.width = cols * 16; c.height = rows * 24; const g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const on = Math.random() < lit; g.fillStyle = on ? ['#ffd98a', '#ffe9b8', '#cfe6ff'][Math.floor(Math.random() * 3)] : '#151a24'; g.fillRect(x * 16 + 3, y * 24 + 4, 10, 15); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ---------- Menschen (Eltern im Pyjama) ----------
export function makeHuman(o = {}) {
  const g = new THREE.Group(), pj = new THREE.MeshStandardMaterial({ color: o.pj || 0x5a7ab8, roughness: .9 }), skin = mat('hskin', { color: 0xe8b896, roughness: .6 });
  const legs = []; for (const s of [-1, 1]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.75, 3.6, 4, 10), pj); l.position.set(s * .8, 2.5, 0); g.add(l); legs.push(l); const f = new THREE.Mesh(MD.roundBox(1.1, .6, 2, .25), mat('slipper', { color: 0x8a2a2a, roughness: .9 })); f.position.set(s * .8, .3, .4); g.add(f); }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.6, 3.2, 6, 14), pj); body.position.y = 7; g.add(body);
  const arms = []; for (const s of [-1, 1]) { const a = new THREE.Group(); a.position.set(s * 2.1, 8.4, 0); const m = new THREE.Mesh(new THREE.CapsuleGeometry(.5, 3, 4, 8), pj); m.position.y = -1.8; a.add(m); const h = new THREE.Mesh(new THREE.SphereGeometry(.55, 10, 8), skin); h.position.y = -3.6; a.add(h); g.add(a); arms.push(a); }
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 16), skin); head.position.y = 10.5; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1.42, 20, 16, 0, Math.PI * 2, 0, Math.PI * .55), mat('hair' + (o.hair || 0), { color: [0x3a2414, 0xc89a5a, 0x1a1a1a][o.hair || 0], roughness: .9 })); hair.position.y = 10.6; hair.rotation.x = -.25; g.add(hair);
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6), mat('heye', { color: 0x111111 })); e.position.set(s * .45, 10.7, 1.25); g.add(e); }
  // Taschenlampe mit Lichtkegel
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 1, 10), mat('flash', { color: 0x2a2a2a, metalness: .6, roughness: .4 })); lamp.position.set(2.1, 5, 1.2); lamp.rotation.x = Math.PI / 2; g.add(lamp); arms[1].rotation.x = -1.1;
  const cg = new THREE.ConeGeometry(5, 18, 24, 1, true); cg.translate(0, -9, 0); cg.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.position.set(2.1, 5, 1.6); cone.rotation.x = .28; g.add(cone);
  const spot = new THREE.SpotLight(0xfff0c0, 80, 40, .4, .5, 1.2); spot.position.set(2.1, 5, 1.6); g.add(spot); const tgt = new THREE.Object3D(); tgt.position.set(2.1, 0, 16); g.add(tgt); spot.target = tgt;
  g.userData = { legs, arms, cone, spot, t: 0 };
  return shadeAll(g);
}
export function animateHuman(h, dt, speed) { const u = h.userData; u.t += dt * speed * 1.4; u.legs[0].rotation.x = Math.sin(u.t) * .35 * Math.min(1, speed); u.legs[1].rotation.x = -Math.sin(u.t) * .35 * Math.min(1, speed); u.arms[0].rotation.x = -Math.sin(u.t) * .3; }

// ---------- Katze (kann schlafen, jagen, flüchten) ----------
export function makeCat() {
  const g = new THREE.Group(), fur = new THREE.MeshStandardMaterial({ color: 0xd8823a, roughness: .95 });
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(1, 2.4, 6, 14), fur); b.rotation.z = Math.PI / 2; b.position.y = 1.8; g.add(b);
  const head = new THREE.Group(); head.position.set(2, 2.6, 0); g.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(1, 18, 14), fur));
  const eyes = []; for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.35, .7, 8), fur); e.position.set(0, 1, s * .55); head.add(e); const eye = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshStandardMaterial({ color: 0x9aff6a, emissive: 0x6aff40, emissiveIntensity: 1.5 })); eye.position.set(.85, .2, s * .38); head.add(eye); eyes.push(eye); }
  const legs = []; for (const x of [-1.2, 1.2]) for (const z of [-.5, .5]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.25, 1, 4, 8), fur); l.position.set(x, .6, z); g.add(l); legs.push(l); }
  const tail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(-1.8, 2, 0), new THREE.Vector3(-2.8, 2.6, 0), new THREE.Vector3(-3.2, 4, .4)]), 20, .2, 8), fur); g.add(tail);
  g.userData = { head, eyes, legs, tail, t: 0 };
  return shadeAll(g);
}

// ---------- Schweizer und andere Häuser ----------
function houseStyle(style, i) {
  const r = (a) => a[i % a.length];
  if (style === 'swiss') return { w: 9 + (i % 3), d: 8, h: 6.5, wall: r(['woodCream', 'brick', 'woodCream', 'stone']), roof: r(['roofRed', 'roofDark']), floors: 2 };
  if (style === 'chalet') return { w: 9, d: 8, h: 5.5, wall: 'wood', roof: 'roofDark', floors: 2 };
  if (style === 'paris') return { w: 10, d: 8, h: 10, wall: 'stone', roof: 'roofDark', floors: 3, roofH: 2.4 };
  if (style === 'london') return { w: 8, d: 8, h: 8, wall: 'brick', roof: 'roofDark', floors: 3 };
  if (style === 'tokio') return { w: 8, d: 7, h: 4.5, wall: 'woodCream', roof: 'roofDark', floors: 1 };
  return { w: 8, d: 7, h: 4.2, wall: 'woodCream', roof: 'roofRed', floors: 1 };
}
function tower(h, w, tex) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, w), new THREE.MeshStandardMaterial({ map: tex, roughness: .8, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .7 })); }

// ---------- Wahrzeichen ----------
function landmark(kind) {
  const g = new THREE.Group(); const stone = new THREE.MeshStandardMaterial({ map: MD.T.stone, color: 0xd8d0c0, roughness: .9 });
  if (kind === 'eiffel') {
    const iron = new THREE.MeshStandardMaterial({ color: 0x6a5240, metalness: .5, roughness: .6 });
    const lvl = [[14, 0], [8, 12], [5, 20], [2.4, 34], [.8, 50]];
    for (let i = 0; i < lvl.length - 1; i++) { const [w0, y0] = lvl[i], [w1, y1] = lvl[i + 1]; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const a = new THREE.Vector3(sx * w0 / 2, y0, sz * w0 / 2), b = new THREE.Vector3(sx * w1 / 2, y1, sz * w1 / 2); const len = a.distanceTo(b), m = new THREE.Mesh(new THREE.BoxGeometry(.9 - i * .15, len, .9 - i * .15), iron); m.position.copy(a).lerp(b, .5); m.lookAt(b); m.rotateX(Math.PI / 2); g.add(m); } const plat = new THREE.Mesh(new THREE.BoxGeometry(w1 + 1.2, .6, w1 + 1.2), iron); plat.position.y = y1; g.add(plat); for (let k = 0; k < 6; k++) { const t = k / 6, y = y0 + (y1 - y0) * t, w = w0 + (w1 - w0) * t; const ring = new THREE.Mesh(new THREE.TorusGeometry(w * .7, .12, 4, 4), iron); ring.rotation.set(Math.PI / 2, 0, Math.PI / 4); ring.position.y = y; g.add(ring); } }
    const arch = new THREE.Mesh(new THREE.TorusGeometry(5, .5, 8, 24, Math.PI), iron); arch.position.set(0, 4, 7); g.add(arch); const a2 = arch.clone(); a2.position.z = -7; g.add(a2);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.6, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffc060, emissiveIntensity: 3 })); tip.position.y = 51; g.add(tip); g.userData.blink = tip;
    g.userData.size = 9;
  } else if (kind === 'bigben') {
    const t = new THREE.Mesh(new THREE.BoxGeometry(5, 30, 5), stone); t.position.y = 15; g.add(t);
    const cl = document.createElement('canvas'); cl.width = cl.height = 128; const x = cl.getContext('2d'); x.fillStyle = '#f6eed6'; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = '#1a1208'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 6, 4, 12); } x.fillRect(62, 24, 4, 42); x.fillRect(62, 62, 28, 4); const ct = new THREE.CanvasTexture(cl); ct.colorSpace = THREE.SRGBColorSpace;
    for (let i = 0; i < 4; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), new THREE.MeshStandardMaterial({ map: ct, emissive: 0xffe9b0, emissiveMap: ct, emissiveIntensity: .9 })); const a = i * Math.PI / 2; f.position.set(Math.sin(a) * 2.52, 25, Math.cos(a) * 2.52); f.rotation.y = a; g.add(f); }
    const top = new THREE.Mesh(new THREE.ConeGeometry(3.6, 8, 4), new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: .7 })); top.position.y = 34; top.rotation.y = Math.PI / 4; g.add(top);
    const parl = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 8), stone); parl.position.set(-17, 5, 0); g.add(parl);
    for (let i = 0; i < 8; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.6, 3, 4), stone); sp.position.set(-30 + i * 3.6, 11.5, 3.6); g.add(sp); }
    g.userData.size = 4;
  } else if (kind === 'liberty') {
    const green = new THREE.MeshStandardMaterial({ color: 0x5fa88c, roughness: .6, metalness: .2 });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(5, 6, 14, 8), stone); ped.position.y = 7; g.add(ped);
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.6, 12, 16), green); robe.position.y = 20; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 12), green); head.position.y = 27.2; g.add(head);
    for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(.2, 1.4, 6), green); const a = -1.2 + i * .4; sp.position.set(Math.sin(a) * 1.1, 28.4, Math.cos(a) * 1.1); sp.rotation.set(Math.cos(a) * .6, 0, -Math.sin(a) * .6); g.add(sp); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(.45, .5, 7, 10), green); arm.position.set(1.4, 28, 0); arm.rotation.z = -.15; g.add(arm);
    const torch = new THREE.Mesh(new THREE.ConeGeometry(.7, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0xffd060, emissive: 0xffa020, emissiveIntensity: 3 })); torch.position.set(1.9, 32, 0); g.add(torch); g.userData.blink = torch;
    const book = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, .4), green); book.position.set(-1.6, 21, 1); g.add(book);
    g.userData.size = 6;
  } else if (kind === 'grossmuenster') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 10), stone); body.position.y = 6; g.add(body);
    for (const x of [-4.5, 4.5]) { const t = new THREE.Mesh(new THREE.BoxGeometry(5, 26, 5), stone); t.position.set(x, 13, 4); g.add(t); const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: .4, roughness: .5 })); dome.position.set(x, 26, 4); dome.scale.y = 1.6; g.add(dome); const tip = new THREE.Mesh(new THREE.ConeGeometry(.4, 2.5, 8), mat('gold2', { color: 0xd8a62a, metalness: .9, roughness: .3 })); tip.position.set(x, 31, 4); g.add(tip); }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(9, 5, 4), new THREE.MeshStandardMaterial({ color: 0x5a3a2a })); roof.position.y = 14.5; roof.rotation.y = Math.PI / 4; roof.scale.z = .7; g.add(roof);
    g.userData.size = 9;
  } else if (kind === 'matterhorn') {
    const geo = new THREE.ConeGeometry(40, 90, 5, 8), p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); const k = 1 + Math.sin(i * 3.7) * .12; p.setX(i, p.getX(i) * k + (y + 45) * .12); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a8f9a, roughness: 1, flatShading: true })); m.position.y = 40; g.add(m);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(22, 42, 5, 3), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: .9, flatShading: true })); cap.position.set(6, 66, 0); g.add(cap);
    g.userData.size = 30;
  } else if (kind === 'pagoda') {
    const red = new THREE.MeshStandardMaterial({ color: 0xb8241c, roughness: .7 }), roofm = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: .6 });
    for (let i = 0; i < 5; i++) { const w = 8 - i * 1.2, y = i * 4.2; const f = new THREE.Mesh(new THREE.BoxGeometry(w, 3, w), red); f.position.y = y + 1.5; g.add(f); const r = new THREE.Mesh(new THREE.ConeGeometry(w * .95, 1.6, 4), roofm); r.position.y = y + 3.6; r.rotation.y = Math.PI / 4; g.add(r); }
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, 5, 6), mat('gold2', { color: 0xd8a62a, metalness: .9, roughness: .3 })); spire.position.y = 23.5; g.add(spire);
    const tori = new THREE.Group(); for (const x of [-3, 3]) { const p2 = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, 7, 10), red); p2.position.set(x, 3.5, 0); tori.add(p2); } const tb = new THREE.Mesh(new THREE.BoxGeometry(9, .7, .8), red); tb.position.y = 7.2; tori.add(tb); const tb2 = new THREE.Mesh(new THREE.BoxGeometry(7.5, .4, .5), red); tb2.position.y = 6; tori.add(tb2); tori.position.z = 14; g.add(tori);
    g.userData.size = 5;
  } else if (kind === 'station') {
    const orange = new THREE.MeshStandardMaterial({ color: 0xe8701e, roughness: .6 });
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(MD.roundBox(10, 4, 5, .4), orange); b.position.set(i * 11 - 11, 3.5, 0); g.add(b); for (const x of [-3.5, 3.5]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.25, .25, 1.6, 8), mat('iron2', { color: 0x333333 })); leg.position.set(i * 11 - 11 + x, .8, 0); g.add(leg); } }
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3), new THREE.MeshStandardMaterial({ color: 0xeeeeee, side: THREE.DoubleSide })); dish.position.set(12, 8, 0); dish.rotation.x = -.8; g.add(dish);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 8, 6), mat('iron2', {})); pole.position.set(-16, 4, 4); g.add(pole); const sign = new THREE.Mesh(new THREE.BoxGeometry(1.6, .3, .1), new THREE.MeshStandardMaterial({ color: 0xc4161c })); sign.position.set(-16, 7.5, 4); g.add(sign);
    g.userData.size = 16;
  }
  return shadeAll(g);
}

function penguin() { const g = new THREE.Group(); const blk = mat('pblk', { color: 0x14161c, roughness: .6 }), wht = mat('pwht', { color: 0xf4f4f4, roughness: .7 }); const b = new THREE.Mesh(new THREE.CapsuleGeometry(.45, .7, 6, 12), blk); b.position.y = .9; g.add(b); const belly = new THREE.Mesh(new THREE.SphereGeometry(.42, 14, 10), wht); belly.scale.set(.9, 1.3, .6); belly.position.set(0, .85, .2); g.add(belly); const h = new THREE.Mesh(new THREE.SphereGeometry(.32, 14, 10), blk); h.position.y = 1.7; g.add(h); const beak = new THREE.Mesh(new THREE.ConeGeometry(.08, .3, 8), mat('pbeak', { color: 0xf0a020 })); beak.rotation.x = Math.PI / 2; beak.position.set(0, 1.68, .35); g.add(beak); for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.05, 6, 6), wht); e.position.set(s * .12, 1.78, .27); g.add(e); const w = new THREE.Mesh(new THREE.CapsuleGeometry(.1, .5, 4, 8), blk); w.position.set(s * .48, .95, 0); w.rotation.z = s * .3; g.add(w); const f = new THREE.Mesh(new THREE.BoxGeometry(.25, .06, .35), mat('pbeak', {})); f.position.set(s * .18, .05, .15); g.add(f); } g.userData.p = true; return shadeAll(g); }

// ---------- Stadt bauen ----------
export function buildTown(dest) {
  const scene = new THREE.Scene(), colliders = [], circles = [], houses = [], anim = [], S = dest.style;
  scene.fog = new THREE.FogExp2(dest.snow ? 0x0d1a36 : 0x141a2e, .008);
  const sky = makeSky(); scene.add(sky); anim.push(t => { sky.material.uniforms.uTime.value = t; sky.material.uniforms.uNight.value = S === 'polar' ? .8 : 1; });
  scene.add(new THREE.HemisphereLight(0xa8c4f0, 0x2a3550, 1.1));
  const moon = new THREE.DirectionalLight(0xc8d8ff, 1.4); moon.position.set(30, 60, 20); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, far: 200 }); scene.add(moon);
  const groundMat = dest.snow ? new THREE.MeshStandardMaterial({ map: MD.T.snow, normalMap: MD.T.snowN, roughness: .9 }) : new THREE.MeshStandardMaterial({ color: 0x4a4e58, roughness: .85 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  // Strassen
  const road = new THREE.MeshStandardMaterial({ color: dest.snow ? 0x9aa0ac : 0x2e3038, roughness: .9, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const r of [0, Math.PI / 2]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 180), road); m.rotation.set(-Math.PI / 2, 0, r); m.position.y = .02; m.receiveShadow = true; scene.add(m); }
  if (dest.lake) { const lake = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshStandardMaterial({ color: 0x1a3a5a, roughness: .15, metalness: .3 })); lake.rotation.x = -Math.PI / 2; lake.position.set(0, .03, -95); scene.add(lake); colliders.push({ x: 0, z: -95, hw: 60, hd: 30, ry: 0, top: 999 }); }
  // Häuser entlang der Strassen
  const town = new THREE.Group(); let idx = 0;
  const spots = []; for (const side of [-1, 1]) for (let k = -3; k <= 3; k++) { if (k === 0) continue; spots.push([side * 14, k * 18, side > 0 ? -Math.PI / 2 : Math.PI / 2]); spots.push([k * 18, side * 14, side > 0 ? Math.PI : 0]); }
  for (const [x, z, ry] of spots) {
    if (Math.hypot(x, z) < 22) continue;
    if (S === 'ny' && idx % 3 === 1) { const h = 30 + (idx * 13) % 40, tw = tower(h, 12, winTex(8, Math.floor(h / 3))); tw.material.map.repeat.set(1, 1); tw.position.set(x * 1.15, h / 2, z * 1.15); town.add(tw); colliders.push({ x: x * 1.15, z: z * 1.15, hw: 6.3, hd: 6.3, ry: 0, top: 999 }); idx++; continue; }
    if (S === 'polar') continue;
    const st = houseStyle(S, idx), b = MD.makeBuilding({ ...st, door: idx % 4, seed: idx * 7 + 3, sign: '' });
    b.position.set(x, -.2, z); b.rotation.y = ry; town.add(b);
    colliders.push({ x, z, hw: (st.w + .6) / 2, hd: (st.d + .6) / 2, ry, top: .5 + st.h, roof: { rh: st.roofH || Math.min(st.w, st.d) * .45, half: st.w / 2 + .35 } });
    const dir = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry)), door = new THREE.Vector3(x, 0, z).addScaledVector(dir, st.d / 2 + 1.8);
    houses.push({ pos: door, ry, name: (['Familie Meier', 'Familie Keller', 'Familie Huber', 'Familie Brunner', 'Familie Frei', 'Familie Gerber', 'Familie Moser', 'Familie Baumann'])[idx % 8], variant: idx });
    idx++;
  }
  scene.add(mergeStatic(town));
  // Wahrzeichen
  if (dest.landmark) { const lm = landmark(dest.landmark); const pos = dest.landmark === 'matterhorn' ? [60, -140] : dest.landmark === 'station' ? [0, -30] : [0, -48]; lm.position.set(pos[0], 0, pos[1]); scene.add(lm); colliders.push({ x: pos[0], z: pos[1], hw: lm.userData.size, hd: lm.userData.size, ry: 0, top: 999 }); if (lm.userData.blink) anim.push(t => { lm.userData.blink.material.emissiveIntensity = 2 + Math.sin(t * 3) * 1; }); }
  if (S === 'swiss' && !dest.landmark) { // Dorfkirche
    const ch = MD.makeTower(16, 'roofDark', true); ch.position.set(0, 0, -46); scene.add(ch); const nave = MD.makeBuilding({ w: 10, d: 16, h: 7, wall: 'woodCream', roof: 'roofDark', door: 0, seed: 5 }); nave.position.set(0, -.2, -58); scene.add(nave); colliders.push({ x: 0, z: -52, hw: 6, hd: 12, ry: 0, top: 999 });
  }
  // Strassenlaternen & Bäume
  const props = new THREE.Group();
  for (let k = -4; k <= 4; k++) for (const s of [-1, 1]) { const l = MD.makeLantern(); l.position.set(s * 6, 0, k * 18 + 9); props.add(l); circles.push({ x: s * 6, z: k * 18 + 9, r: .4 }); }
  scene.add(mergeStatic(props));
  const tg = MD.spruceGeometry(4, 8, true), tm = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }), trees = [];
  for (let i = 0; i < 160; i++) { const a = Math.random() * Math.PI * 2, d = 75 + Math.random() * 110; trees.push([Math.cos(a) * d, Math.sin(a) * d]); }
  const im = new THREE.InstancedMesh(tg, tm, trees.length), mm = new THREE.Matrix4(); trees.forEach(([x, z], i) => { mm.makeTranslation(x, 0, z); im.setMatrixAt(i, mm); }); scene.add(im);
  // Weihnachtsbaum in der Mitte
  if (S !== 'polar' && S !== 'tokio') { const xt = MD.makeXmasTree(12); scene.add(xt); circles.push({ x: 0, z: 0, r: 3.2 }); }
  if (S === 'polar') { const pg = []; for (let i = 0; i < 24; i++) { const p = penguin(); p.position.set((Math.random() - .5) * 60, 0, 10 + Math.random() * 40); p.rotation.y = Math.random() * 6; scene.add(p); pg.push(p); } anim.push((t, dt) => pg.forEach((p, i) => { p.rotation.z = Math.sin(t * 6 + i) * .12; p.position.x += Math.sin(p.rotation.y) * dt * .6; p.position.z += Math.cos(p.rotation.y) * dt * .6; if (Math.random() < dt * .2) p.rotation.y += (Math.random() - .5) * 2; if (Math.hypot(p.position.x, p.position.z - 30) > 40) p.rotation.y += Math.PI * dt; })); houses.push({ pos: new THREE.Vector3(0, 0, -23), ry: 0, name: 'Forschungsstation', variant: 99 }); }
  if (dest.snow) { const sn = makeSnowfall(900); scene.add(sn); anim.push((t, dt) => sn.userData.update(dt, 0, 10, t)); }
  // Landeplatz
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.2, .25, 32), new THREE.MeshStandardMaterial({ map: MD.T.stone, roughness: .9 })); pad.position.set(0, .12, 30); scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.7, .08, 8, 48), new THREE.MeshStandardMaterial({ color: 0x9fe6ff, emissive: 0x6fd6ff, emissiveIntensity: 2 })); ring.rotation.x = Math.PI / 2; ring.position.set(0, .3, 30); scene.add(ring);
  // Leuchtende Wichtel-Markierung an den Kinderhäusern
  const marks = houses.map(h => { const m = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 32), new THREE.MeshBasicMaterial({ color: 0x9fffd8, transparent: true, opacity: .8, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(h.pos.x, .06, h.pos.z); scene.add(m); return m; });
  anim.push(t => marks.forEach(m => m.material.opacity = .45 + Math.sin(t * 3) * .3));
  return { scene, colliders, circles, houses, anim, spawn: new THREE.Vector3(3, 0, 30), pad: new THREE.Vector3(0, 0, 30), dest, W: 999, D: 999 };
}

// ---------- Flug-Szene (zwischen den Orten) ----------
export function buildFlight() {
  const scene = new THREE.Scene(); const sky = makeSky(); scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xa8c4f0, 0x2a3550, 1.2));
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const gr = x.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(230,238,255,.9)'); gr.addColorStop(1, 'rgba(230,238,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c), clouds = [];
  for (let i = 0; i < 140; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .55, depthWrite: false })); s.position.set((Math.random() - .5) * 200, -8 - Math.random() * 10, -Math.random() * 400); s.scale.setScalar(20 + Math.random() * 30); scene.add(s); clouds.push(s); }
  const mobil = MD.makeWichtelmobil(); mobil.rotation.y = Math.PI / 2; scene.add(mobil);
  const tick = (t, dt) => { sky.material.uniforms.uTime.value = t; clouds.forEach(s => { s.position.z += dt * 60; if (s.position.z > 30) s.position.z -= 420; }); mobil.position.y = Math.sin(t * 1.5) * .4; mobil.rotation.z = Math.sin(t * .8) * .05; };
  return { scene, mobil, tick };
}

// Welt: Gelände, Himmel, Dorf, Wald, Kollisionen, Kinderhaus
import * as THREE from './three.min.js';
import * as MD from './w3d-models.js?v=8';

// ---------- Rauschen & Gelände ----------
function hash(x, z) { const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, z) { const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz); const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1); return a + (b - a) * sx + (c - a) * sz + (a - b - c + d) * sx * sz; }
function fbm(x, z) { let v = 0, a = .5, f = 1; for (let i = 0; i < 5; i++) { v += vnoise(x * f, z * f) * a; f *= 2; a *= .5; } return v; }
function smooth(a, b, x) { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
export const LAKE = { x: -46, z: 44, r: 13 };
export function H(x, z) {
  const r = Math.hypot(x, z);
  let h = (fbm(x * .02, z * .02) - .5) * 1.2 * smooth(30, 70, r);
  h += Math.pow(smooth(90, 230, r), 1.4) * (30 + fbm(x * .012 + 5, z * .012) * 55);
  const ld = Math.hypot(x - LAKE.x, z - LAKE.z); if (ld < LAKE.r + 4) h = h * smooth(LAKE.r, LAKE.r + 4, ld) - .25 * (1 - smooth(LAKE.r - 1, LAKE.r, ld));
  return h;
}
export function onIce(x, z) { return Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r; }

// Statische Gruppen nach Material zusammenführen (weniger Draw-Calls, flüssiger auf dem Handy)
export function mergeStatic(group) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(), buckets = new Map(), keep = [];
  group.traverse(o => {
    if (!o.isMesh || o.isInstancedMesh || o.userData.keep) return;
    const mat = o.material; if (Array.isArray(mat)) return;
    if (!buckets.has(mat)) buckets.set(mat, []);
    buckets.get(mat).push(o);
  });
  const out = new THREE.Group();
  for (const [mat, meshes] of buckets) {
    const pos = [], nor = [], uv = [];
    for (const m of meshes) {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); if (u) uv.push(u.getX(i), u.getY(i)); else uv.push(0, 0); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; out.add(mesh);
  }
  group.traverse(o => { if (o.userData.keep) keep.push(o); });
  for (const k of keep) { const wp = new THREE.Vector3(), wq = new THREE.Quaternion(), ws = new THREE.Vector3(); k.updateMatrixWorld(); new THREE.Matrix4().multiplyMatrices(inv, k.matrixWorld).decompose(wp, wq, ws); k.position.copy(wp); k.quaternion.copy(wq); k.scale.copy(ws); out.add(k); }
  out.userData = group.userData;
  return out;
}

// ---------- Himmel mit Nordlicht und Sternen ----------
export function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uNight: { value: 1 } },
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vDir; uniform float uTime; uniform float uNight;
      float h(vec3 p){ p=fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
      void main(){
        float y = max(vDir.y, 0.0);
        vec3 nightTop = vec3(0.01,0.02,0.07), nightHor = vec3(0.06,0.11,0.24);
        vec3 dayTop = vec3(0.18,0.32,0.62), dayHor = vec3(0.86,0.62,0.55);
        vec3 col = mix(mix(dayHor, dayTop, pow(y,0.5)), mix(nightHor, nightTop, pow(y,0.45)), uNight);
        // Sterne
        vec3 d = vDir*420.0; float s = h(floor(d)); float star = step(0.9965, s) * smoothstep(0.0, 0.25, y);
        col += vec3(star) * (0.6 + 0.4*sin(uTime*2.0 + s*50.0)) * uNight;
        // Nordlicht: wellige Bänder
        float a = 0.0; vec2 q = vDir.xz / (vDir.y + 0.25);
        for(int i=0;i<3;i++){ float fi=float(i); float band = sin(q.x*1.3 + fi*1.7 + uTime*0.12 + sin(q.y*2.0+uTime*0.2+fi)*1.2) ; a += smoothstep(0.75, 1.0, band) * (0.6 - fi*0.15); }
        float mask = smoothstep(0.08, 0.35, y) * smoothstep(0.95, 0.45, y);
        vec3 aur = mix(vec3(0.1,1.0,0.55), vec3(0.55,0.3,1.0), smoothstep(0.3,0.8,y));
        col += aur * a * mask * 0.55 * uNight;
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(480, 32, 16), mat); sky.frustumCulled = false; sky.renderOrder = -1;
  return sky;
}

// ---------- Schneefall ----------
export function makeSnowfall(n = 2500) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), v = new Float32Array(n);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * 80; p[i * 3 + 1] = Math.random() * 40; p[i * 3 + 2] = (Math.random() - .5) * 80; v[i] = .6 + Math.random() * 1.2; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const x = c.getContext('2d'); const gr = x.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ size: .22, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: .9 }));
  pts.frustumCulled = false; pts.userData.v = v;
  pts.userData.update = (dt, cx, cz, t) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { a[i * 3 + 1] -= v[i] * dt * 1.6; a[i * 3] += Math.sin(t * .7 + i) * dt * .3; if (a[i * 3 + 1] < 0) { a[i * 3 + 1] = 38; a[i * 3] = cx + (Math.random() - .5) * 80; a[i * 3 + 2] = cz + (Math.random() - .5) * 80; } } g.attributes.position.needsUpdate = true; };
  return pts;
}

// ---------- Rauch aus Kaminen ----------
export function makeSmoke(points) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(220,225,235,.55)'); gr.addColorStop(1, 'rgba(220,225,235,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c), grp = new THREE.Group(), puffs = [];
  for (const pt of points) for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); s.userData = { o: pt.clone(), t: i / 6 }; grp.add(s); puffs.push(s); }
  grp.userData.update = dt => { for (const s of puffs) { s.userData.t = (s.userData.t + dt * .12) % 1; const t = s.userData.t; s.position.set(s.userData.o.x + t * 2.5, s.userData.o.y + t * 7, s.userData.o.z + Math.sin(t * 6) * .4); s.scale.setScalar(.8 + t * 3.5); s.material.opacity = (1 - t) * .7; } };
  return grp;
}

// ---------- Das Dorf ----------
export const PLACES = [
  { id: 'schule', name: 'Wichtel-Akademie', x: 0, z: -36, w: 16, d: 10, h: 7, wall: 'brick', roof: 'roofGreen', floors: 2, tower: 1, job: 'school', door: 2 },
  { id: 'baeckerei', name: 'Bäckerei Zimtstern', x: -30, z: -20, w: 10, d: 8, h: 4.6, wall: 'woodRed', roof: 'roofDark', job: 'bake', door: 0 },
  { id: 'werkstatt', name: 'Spielzeug-Werkstatt', x: 31, z: -20, w: 16, d: 11, h: 6, wall: 'wood', roof: 'roofRed', job: 'toy', door: 1 },
  { id: 'post', name: 'Wunschzettel-Post', x: -34, z: 12, w: 9, d: 7, h: 4.5, wall: 'woodBlue', roof: 'roofRed', job: 'post', door: 1 },
  { id: 'stall', name: 'Rentierstall', x: 36, z: 14, w: 14, d: 9, h: 5, wall: 'woodGreen', roof: 'roofDark', job: 'stall', door: 0 },
  { id: 'rathaus', name: 'Rathaus Wichteldorf', x: -14, z: 36, w: 12, d: 9, h: 7, wall: 'stone', roof: 'roofDark', floors: 2, tower: 1, job: 'rathaus', door: 3 },
  { id: 'cafe', name: 'Kakao-Café', x: 15, z: 34, w: 10, d: 8, h: 4.4, wall: 'woodCream', roof: 'roofRed', job: 'cafe', door: 1 },
  { id: 'laden', name: 'Bau-Laden', x: 26, z: 0, w: 8, d: 7, h: 4.2, wall: 'woodGreen', roof: 'roofRed', job: 'build', door: 2, ry: -Math.PI / 2 },
  { id: 'home', name: 'Dein Wichtelhaus', x: -26, z: -2, w: 8, d: 7, h: 4.2, wall: 'wood', roof: 'roofGreen', job: 'home', door: 1, ry: Math.PI / 2 },
  { id: 'bib', name: 'Bibliothek', x: -52, z: -14, w: 10, d: 8, h: 5, wall: 'stone', roof: 'roofGreen', job: 'lib', door: 3 },
  { id: 'arzt', name: 'Wichtel-Doktor', x: 50, z: -6, w: 9, d: 7, h: 4.4, wall: 'woodCream', roof: 'roofGreen', job: 'talk', door: 2 },
];
const HOMES = [[-12, -56], [14, -58], [-40, -44], [42, -42], [-60, 14], [60, 22], [-36, 60], [38, 56], [0, 62], [-62, -30], [62, -28], [24, -46]];
export const PAD = { x: 0, z: 46 };      // Landeplatz Wichtelmobil  (zwischen Rathaus und Café)
export const PORTAL = new THREE.Vector3(0, 34, -150);

export function buildVillage(scene) {
  const colliders = [], circles = [], doors = [], chimneys = [], anim = {};
  const props = new THREE.Group(), town = new THREE.Group();
  const addBox = (x, z, w, d, ry, top = 999, roof = null) => colliders.push({ x, z, hw: w / 2 + .2, hd: d / 2 + .2, ry: ry || 0, top, roof });
  function place(def) {
    let g = MD.makeBuilding({ w: def.w, d: def.d, h: def.h, wall: def.wall, roof: def.roof, sign: def.name, floors: def.floors || 1, door: def.door || 0, seed: def.x * 3 + def.z });
    const ch = g.userData.chimney;
    const ry = def.ry !== undefined ? def.ry : Math.atan2(-def.x, -def.z);
    g.position.set(def.x, H(def.x, def.z) - .2, def.z); g.rotation.y = ry; town.add(g);
    addBox(def.x, def.z, def.w + .3, def.d + .3, ry, g.position.y + .7 + def.h, { rh: Math.min(def.w, def.d) * .45, half: def.w / 2 + .35 });
    const dir = new THREE.Vector3(Math.sin(ry), 0, Math.cos(ry));
    const dp = new THREE.Vector3(def.x, 0, def.z).addScaledVector(dir, def.d / 2 + 1.8);
    doors.push({ ...def, pos: dp, ry });
    if (ch) chimneys.push(ch.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ry).add(g.position));
    // Weg vom Platz zur Tür
    if (def.tower) { const t = MD.makeTower(def.h + 3.5); t.position.copy(g.position).addScaledVector(new THREE.Vector3(Math.cos(ry), 0, -Math.sin(ry)), def.w / 2 + 1.5); t.rotation.y = ry; town.add(t); addBox(t.position.x, t.position.z, 2.8, 2.8, ry); anim.towers = anim.towers || []; anim.towers.push(t); }
    return g;
  }
  PLACES.forEach(place);
  const townLater = () => { const mt = mergeStatic(town); scene.add(mt); };
  // Wohnhäuser der anderen Wichtel
  const walls = ['wood', 'woodRed', 'woodBlue', 'woodGreen', 'woodCream', 'brick'], roofs = ['roofRed', 'roofDark', 'roofGreen'];
  HOMES.forEach(([x, z], i) => place({ id: 'h' + i, name: '', x, z, w: 7 + (i % 3), d: 6 + (i % 2), h: 3.8 + (i % 2) * .6, wall: walls[i % 6], roof: roofs[i % 3], job: null, door: i % 4 }));
  townLater();
  // Dorfplatz mit grossem Weihnachtsbaum
  const plazaMat = new THREE.MeshStandardMaterial({ map: MD.T.stone.clone(), normalMap: MD.T.stoneN.clone(), roughness: .95, polygonOffset: true, polygonOffsetFactor: -2 });
  plazaMat.map.repeat.set(8, 8); plazaMat.map.needsUpdate = true; plazaMat.normalMap.repeat.set(8, 8); plazaMat.normalMap.needsUpdate = true;
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(15, 48), plazaMat); plaza.rotation.x = -Math.PI / 2; plaza.position.y = .04; plaza.receiveShadow = true; scene.add(plaza);
  const snowRing = new THREE.Mesh(new THREE.RingGeometry(14.6, 15.6, 48), new THREE.MeshStandardMaterial({ color: 0xf2f6ff, roughness: .95, polygonOffset: true, polygonOffsetFactor: -3 })); snowRing.rotation.x = -Math.PI / 2; snowRing.position.y = .06; scene.add(snowRing);
  const tree = MD.makeXmasTree(16); scene.add(tree); circles.push({ x: 0, z: 0, r: 4.2 }); anim.tree = tree;
  const gifts = [0xc4161c, 0x2a6ad8, 0x2f8a4e, 0xd8a62a, 0x8a3ad8];
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, gf = MD.makeGift(gifts[i % 5]); gf.position.set(Math.cos(a) * 4.6, 0, Math.sin(a) * 4.6); gf.rotation.y = a * 3; gf.scale.setScalar(1 + (i % 3) * .3); props.add(gf); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, b = MD.makeBench(); b.position.set(Math.cos(a) * 11, 0, Math.sin(a) * 11); b.rotation.y = -a - Math.PI / 2; props.add(b); circles.push({ x: b.position.x, z: b.position.z, r: 1.1, top: .68 }); }
  // Laternen entlang der Wege
  const lampPos = [];
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; lampPos.push([Math.cos(a) * 16.5, Math.sin(a) * 16.5]); }
  for (const d of doors) { const mx = (d.x + 0) / 2, mz = (d.z + 0) / 2; lampPos.push([mx + (d.z > 0 ? 2 : -2), mz]); }
  for (const [x, z] of lampPos) { const l = MD.makeLantern(); l.position.set(x, H(x, z), z); props.add(l); circles.push({ x, z, r: .4, top: H(x, z) + 3.9 }); }
  // Echte Lichter an wenigen Stellen (Rest leuchtet über Emission)
  const lightsAt = [[0, 0, 9, 0xffc070, 30], [-30, -14, 3.5, 0xffb060, 16], [31, -13, 3.5, 0xffb060, 16], [15, 28, 3.5, 0xffb060, 16], [0, -29, 4, 0xffb060, 18], [-14, 30, 3.5, 0xffb060, 14]];
  for (const [x, z, y, c, dist] of lightsAt) { const pl = new THREE.PointLight(c, 40, dist, 1.6); pl.position.set(x, y, z); scene.add(pl); }
  // Wege (getretener Schnee mit Steinen)
  const pathMat = new THREE.MeshStandardMaterial({ map: MD.T.stone.clone(), roughness: .95, color: 0xc8ccd8, polygonOffset: true, polygonOffsetFactor: -1 });
  pathMat.map.repeat.set(1, 6); pathMat.map.needsUpdate = true;
  for (const d of doors) {
    const len = Math.hypot(d.pos.x, d.pos.z) - 14; if (len < 1) continue;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.6, len), pathMat); p.rotation.x = -Math.PI / 2; const holder = new THREE.Group(); holder.add(p);
    holder.position.set(d.pos.x * (14 + len / 2) / (14 + len), .03, d.pos.z * (14 + len / 2) / (14 + len)); holder.rotation.y = Math.atan2(d.pos.x, d.pos.z); p.receiveShadow = true; scene.add(holder);
  }
  // Landeplatz für das Wichtelmobil
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(5, 5.3, .3, 40), new THREE.MeshStandardMaterial({ map: MD.T.stone, roughness: .9 })); pad.position.set(PAD.x, H(PAD.x, PAD.z) + .1, PAD.z); pad.receiveShadow = true; scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(4.6, .08, 8, 60), new THREE.MeshStandardMaterial({ color: 0x9fe6ff, emissive: 0x6fd6ff, emissiveIntensity: 2 })); ring.rotation.x = Math.PI / 2; ring.position.set(PAD.x, pad.position.y + .2, PAD.z); scene.add(ring); anim.padRing = ring;
  // Rentiergehege beim Stall
  const fx = 50, fz = 30;
  const fenceDefs = [[fx, fz - 8, 16, 0], [fx, fz + 8, 16, 0], [fx + 8, fz, 16, Math.PI / 2], [fx - 8, fz - 5, 6, Math.PI / 2], [fx - 8, fz + 5, 6, Math.PI / 2]];
  for (const [x, z, l, r] of fenceDefs) { const f = MD.makeFence(l); f.position.set(x, H(x, z), z); f.rotation.y = r; props.add(f); addBox(x, z, r ? .3 : l, r ? l : .3, 0, H(x, z) + 1.25); }
  anim.reindeer = [];
  for (let i = 0; i < 4; i++) { const r = MD.makeReindeer(); r.position.set(fx - 4 + (i % 2) * 7, H(fx, fz), fz - 4 + Math.floor(i / 2) * 7); r.rotation.y = i * 1.4; r.scale.setScalar(.85); scene.add(r); anim.reindeer.push(r); circles.push({ x: r.position.x, z: r.position.z, r: 1.2 }); }
  for (let i = 0; i < 5; i++) { const hb = MD.makeHay(); hb.position.set(fx - 6 + i * 3, H(fx, fz), fz + 6); hb.rotation.y = i; props.add(hb); }
  // Schneemänner, Kisten, Geschenke verteilt
  [[-8, 20], [20, 16], [-20, -30], [44, -30], [-48, 30]].forEach(([x, z], i) => { const s = MD.makeSnowman(.9 + (i % 2) * .3); s.position.set(x, H(x, z), z); s.rotation.y = i; props.add(s); circles.push({ x, z, r: .8, top: H(x, z) + 3.1 * (.9 + (i % 2) * .3) }); });
  // Kisten-Treppen: damit man auf Dächer springen kann
  [[-36, -16, 1], [-35, -14.6, 2], [24, -12, 1], [25.2, -12.6, 2], [-28, 18, 1], [-27, 19.2, 2], [-39.5, 8, 1], [-38.6, 9.2, 2], [-21, -2, 1], [-20.4, -3.2, 2], [44, 8, 1], [44.8, 9.4, 2], [-34, -30, 1], [9, 30, 1], [10, 29, 2]].forEach(([x, z, n], i) => { for (let k = 0; k < n; k++) { const c = MD.makeCrate(); c.position.set(x, H(x, z) + k * .63, z); c.rotation.y = i + k * .4; props.add(c); } circles.push({ x, z, r: .62, top: H(x, z) + n * .63 }); });
  scene.add(mergeStatic(props));
  // Gefrorener See (Eisbahn)
  const ice = new THREE.Mesh(new THREE.CircleGeometry(LAKE.r, 48), new THREE.MeshStandardMaterial({ map: MD.T.ice, color: 0xbfe6ff, roughness: .08, metalness: .2 })); ice.rotation.x = -Math.PI / 2; ice.position.set(LAKE.x, .02, LAKE.z); ice.receiveShadow = true; scene.add(ice);
  // Wald (instanziert)
  const forestGeo = [MD.spruceGeometry(3, 8, true), MD.spruceGeometry(7, 11, true)], nearGeo = [MD.spruceGeometry(3, 8), MD.spruceGeometry(7, 11)], fmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 });
  const trees = [[], []]; let seed = 1; const rr = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 1400; i++) {
    const a = rr() * Math.PI * 2, d = 70 + Math.pow(rr(), .8) * 170, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - LAKE.x, z - LAKE.z) < LAKE.r + 4) continue;
    if (Math.abs(x) < 10 && z < -60 && z > -150) continue; // Schneise Richtung Portal
    if (Math.hypot(x - 82, z - 30) < 22 || Math.hypot(x + 60, z + 95) < 17) continue; // Markt & Eishöhle
    if (Math.abs(x - 41) < 5 && Math.hypot(x, z) < 100 && z > 30 && z < 34) continue;
    trees[i % 2].push([x, z, .7 + rr() * .7, rr() * 6.28]);
  }
  // ein paar Tannen im Dorf
  [[-18, -14], [18, -12], [-44, 0], [46, 4], [-22, 46], [28, 46], [-6, -48], [8, -48], [-54, -2], [54, 12]].forEach(([x, z], i) => trees[i % 2].push([x, z, .8 + (i % 3) * .15, i]));
  const split = [];
  trees.forEach((list, k) => { split.push([list.filter(t => Math.hypot(t[0], t[1]) < 95), nearGeo[k], true]); split.push([list.filter(t => Math.hypot(t[0], t[1]) >= 95), forestGeo[k], false]); });
  split.forEach(([list, geo, shadow]) => {
    const im = new THREE.InstancedMesh(geo, fmat, list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    list.forEach(([x, z, sc, r], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r); s.setScalar(sc); p.set(x, H(x, z) - .2, z); m.compose(p, q, s); im.setMatrixAt(i, m); if (Math.hypot(x, z) < 120) circles.push({ x, z, r: .7 * sc }); });
    im.castShadow = shadow; im.receiveShadow = true; scene.add(im);
  });
  // Berge im Hintergrund (Fels mit Schnee)
  const rock = new THREE.MeshStandardMaterial({ map: MD.T.stone, color: 0x9aa3b5, roughness: 1, flatShading: true });
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * Math.PI * 2 + .2, d = 330 + (i % 3) * 40, hh = 90 + (i * 37 % 60), g = new THREE.ConeGeometry(60 + (i % 4) * 15, hh, 9, 6);
    const pp = g.attributes.position; for (let k = 0; k < pp.count; k++) { const y = pp.getY(k); if (y < hh / 2 - 1) { pp.setX(k, pp.getX(k) * (1 + (hash(k, i) - .5) * .35)); pp.setZ(k, pp.getZ(k) * (1 + (hash(i, k) - .5) * .35)); } }
    g.computeVertexNormals();
    const mtn = new THREE.Mesh(g, rock); mtn.position.set(Math.cos(a) * d, hh / 2 - 10, Math.sin(a) * d); scene.add(mtn);
    const cap = new THREE.Mesh(new THREE.ConeGeometry((60 + (i % 4) * 15) * .45, hh * .45, 9, 2), new THREE.MeshStandardMaterial({ color: 0xf4f8ff, roughness: .9, flatShading: true })); cap.position.set(mtn.position.x, mtn.position.y + hh * .28, mtn.position.z); scene.add(cap);
  }
  // Portal zur Menschenwelt (Nordlicht-Tor)
  const portal = new THREE.Group(); portal.position.copy(PORTAL);
  const pr = new THREE.Mesh(new THREE.TorusGeometry(9, .6, 16, 80), new THREE.MeshStandardMaterial({ color: 0xa6ffe0, emissive: 0x3cffb0, emissiveIntensity: 2.5 })); portal.add(pr);
  const pf = new THREE.Mesh(new THREE.CircleGeometry(8.6, 60), new THREE.MeshBasicMaterial({ color: 0x7affd0, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false })); portal.add(pf);
  scene.add(portal); anim.portal = portal;
  return { colliders, circles, doors, chimneys, anim };
}

// ---------- Glitzersterne zum Sammeln ----------
export const STAR_SPOTS = [[6, 0, 2], [-20, -40, 1], [44, -12, 1], [-58, 20, 1], [58, 40, 1], [-46, 44, 1.2], [-40, 36, 1], [12, -62, 1], [-30, 70, 1], [40, 70, 1], [82, 0, 2], [-84, -10, 2], [0, -100, 3], [70, -70, 4], [-75, -75, 4], [-100, 40, 5], [100, 50, 5], [30, 20, 1], [-10, 26, 1], [52, 30, 1], [-28, -2, 1], [0, 46, 1.5], [-52, -14, 6.5], [31, -20, 9.5], [0, -36, 11], [-60, -95, 1], [-56, -98, 1.5], [82, 24, 1], [82, 36, 3.2], [-64, -92, 1]];
export function makeStar() {
  const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? .22 : .55, a = i / 10 * Math.PI * 2 + Math.PI / 2; s[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  const g = new THREE.ExtrudeGeometry(s, { depth: .15, bevelEnabled: true, bevelSize: .05, bevelThickness: .05, bevelSegments: 2 }); g.center();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffe28a, emissive: 0xffb820, emissiveIntensity: 1.6, metalness: .6, roughness: .3 }));
}

// ---------- Kinderhaus (Streich-Mission), alles 4x vergrössert, damit der Wichtel klein wirkt ----------
export function buildKidHouse(v = 0) {
  const PAL = [[0xe9e1d2, 0x4a5a78, 0x7a2a2a], [0xd8e6ef, 0x7a3a3a, 0x2a4a6a], [0xefe0c8, 0x2f5a3e, 0x6a3a7a], [0xe6dcef, 0x8a6a3a, 0x2a5a4a], [0xf2e8d8, 0x3a3a48, 0x8a5a2a]][Math.abs(v) % 5];
  const scene = new THREE.Scene(), S = 4, colliders = [], circles = [], spots = {};
  scene.background = new THREE.Color(0x10141f); scene.fog = new THREE.Fog(0x10141f, 60, 160);
  const W = 26 * S / 2, D = 18 * S / 2;   // Innenraum 26 x 18 m (Wohnzimmer, Küche, Eingang)
  const floorMat = new THREE.MeshStandardMaterial({ map: MD.T.wood.clone(), normalMap: MD.T.woodN.clone(), roughness: .55 }); floorMat.map.repeat.set(14, 10); floorMat.map.needsUpdate = true; floorMat.normalMap.repeat.set(14, 10); floorMat.normalMap.needsUpdate = true;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, D * 2), floorMat); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: PAL[0], roughness: .9 }), wallH = 2.6 * S;
  const wall = (x, z, w, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, wallH), wallMat); m.position.set(x, wallH / 2, z); m.rotation.y = rot; m.receiveShadow = true; scene.add(m); };
  wall(0, -D, W * 2, 0); wall(0, D, W * 2, Math.PI); wall(-W, 0, D * 2, Math.PI / 2); wall(W, 0, D * 2, -Math.PI / 2);
  colliders.push({ x: 0, z: -D - .5, hw: W, hd: .5, ry: 0 }, { x: 0, z: D + .5, hw: W, hd: .5, ry: 0 }, { x: -W - .5, z: 0, hw: .5, hd: D, ry: 0 }, { x: W + .5, z: 0, hw: .5, hd: D, ry: 0 });
  // Sockelleiste
  const base = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6 });
  [[0, -D + .15, W * 2, .3], [0, D - .15, W * 2, .3]].forEach(([x, z, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, .5, d), base); b.position.set(x, .25, z); scene.add(b); });
  const fab = c => new THREE.MeshStandardMaterial({ color: c, roughness: .95 });
  const box = (w, h, d, mat, x, y, z, ry = 0, col = true, r = .25) => { const m = new THREE.Mesh(MD.roundBox(w, h, d, Math.min(r, w / 3, h / 3, d / 3)), mat); m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m); if (col) colliders.push({ x, z, hw: w / 2 + .3, hd: d / 2 + .3, ry }); return m; };
  // Sofa
  const sofaM = fab(PAL[1]);
  box(8.5, 1.8, 3.4, sofaM, -18, .9, -26); box(8.5, 3.2, .9, sofaM, -18, 2.2, -27.4, 0, false); box(.9, 2.6, 3.4, sofaM, -22.4, 1.6, -26, 0, false); box(.9, 2.6, 3.4, sofaM, -13.6, 1.6, -26, 0, false);
  for (const x of [-20, -16]) box(2.2, 1.4, 1, fab(0xc4161c), x, 2.6, -26.8, 0, false);
  // Teppich
  const rug = new THREE.Mesh(new THREE.CircleGeometry(9, 48), new THREE.MeshStandardMaterial({ color: PAL[2], roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(-18, .03, -14); scene.add(rug);
  // Weihnachtsbaum im Wohnzimmer
  const xt = MD.makeXmasTree(9); xt.position.set(-44, 0, -28); scene.add(xt); circles.push({ x: -44, z: -28, r: 3.4 });
  for (let i = 0; i < 6; i++) { const gf = MD.makeGift([0xc4161c, 0x2a6ad8, 0xd8a62a][i % 3]); gf.userData.isGift = true; gf.scale.setScalar(2.4); gf.position.set(-44 + Math.cos(i) * 4.5, 0, -28 + Math.sin(i) * 4.5 + 2); scene.add(gf); }
  // Esstisch mit Stühlen und Adventskranz
  const woodM = new THREE.MeshStandardMaterial({ map: MD.T.wood, roughness: .6 });
  const table = new THREE.Group(); const top = new THREE.Mesh(MD.roundBox(9, .4, 5.5, .15), woodM); top.position.y = 3; table.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.18, .14, 3, 10), woodM); l.position.set(sx * 4, 1.5, sz * 2.3); table.add(l); }
  table.position.set(14, 0, -8); table.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(table);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) circles.push({ x: 14 + sx * 4, z: -8 + sz * 2.3, r: .5 });
  const chairs = [];
  [[10.5, -12, 0], [17.5, -12, 0], [10.5, -4, Math.PI], [17.5, -4, Math.PI]].forEach(([x, z, r]) => {
    const c = new THREE.Group(); const seat = new THREE.Mesh(MD.roundBox(2.2, .25, 2.2, .08), woodM); seat.position.y = 2; c.add(seat); const back = new THREE.Mesh(MD.roundBox(2.2, 2.4, .2, .08), woodM); back.position.set(0, 3.2, -1); c.add(back);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 2, 8), woodM); l.position.set(sx * .9, 1, sz * .9); c.add(l); }
    c.position.set(x, 0, z); c.rotation.y = r; c.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(c); chairs.push(c);
  });
  const wreath = new THREE.Group(); const wr = new THREE.Mesh(new THREE.TorusGeometry(1.1, .35, 10, 28), fab(0x1f5a2e)); wr.rotation.x = Math.PI / 2; wreath.add(wr);
  const candles = []; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2, c = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .9, 12), fab(0xb81820)); c.position.set(Math.cos(a) * 1.1, .55, Math.sin(a) * 1.1); wreath.add(c); candles.push(c); }
  wreath.position.set(14, 3.25, -8); scene.add(wreath);
  // Küche: Theke, Kühlschrank, Keksdose
  const kitM = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: .4 });
  box(16, 3.6, 2.6, kitM, 36, 1.8, -32.5, 0, true, .1); const ctop = box(16.4, .3, 2.9, new THREE.MeshStandardMaterial({ color: 0x3a3a40, roughness: .25, metalness: .1 }), 36, 3.75, -32.5, 0, false, .05);
  box(4.6, 9, 3.4, new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: .25, metalness: .4 }), 47, 4.5, -32, 0, true, .2);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, 1.4, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .5, roughness: .05 })); jar.position.set(32, 4.6, -32.5); scene.add(jar);
  const milk = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .4 })); milk.position.set(40, 4.7, -32.5); scene.add(milk);
  // Eingang: Schuhe und Hausschuhe
  const shoes = [];
  [[44, 30, 0x2b2b30], [46.5, 30, 0x2b2b30], [41, 31, 0x8a2a2a], [43, 32, 0x8a2a2a]].forEach(([x, z, c], i) => { const s = new THREE.Mesh(MD.roundBox(1.1, .8, 2.6, .35), fab(c)); s.position.set(x, .4, z); s.rotation.y = (i % 2) * .2; s.castShadow = true; scene.add(s); shoes.push(s); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(4, 8.4), new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: .6 })); door.position.set(44, 4.2, D - .05); door.rotation.y = Math.PI; scene.add(door);
  // Badezimmer-Nische: Toilettenpapier
  box(.4, wallH, 14, wallMat, 30, wallH / 2, 29, 0, true, .05);
  const toilet = new THREE.Group(); const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, .9, 2, 20), kitM); bowl.position.y = 1; toilet.add(bowl); const tank = new THREE.Mesh(MD.roundBox(2.4, 2, 1, .2), kitM); tank.position.set(0, 2.8, -1.1); toilet.add(tank);
  toilet.position.set(24, 0, 33); toilet.traverse(o => { if (o.isMesh) o.castShadow = true; }); scene.add(toilet); circles.push({ x: 24, z: 33, r: 1.4 });
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, 1, 20), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 })); roll.rotation.z = Math.PI / 2; roll.position.set(20.6, 3, 33); scene.add(roll);
  // Kinderzimmer-Tür (dahinter schläft das Kind)
  const kd = new THREE.Mesh(new THREE.PlaneGeometry(4, 8.4), new THREE.MeshStandardMaterial({ color: 0xf6f2ea, roughness: .6 })); kd.position.set(-W + .05, 4.2, 18); kd.rotation.y = Math.PI / 2; scene.add(kd);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2, .8), new THREE.MeshStandardMaterial({ color: 0x7ad0ff, emissive: 0x204060 })); sign.position.set(-W + .07, 6.2, 18); sign.rotation.y = Math.PI / 2; scene.add(sign);
  const kidLight = new THREE.Mesh(new THREE.PlaneGeometry(4, .25), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0 })); kidLight.position.set(-W + .08, .15, 18); kidLight.rotation.y = Math.PI / 2; scene.add(kidLight);
  // Wichteltür an der Wand (Start und Ziel)
  const wd = new THREE.Group(); const fr = new THREE.Mesh(MD.roundBox(2.6, 3.6, .4, .15), new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: .5 })); fr.position.y = 1.8; wd.add(fr);
  const wdoor = new THREE.Mesh(MD.roundBox(2, 3, .2, .1), new THREE.MeshStandardMaterial({ map: MD.T.wood, roughness: .6 })); wdoor.position.set(0, 1.6, .2); wd.add(wdoor);
  const wl = new THREE.Mesh(new THREE.SphereGeometry(.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb04a, emissiveIntensity: 2.5 })); wl.position.set(1.6, 3.5, .3); wd.add(wl);
  wd.position.set(-4, 0, -D + .3); scene.add(wd);
  // Fenster mit Mondlicht
  const win = new THREE.Mesh(new THREE.PlaneGeometry(10, 7), new THREE.MeshBasicMaterial({ color: 0x1a2a50 })); win.position.set(0, 6, D - .06); win.rotation.y = Math.PI; scene.add(win);
  // Licht: Mond, Baumlichter, Nachtlicht
  scene.add(new THREE.HemisphereLight(0x6a86c8, 0x2a2018, 1.7));
  const lampL = new THREE.PointLight(0xffc080, 90, 45, 1.4); lampL.position.set(-24, 9, -20); scene.add(lampL);
  const kitL = new THREE.PointLight(0xbfd4ff, 60, 40, 1.4); kitL.position.set(36, 9, -24); scene.add(kitL);
  const hallL = new THREE.PointLight(0xffd8a0, 50, 40, 1.4); hallL.position.set(36, 9, 26); scene.add(hallL);
  const moon = new THREE.DirectionalLight(0x9ab8ff, 1.2); moon.position.set(10, 30, 50); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -60, right: 60, top: 40, bottom: -40, far: 140 }); scene.add(moon);
  const tl = new THREE.PointLight(0xffb060, 120, 40, 1.5); tl.position.set(-44, 6, -26); scene.add(tl);
  const nl = new THREE.PointLight(0xffd8a0, 30, 25, 1.5); nl.position.set(14, 4, -8); scene.add(nl);
  // Streich-Orte
  spots.milch = { name: 'Milch blau färben', pos: new THREE.Vector3(40, 0, -29.5), done: (sc) => { milk.material.color.set(0x3a7aff); } };
  spots.stuehle = { name: 'Stühle umdrehen', pos: new THREE.Vector3(14, 0, -15), done: () => { chairs.forEach(c => { c.rotation.z = Math.PI; c.position.y = 4.2; }); } };
  spots.kranz = { name: 'Rüebli statt Kerzen auf den Adventskranz', pos: new THREE.Vector3(14, 0, -1.5), done: () => { candles.forEach(c => { c.material = new THREE.MeshStandardMaterial({ color: 0xe8701e }); c.geometry = new THREE.ConeGeometry(.2, 1, 10); c.rotation.x = Math.PI; }); } };
  spots.schuhe = { name: 'Nüsse in die Hausschuhe legen', pos: new THREE.Vector3(42, 0, 27.5), done: () => { shoes.forEach(s => { for (let i = 0; i < 3; i++) { const n = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8a5a2a })); n.position.set(s.position.x + (i - 1) * .3, .9, s.position.z); scene.add(n); } }); } };
  spots.klopapier = { name: 'Klopapier-Girlande aufhängen', pos: new THREE.Vector3(22, 0, 28), done: () => { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(20.6, 3, 33), new THREE.Vector3(24, 6, 30), new THREE.Vector3(27, 4, 26), new THREE.Vector3(29.6, 7, 23)]); const tp = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .25, 6), new THREE.MeshStandardMaterial({ color: 0xffffff })); scene.add(tp); } };
  spots.kekse = { name: 'Kekse naschen und Krümel verteilen', pos: new THREE.Vector3(32, 0, -29.5), done: () => { for (let i = 0; i < 14; i++) { const k = new THREE.Mesh(new THREE.SphereGeometry(.1 + Math.random() * .08, 6, 5), new THREE.MeshStandardMaterial({ color: 0xc8904a })); k.position.set(30 + Math.random() * 5, 3.95, -33 + Math.random() * 1.6); scene.add(k); } jar.scale.y = .6; } };
  spots.brief = { name: 'Brief an die Wichteltür legen', pos: new THREE.Vector3(-4, 0, -D + 3.4), done: () => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.2, .8), new THREE.MeshStandardMaterial({ color: 0xfff6e0, side: THREE.DoubleSide })); b.rotation.x = -Math.PI / 2; b.position.set(-2.4, .05, -D + 2.4); scene.add(b); } };
  spots.geschenk = { name: 'Geschenke unter dem Baum vertauschen', pos: new THREE.Vector3(-38, 0, -22), done: () => { scene.children.filter(o => o.userData.isGift).forEach(g => g.rotation.y += 1); } };
  // Vorhang am Fenster (Versteck)
  const cur = new THREE.Mesh(new THREE.PlaneGeometry(6, wallH - .5, 12, 1), new THREE.MeshStandardMaterial({ color: PAL[1], roughness: 1, side: THREE.DoubleSide })); const cp = cur.geometry.attributes.position; for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 2.2) * .35); cur.geometry.computeVertexNormals(); cur.position.set(7, (wallH - .5) / 2, D - 1); cur.rotation.y = Math.PI; scene.add(cur);
  const hides = [{ x: 14, z: -8, r: 2.6, n: 'unter dem Tisch' }, { x: 7, z: D - 2, r: 2.6, n: 'hinter dem Vorhang' }, { x: -40, z: -24, r: 2.6, n: 'unter dem Weihnachtsbaum' }, { x: 51, z: -28, r: 2.2, n: 'neben dem Kühlschrank' }, { x: -18, z: -22.6, r: 2.4, n: 'im Schatten vom Sofa' }];
  const parentPath = [[-W + 4, 18], [-30, 10], [-20, -14], [0, -10], [14, -16], [30, -24], [40, 0], [20, 24], [-10, 22], [-W + 4, 18]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  return { hides, parentPath, scene, colliders, circles, spots, start: new THREE.Vector3(-4, 0, -D + 3), exit: new THREE.Vector3(-4, 0, -D + 2.2), kidDoor: new THREE.Vector3(-W + 2, 0, 18), kidLight, W, D };
}

// ---------- Begehbare Häuser (Innenräume) ----------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
export function buildInterior(type, name) {
  const scene = new THREE.Scene(), colliders = [], circles = [], W2 = 9, D2 = 7, HH = 4.2;
  scene.background = new THREE.Color(0x1a120c); scene.fog = new THREE.Fog(0x1a120c, 20, 40);
  const floorMat = new THREE.MeshStandardMaterial({ map: MD.T.wood.clone(), roughness: .6 }); floorMat.map.repeat.set(5, 4); floorMat.map.needsUpdate = true;
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, D2 * 2), floorMat); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; scene.add(fl);
  const wallKey = { baeckerei: 'brick', werkstatt: 'wood', schule: 'woodCream', post: 'woodBlue', cafe: 'woodCream', bib: 'wood', home: 'woodRed' }[type] || 'wood';
  const wm = new THREE.MeshStandardMaterial({ map: MD.T[wallKey].clone(), roughness: .85 }); wm.map.repeat.set(4, 1.4); wm.map.needsUpdate = true;
  const wall = (x, z, w, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, HH), wm); m.position.set(x, HH / 2, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); };
  wall(0, -D2, W2 * 2, 0); wall(0, D2, W2 * 2, Math.PI); wall(-W2, 0, D2 * 2, Math.PI / 2); wall(W2, 0, D2 * 2, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W2 * 2, D2 * 2), new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: .9 })); ceil.rotation.x = Math.PI / 2; ceil.position.y = HH; scene.add(ceil);
  for (let x = -W2 + 1.5; x < W2; x += 3) { const b = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, D2 * 2), new THREE.MeshStandardMaterial({ color: 0x3a2414 })); b.position.set(x, HH - .15, 0); scene.add(b); }
  colliders.push({ x: 0, z: -D2 - .5, hw: W2, hd: .5, ry: 0 }, { x: 0, z: D2 + .5, hw: W2, hd: .5, ry: 0 }, { x: -W2 - .5, z: 0, hw: .5, hd: D2, ry: 0 }, { x: W2 + .5, z: 0, hw: .5, hd: D2, ry: 0 });
  const wood = new THREE.MeshStandardMaterial({ map: MD.T.wood, roughness: .7 }), dark = new THREE.MeshStandardMaterial({ color: 0x3a2414, roughness: .8 });
  const add = (mesh, x, y, z, ry = 0, col = true, hw, hd) => { mesh.position.set(x, y, z); mesh.rotation.y = ry; mesh.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(mesh); if (col) colliders.push({ x, z, hw: hw || .6, hd: hd || .6, ry }); return mesh; };
  const box = (w, h, d, mat, r = .06) => new THREE.Mesh(MD.roundBox(w, h, d, Math.min(r, w / 3, h / 3, d / 3)), mat);
  // Tür (Ausgang) vorne
  const door = box(1.6, 2.6, .15, new THREE.MeshStandardMaterial({ color: 0x5a2e18, roughness: .6 })); door.position.set(0, 1.3, D2 - .08); scene.add(door);
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.2), new THREE.MeshStandardMaterial({ color: 0x8a1e1e, roughness: 1 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, .02, D2 - 1); scene.add(mat);
  // Fenster mit Nordlicht draussen
  const sky = canvasTex(128, 96, g => { const gr = g.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, '#061030'); gr.addColorStop(1, '#1f4a70'); g.fillStyle = gr; g.fillRect(0, 0, 128, 96); g.fillStyle = 'rgba(80,255,170,.35)'; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(40, 10, 80, 50, 128, 20); g.lineTo(128, 34); g.bezierCurveTo(80, 64, 40, 24, 0, 54); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 25; i++) g.fillRect(Math.random() * 128, Math.random() * 50, 1, 1); });
  for (const x of [-5, 5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.4), new THREE.MeshBasicMaterial({ map: sky })); w.position.set(x, 2.3, -D2 + .02); scene.add(w); const fr = box(2, .12, .2, dark); fr.position.set(x, 1.55, -D2 + .1); scene.add(fr); }
  // Licht
  scene.add(new THREE.HemisphereLight(0xffe2c0, 0x3a2414, 1.1));
  const lamp = new THREE.PointLight(0xffc080, 40, 26, 1.3); lamp.position.set(0, HH - .6, 0); scene.add(lamp);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.25, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffc060, emissiveIntensity: 3 })); bulb.position.copy(lamp.position); scene.add(bulb);
  let station = new THREE.Vector3(0, 0, -3), stationLabel = 'Arbeiten', host = new THREE.Vector3(3, 0, -3.5), anim = [];
  if (type === 'baeckerei') {
    const oven = new THREE.Group(); const body = box(3.2, 2.6, 2, new THREE.MeshStandardMaterial({ map: MD.T.brick, roughness: .9 }), .2); body.position.y = 1.3; oven.add(body); const mouth = new THREE.Mesh(new THREE.CircleGeometry(.6, 24, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xff7a20, emissive: 0xff5a10, emissiveIntensity: 2.5 })); mouth.position.set(0, .9, 1.01); oven.add(mouth); anim.push(t => { mouth.material.emissiveIntensity = 2 + Math.sin(t * 9) * .6 + Math.sin(t * 23) * .3; });
    const fire = new THREE.PointLight(0xff6a20, 12, 8, 1.5); fire.position.set(0, 1, 1.6); oven.add(fire); add(oven, 0, 0, -5.8, 0, true, 1.7, 1.1);
    station.set(0, 0, -3.6); stationLabel = 'Plätzchen in den Ofen schieben';
    const counter = box(5, 1.1, 1.2, wood); add(counter, 4.5, .55, 1, 0, true, 2.6, .7);
    for (let i = 0; i < 8; i++) { const br = new THREE.Mesh(new THREE.CapsuleGeometry(.18, .5, 4, 10), new THREE.MeshStandardMaterial({ color: 0xc98a3a, roughness: .7 })); br.rotation.z = Math.PI / 2; br.position.set(2.6 + i * .5, 1.3, 1 + (i % 2) * .25); scene.add(br); }
    for (const z of [-3, 0, 3]) { const sh = box(.6, 2.8, 2.2, wood); add(sh, -8.4, 1.4, z, 0, true, .4, 1.2); for (let k = 0; k < 3; k++) { const ck = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .06, 14), new THREE.MeshStandardMaterial({ color: 0xb8742a })); ck.position.set(-8.1, .7 + k * .8, z); scene.add(ck); } }
    const flour = new THREE.Mesh(new THREE.CylinderGeometry(.5, .45, 1, 14), new THREE.MeshStandardMaterial({ color: 0xe8dcc0, roughness: 1 })); add(flour, 3, .5, -5.5, 0, true, .5, .5);
  } else if (type === 'werkstatt') {
    for (const [x, z] of [[-4, -3], [4, -3], [-4, 2], [4, 2]]) { const bench = new THREE.Group(); const top = box(3, .15, 1.4, wood); top.position.y = 1; bench.add(top); for (const sx of [-1.3, 1.3]) for (const sz of [-.55, .55]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.12, 1, .12), dark); l.position.set(sx, .5, sz); bench.add(l); } const toy = MD.makeGift([0xc4161c, 0x2a6ad8, 0xd8a62a, 0x2f8a4e][(x + z + 20) % 4]); toy.position.set(.6, 1.08, 0); bench.add(toy); const train = box(.7, .4, .3, new THREE.MeshStandardMaterial({ color: 0x2a6ad8, roughness: .4 })); train.position.set(-.6, 1.3, 0); bench.add(train); add(bench, x, 0, z, 0, true, 1.6, .8); }
    station.set(0, 0, -3); stationLabel = 'Spielzeug zusammenbauen';
    const rack = box(6, 2.5, .3, dark); add(rack, 0, 1.25, -6.7, 0, true, 3, .3);
    for (let i = 0; i < 6; i++) { const tool = new THREE.Mesh(new THREE.BoxGeometry(.08, .7, .08), new THREE.MeshStandardMaterial({ color: 0x9aa3b5, metalness: .8, roughness: .3 })); tool.position.set(-2.5 + i, 1.6, -6.5); scene.add(tool); }
    const belt = box(8, .5, 1, new THREE.MeshStandardMaterial({ color: 0x2b2b30, roughness: .6 })); add(belt, 0, .6, 5, 0, true, 4, .6);
    const gifts = []; for (let i = 0; i < 6; i++) { const g = MD.makeGift([0xc4161c, 0x2a6ad8, 0xd8a62a][i % 3]); g.scale.setScalar(.7); g.position.set(-4 + i * 1.5, .85, 5); scene.add(g); gifts.push(g); } anim.push((t, dt) => gifts.forEach(g => { g.position.x += dt * .8; if (g.position.x > 4) g.position.x = -4; }));
  } else if (type === 'schule') {
    const board = new THREE.Mesh(new THREE.PlaneGeometry(6, 2.2), new THREE.MeshStandardMaterial({ map: canvasTex(512, 188, g => { g.fillStyle = '#1f3a2a'; g.fillRect(0, 0, 512, 188); g.fillStyle = '#e9f1e0'; g.font = '30px Georgia'; g.fillText('Regel 1: Nie erwischen lassen!', 20, 50); g.fillText('7 × 8 = 56', 20, 100); g.fillText('Nordpol = 90° Nord', 20, 150); }), roughness: .9 }));
    board.position.set(0, 2.3, -D2 + .05); scene.add(board);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const desk = new THREE.Group(); const top = box(1.3, .1, .8, wood); top.position.y = .8; desk.add(top); const l = new THREE.Mesh(new THREE.BoxGeometry(.1, .8, .6), dark); l.position.set(0, .4, 0); desk.add(l); const book = box(.4, .08, .3, new THREE.MeshStandardMaterial({ color: [0xc4161c, 0x2a6ad8, 0x2f8a4e][(r + c) % 3] }), .02); book.position.set(.2, .9, 0); desk.add(book); add(desk, -4.5 + c * 3, 0, -1 + r * 2.2, 0, true, .7, .45); }
    station.set(0, 0, -4); stationLabel = 'Unterricht beginnen';
    const globe = new THREE.Mesh(new THREE.SphereGeometry(.45, 20, 14), new THREE.MeshStandardMaterial({ color: 0x3a7ad8, roughness: .5 })); globe.position.set(6, 1.4, -5); scene.add(globe); anim.push((t, dt) => { globe.rotation.y += dt * .5; });
  } else if (type === 'post') {
    for (let i = 0; i < 6; i++) { const sack = new THREE.Mesh(new THREE.SphereGeometry(.6, 14, 10), new THREE.MeshStandardMaterial({ color: 0x8a6a3e, roughness: 1 })); sack.scale.set(1, 1.2, 1); sack.position.set(-7 + i * .9, .6, -5.5 + (i % 2) * .6); scene.add(sack); }
    circles.push({ x: -5, z: -5.3, r: 2.6 });
    const shelf = box(.5, 3, 8, wood); add(shelf, 8.4, 1.5, 0, 0, true, .4, 4);
    for (let i = 0; i < 30; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, .3, .45), new THREE.MeshStandardMaterial({ color: 0xfff6e0 })); l.position.set(8.1, .5 + (i % 5) * .55, -3.5 + Math.floor(i / 5) * 1.3); scene.add(l); }
    const desk = box(4, 1.1, 1.4, wood); add(desk, 0, .55, -3.5, 0, true, 2.1, .8); station.set(0, 0, -2); stationLabel = 'Wunschzettel sortieren';
  } else if (type === 'cafe') {
    const counter = box(6, 1.1, 1.2, wood); add(counter, 0, .55, -5, 0, true, 3.1, .7); station.set(0, 0, -3.6); stationLabel = 'Bestellen';
    for (const [x, z] of [[-5, 0], [5, 0], [-5, 4], [5, 4], [0, 2]]) { const t = new THREE.Group(); const top = new THREE.Mesh(new THREE.CylinderGeometry(.7, .7, .08, 20), wood); top.position.y = .8; t.add(top); const leg = new THREE.Mesh(new THREE.CylinderGeometry(.08, .1, .8, 8), dark); leg.position.y = .4; t.add(leg); const cup = new THREE.Mesh(new THREE.CylinderGeometry(.1, .08, .18, 12), new THREE.MeshStandardMaterial({ color: 0xffffff })); cup.position.set(.2, .93, 0); t.add(cup); add(t, x, 0, z, 0, false); circles.push({ x, z, r: .8 }); }
    const steam = []; for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .3 })); scene.add(s); steam.push(s); } anim.push(t => steam.forEach((s, i) => { const k = (t * .5 + i / 3) % 1; s.position.set(.2 + Math.sin(k * 6) * .05, 1.05 + k * .8, 2); s.material.opacity = .35 * (1 - k); s.scale.setScalar(1 + k * 2); }));
  } else if (type === 'bib') {
    for (let i = 0; i < 4; i++) { const sh = new THREE.Group(); const fr = box(4, 3.4, .5, dark); fr.position.y = 1.7; sh.add(fr); for (let r = 0; r < 4; r++) for (let k = 0; k < 14; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(.2, .55 + (k % 3) * .08, .35), new THREE.MeshStandardMaterial({ color: [0x8a1e1e, 0x1f4a7a, 0x2f6a3e, 0xb8862a, 0x5a3a7a][(k + r + i) % 5], roughness: .8 })); b.position.set(-1.6 + k * .24, .55 + r * .8, .2); sh.add(b); } add(sh, -6 + (i % 2) * 12, 0, -2.5 + Math.floor(i / 2) * 5, Math.PI / 2 * (i % 2 ? -1 : 1), true, .4, 2.1); }
    const desk = box(3, .9, 1.4, wood); add(desk, 0, .45, -4, 0, true, 1.6, .8); station.set(0, 0, -2.6); stationLabel = 'Wichtel-Wissen lesen';
  } else if (type === 'home') {
    const bed = new THREE.Group(); const fr = box(2, .5, 3, wood); fr.position.y = .25; bed.add(fr); const mat2 = box(1.8, .3, 2.8, new THREE.MeshStandardMaterial({ map: MD.T.knit, roughness: 1 })); mat2.position.y = .6; bed.add(mat2); const pil = box(1.2, .25, .5, new THREE.MeshStandardMaterial({ color: 0xffffff }), .12); pil.position.set(0, .85, -1.1); bed.add(pil); add(bed, -6.5, 0, -4.5, 0, true, 1.1, 1.6);
    const fp = new THREE.Group(); const st = box(2.6, 2.4, 1, new THREE.MeshStandardMaterial({ map: MD.T.stone, roughness: .9 }), .1); st.position.y = 1.2; fp.add(st); const fire = new THREE.Mesh(new THREE.ConeGeometry(.35, .8, 8), new THREE.MeshStandardMaterial({ color: 0xff7a20, emissive: 0xff5a10, emissiveIntensity: 3 })); fire.position.set(0, .7, .45); fp.add(fire); const fl2 = new THREE.PointLight(0xff7a30, 14, 9, 1.5); fl2.position.set(0, 1, 1.2); fp.add(fl2); add(fp, 4, 0, -6.3, 0, true, 1.4, .6); anim.push(t => { fire.scale.y = 1 + Math.sin(t * 11) * .2; fl2.intensity = 12 + Math.sin(t * 17) * 3; });
    const ward = box(2, 3, .9, new THREE.MeshStandardMaterial({ map: MD.T.woodRed, roughness: .8 })); add(ward, 7.5, 1.5, -3, -Math.PI / 2, true, .5, 1.1); station.set(6, 0, -3); stationLabel = 'Kleiderschrank öffnen';
    const rug = new THREE.Mesh(new THREE.CircleGeometry(2, 32), new THREE.MeshStandardMaterial({ color: 0x2a5a3a, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, .02, 0); scene.add(rug);
  }
  // leuchtender Ring an der Arbeitsstelle
  const ring = new THREE.Mesh(new THREE.RingGeometry(.7, .9, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .8, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(station.x, .04, station.z); scene.add(ring); anim.push(t => { ring.material.opacity = .5 + Math.sin(t * 4) * .3; });
  // Namensschild innen
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, .8), new THREE.MeshStandardMaterial({ map: canvasTex(512, 128, g => { g.fillStyle = '#2b1a0e'; g.fillRect(0, 0, 512, 128); g.strokeStyle = '#ffd27a'; g.lineWidth = 6; g.strokeRect(6, 6, 500, 116); g.fillStyle = '#ffd27a'; g.font = 'bold 54px Georgia'; g.textAlign = 'center'; g.fillText(name, 256, 84); }), roughness: .6 }));
  sign.position.set(0, 3.5, -D2 + .06); scene.add(sign);
  return { scene, colliders, circles, W: W2, D: D2, spawn: new THREE.Vector3(0, 0, D2 - 3.2), exit: new THREE.Vector3(0, 0, D2 - .6), station, stationLabel, host, anim };
}

// ---------- Neues Gebiet: Weihnachtsmarkt und Eishöhle ----------
export function buildRegions(scene, colliders, circles) {
  const anim = [];
  // Weihnachtsmarkt im Osten
  const MX = 82, MZ = 30, stands = [];
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * Math.PI * 2, x = MX + Math.cos(a) * 13, z = MZ + Math.sin(a) * 13;
    const g = new THREE.Group(), wood = new THREE.MeshStandardMaterial({ map: MD.T.wood, roughness: .8 });
    const hut = new THREE.Mesh(MD.roundBox(3.6, 2.4, 2.4, .08), wood); hut.position.y = 1.2; g.add(hut);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3, 1.4, 4), new THREE.MeshStandardMaterial({ color: [0xa8141a, 0x2a5a3a, 0x2a3e6a][i % 3], roughness: .8 })); roof.position.y = 3.1; roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, .75); g.add(roof);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(2.6, .7, 4), new THREE.MeshStandardMaterial({ color: 0xf6f9ff, roughness: .95 })); sn.position.y = 3.55; sn.rotation.y = Math.PI / 4; sn.scale.set(1, 1, .75); g.add(sn);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1), new THREE.MeshStandardMaterial({ color: 0x553311, emissive: 0xffb060, emissiveIntensity: 1.2 })); win.position.set(0, 1.5, 1.21); g.add(win);
    const lights = new THREE.Mesh(new THREE.TorusGeometry(1.9, .04, 6, 30, Math.PI), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: [0xffd27a, 0xff6a6a, 0x7ad0ff][i % 3], emissiveIntensity: 3 })); lights.position.set(0, 2.4, 1.25); g.add(lights);
    g.position.set(x, H(x, z), z); g.rotation.y = Math.atan2(MX - x, MZ - z); g.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); scene.add(g);
    colliders.push({ x, z, hw: 1.9, hd: 1.3, ry: g.rotation.y, top: g.position.y + 2.4 }); stands.push(g);
  }
  const mtree = MD.makeXmasTree(9); mtree.position.set(MX, H(MX, MZ), MZ); scene.add(mtree); circles.push({ x: MX, z: MZ, r: 2.6 });
  const mlight = new THREE.PointLight(0xffc070, 40, 30, 1.5); mlight.position.set(MX, 7, MZ); scene.add(mlight);
  const garl = new THREE.Group(); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, b = (i + 1) / 10 * Math.PI * 2; const c = new THREE.CatmullRomCurve3([new THREE.Vector3(Math.cos(a) * 13, 3.6, Math.sin(a) * 13), new THREE.Vector3(Math.cos((a + b) / 2) * 7, 5.5, Math.sin((a + b) / 2) * 7), new THREE.Vector3(0, 8.5, 0)]); const t = new THREE.Mesh(new THREE.TubeGeometry(c, 24, .04, 5), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffe0a0, emissiveIntensity: 2.5 })); garl.add(t); }
  garl.position.set(MX, H(MX, MZ), MZ); scene.add(garl);
  // Eishöhle im Norden (an der Schneise zum Tor)
  const CX = -60, CZ = -95, cave = new THREE.Group();
  const rock = new THREE.MeshStandardMaterial({ map: MD.T.stone, color: 0xb0c4dc, roughness: .9, side: THREE.DoubleSide, flatShading: true });
  const dome = new THREE.SphereGeometry(12, 20, 12, .32, Math.PI * 2 - .64, 0, Math.PI / 2), dp = dome.attributes.position; for (let i = 0; i < dp.count; i++) { const k = 1 + (Math.sin(i * 12.9898) * 43758.5 % 1) * .12; dp.setXYZ(i, dp.getX(i) * k, dp.getY(i) * k, dp.getZ(i) * k); } dome.computeVertexNormals();
  const dm = new THREE.Mesh(dome, rock); dm.scale.set(1, .7, 1); cave.add(dm);
  const opening = new THREE.Mesh(new THREE.CircleGeometry(3.6, 24), new THREE.MeshBasicMaterial({ color: 0x02040a })); cave.add(opening);
  const crystals = []; const cm = new THREE.MeshStandardMaterial({ color: 0x9ff0ff, emissive: 0x3ac8ff, emissiveIntensity: 1.4, roughness: .1, metalness: .1, transparent: true, opacity: .9 });
  for (let i = 0; i < 26; i++) { const a = i * 2.39, r = 4 + (i % 5) * 1.5, cr = new THREE.Mesh(new THREE.OctahedronGeometry(.4 + (i % 4) * .25, 0), cm); cr.scale.y = 2.2; cr.position.set(Math.cos(a) * r, .6 + (i % 3) * .2, Math.sin(a) * r); cr.rotation.set(Math.sin(i) * .4, i, Math.cos(i) * .4); cave.add(cr); crystals.push(cr); }
  const cl = new THREE.PointLight(0x6ad8ff, 30, 22, 1.4); cl.position.set(0, 4, 0); cave.add(cl);
  const toV = Math.atan2(-CX, -CZ);
  cave.position.set(CX, H(CX, CZ) - .2, CZ); cave.rotation.y = toV + Math.PI / 2; scene.add(cave); cave.updateMatrixWorld(true);
  // Kollisionsring um die Höhle (mit Eingang Richtung Dorf)
  for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; let d = Math.abs(((a - toV + Math.PI * 3) % (Math.PI * 2)) - Math.PI); if (d < .3) continue; circles.push({ x: CX + Math.sin(a) * 11.6, z: CZ + Math.cos(a) * 11.6, r: 1.6 }); }
  opening.position.set(Math.sin(toV) * 11.7, 2.4, Math.cos(toV) * 11.7); opening.lookAt(new THREE.Vector3(Math.sin(toV) * 30, 2.4, Math.cos(toV) * 30)); opening.visible = false;
  for (const cr of crystals) if (cr.position.length() > 3.5) { const wp = cr.getWorldPosition(new THREE.Vector3()); circles.push({ x: wp.x, z: wp.z, r: .5 }); }
  anim.push(t => { cm.emissiveIntensity = 1.2 + Math.sin(t * 1.5) * .4; });
  return { anim, market: new THREE.Vector3(MX, 0, MZ), cave: new THREE.Vector3(CX, 0, CZ) };
}

// Realistische, prozedurale 3D-Modelle für Wichtel 3D
import * as THREE from './three.min.js';
import { signTexture, windowTexture } from './w3d-tex.js';

export let T = null;
const M = {}; // Material-Cache
export function setTextures(t) {
  T = t;
  std('gold', { color: 0xd8a62a, metalness: .9, roughness: .3 });
  std('roofsnow', { color: 0xf7faff, roughness: .92 });
  std('snowsoft', { color: 0xf6f9ff, roughness: .95 });
  std('eye', { color: 0x15100c, roughness: .15 });
  std('iron', { color: 0x1c1c22, metalness: .7, roughness: .45 });
  std('seat', { color: 0x2a5a3a, roughness: .9 });
  std('coal', { color: 0x111111, roughness: .6 });
}
function std(key, o) { if (!M[key]) M[key] = new THREE.MeshStandardMaterial(o); return M[key]; }
function cloneMap(t, rx, ry) { const c = t.clone(); c.needsUpdate = true; c.repeat.set(rx, ry); return c; }
const SH = {};
function shared(key) { if (!SH[key]) SH[key] = cloneMap(T[key], 1, 1); return SH[key]; }
function tmat(key, nkey, rough = .85, ns = .6) { const k = 'tm_' + key + '_' + nkey; if (!M[k]) M[k] = new THREE.MeshStandardMaterial({ map: shared(key), normalMap: nkey ? shared(nkey) : null, normalScale: new THREE.Vector2(ns, ns), roughness: rough }); return M[k]; }
function uvs(geo, sx, sy) { const u = geo.attributes.uv; for (let i = 0; i < u.count; i++) u.setXY(i, u.getX(i) * sx, u.getY(i) * sy); return geo; }
// Direkte Mesh-Kinder einer Gruppe nach Material zusammenführen (Untergruppen bleiben beweglich)
export function compact(g) {
  const by = new Map();
  for (const c of [...g.children]) { if (!c.isMesh || c.isInstancedMesh || c.userData.keep) continue; const m = c.material; if (!by.has(m)) by.set(m, []); by.get(m).push(c); }
  for (const [m, list] of by) {
    if (list.length < 2) continue;
    const pos = [], nor = [], uv = [];
    for (const c of list) { c.updateMatrix(); const ge = (c.geometry.index ? c.geometry.toNonIndexed() : c.geometry.clone()).applyMatrix4(c.matrix); const P = ge.attributes.position, N = ge.attributes.normal, U = ge.attributes.uv; for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nor.push(N.getX(i), N.getY(i), N.getZ(i)); if (U) uv.push(U.getX(i), U.getY(i)); else uv.push(0, 0); } g.remove(c); }
    const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); ge.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    const mm = new THREE.Mesh(ge, m); mm.castShadow = mm.receiveShadow = true; g.add(mm);
  }
  return g;
}
function shade(m) { m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return m; }

// Abgerundete Box: weiche Kanten statt Klötzchen
export function roundBox(w, h, d, r = .1, seg = 3) {
  const g = new THREE.BoxGeometry(w, h, d, seg * 2, seg * 2, seg * 2), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    c.set(Math.max(-hx, Math.min(hx, v.x)), Math.max(-hy, Math.min(hy, v.y)), Math.max(-hz, Math.min(hz, v.z)));
    v.sub(c); if (v.lengthSq() > 0) v.normalize().multiplyScalar(r); v.add(c); p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals(); return g;
}

// Geometrien zusammenführen (mit Vertexfarben) – für viele Bäume in einem Draw-Call
export function mergeColored(parts) {
  const pos = [], nor = [], col = [];
  for (const [geo, color, mat4] of parts) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone(); if (mat4) g.applyMatrix4(mat4);
    const p = g.attributes.position, n = g.attributes.normal, cc = new THREE.Color(color);
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(cc.r, cc.g, cc.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function jitter(g, amt, seed) { let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const p = g.attributes.position; for (let i = 0; i < p.count; i++) { if (p.getY(i) > -.49 * 1e9) { p.setX(i, p.getX(i) + (r() - .5) * amt); p.setZ(i, p.getZ(i) + (r() - .5) * amt); } } g.computeVertexNormals(); return g; }

// Äste hängen am Rand leicht nach unten und sind gezackt
function droop(g, r, lh) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z) / r, a = Math.atan2(z, x); const tooth = 1 + .16 * Math.sin(a * 11); p.setX(i, x * tooth); p.setZ(i, z * tooth); p.setY(i, p.getY(i) - d * d * lh * .18); } g.computeVertexNormals(); }
// ---------- Tanne (realistisch, mit Schnee auf den Ästen) ----------
export function spruceGeometry(seed = 1, h = 7, lo = false) {
  const parts = [], layers = lo ? 5 : 7, rs = lo ? 9 : 22, hs = lo ? 1 : 3;
  parts.push([new THREE.CylinderGeometry(.12 * h / 7, .22 * h / 7, h * .3, lo ? 5 : 8, 1, true), 0x4a3424, new THREE.Matrix4().makeTranslation(0, h * .15, 0)]);
  for (let i = 0; i < layers; i++) {
    const t = i / layers, r = (1 - t) * h * .26 + .2, lh = h * .26, y = h * .18 + t * h * .72;
    const cone = new THREE.ConeGeometry(r, lh, rs, hs, true); droop(cone, r, lh); jitter(cone, r * .2, seed * 31 + i);
    const green = new THREE.Color().setHSL(.37 + ((seed * 7 + i) % 5) * .006, .55, .085 + t * .035);
    parts.push([cone, green, new THREE.Matrix4().makeTranslation(0, y + lh / 2, 0)]);
    const snow = new THREE.ConeGeometry(r * .8, lh * .38, rs, 1, true); jitter(snow, r * .14, seed * 17 + i);
    parts.push([snow, 0xf4f8ff, new THREE.Matrix4().makeTranslation(0, y + lh * .74, 0)]);
  }
  return mergeColored(parts);
}

// ---------- Wichtel ----------
const SKIN = 0xf2c6a2;
function bentCone(r, h, bend, seg = 24) {
  const g = new THREE.ConeGeometry(r, h, 20, seg, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), t = Math.min(1, Math.max(0, (y + h / 2) / h)); p.setX(i, p.getX(i) + Math.pow(t, 2.2) * bend); p.setY(i, y - Math.pow(t, 3) * bend * .25); }
  g.computeVertexNormals(); g.translate(0, h / 2, 0); return g;
}
export function makeWichtel(o = {}) {
  const coat = o.coat || 'coatRed', hatCol = o.hat || 0xc4161c, beard = !!o.beard, scale = o.scale || 1;
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const coatMat = new THREE.MeshStandardMaterial({ map: T[coat], roughness: .92, color: 0xffffff });
  const skin = std('skin', { color: SKIN, roughness: .6 });
  const dark = std('boot', { color: 0x2b1a10, roughness: .55 });
  const pants = std('pants', { color: o.pants || 0x3a3f4f, roughness: .9 });
  const white = std('fur', { color: 0xf6f3ee, roughness: 1 });
  // Beine & Stiefel
  const legs = [];
  for (const s of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(s * .13, .42, 0);
    const l = new THREE.Mesh(new THREE.CapsuleGeometry(.075, .22, 4, 10), pants); l.position.y = -.17; leg.add(l);
    const b = new THREE.Mesh(roundBox(.17, .12, .26, .055), dark); b.position.set(0, -.36, .04); leg.add(b);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), dark); tip.position.set(0, -.33, .19); tip.scale.set(1, .9, 1.3); leg.add(tip);
    body.add(leg); legs.push(leg);
  }
  // Mantel (Glockenform)
  const prof = [[.0, .38], [.27, .36], [.30, .45], [.27, .65], [.22, .82], [.16, .92], [.0, .95]].map(([x, y]) => new THREE.Vector2(x, y));
  const coatM = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), coatMat); body.add(coatM);
  const hem = new THREE.Mesh(new THREE.TorusGeometry(.29, .035, 10, 32), white); hem.rotation.x = Math.PI / 2; hem.position.y = .38; body.add(hem);
  const belt = new THREE.Mesh(new THREE.TorusGeometry(.262, .03, 8, 32), std('belt', { color: 0x1d1410, roughness: .4 })); belt.rotation.x = Math.PI / 2; belt.position.y = .6; body.add(belt);
  const buckle = new THREE.Mesh(roundBox(.1, .08, .03, .01), std('gold', { color: 0xd8a62a, metalness: .9, roughness: .3 })); buckle.position.set(0, .6, .27); body.add(buckle);
  for (let i = 0; i < 3; i++) { const bt = new THREE.Mesh(new THREE.SphereGeometry(.018, 8, 6), std('gold', {})); bt.position.set(0, .7 + i * .07, .24 - i * .03); body.add(bt); }
  // Arme
  const arms = [];
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(s * .25, .86, 0);
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(.06, .24, 4, 10), coatMat); a.position.y = -.15; a.rotation.z = s * .18; arm.add(a);
    const cuff = new THREE.Mesh(new THREE.TorusGeometry(.065, .02, 8, 16), white); cuff.position.set(s * .05, -.3, 0); cuff.rotation.x = Math.PI / 2; arm.add(cuff);
    const mit = new THREE.Mesh(new THREE.SphereGeometry(.065, 12, 10), std('mitten', { color: o.mitten || 0x2f6b3e, roughness: .95 })); mit.position.set(s * .06, -.36, 0); arm.add(mit);
    body.add(arm); arms.push(arm);
  }
  // Kopf
  const head = new THREE.Group(); head.position.y = 1.12; body.add(head);
  head.add(new THREE.Mesh(new THREE.SphereGeometry(.2, 24, 18), skin));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.06, 14, 10), std('nose', { color: 0xe79a84, roughness: .5 })); nose.position.set(0, -.01, .2); nose.scale.set(1, .9, 1.1); head.add(nose);
  for (const s of [-1, 1]) {
    const ch = new THREE.Mesh(new THREE.SphereGeometry(.045, 10, 8), std('cheek', { color: 0xf29a9a, roughness: .7, transparent: true, opacity: .6 })); ch.position.set(s * .11, -.05, .15); head.add(ch);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.027, 12, 10), std('eye', { color: 0x15100c, roughness: .15 })); eye.position.set(s * .072, .05, .175); head.add(eye);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(.008, 6, 6), std('hl', { color: 0xffffff, emissive: 0xffffff, emissiveIntensity: .6 })); hl.position.set(s * .072 + .01, .06, .2); head.add(hl);
    const ear = new THREE.Mesh(new THREE.SphereGeometry(.05, 10, 8), skin); ear.scale.set(.5, 1.1, .8); ear.position.set(s * .2, 0, 0); ear.rotation.z = -s * .3; head.add(ear);
    const brow = new THREE.Mesh(new THREE.CapsuleGeometry(.012, .04, 3, 6), std('brow', { color: beard ? 0xeeeeee : 0x6b4a2a })); brow.rotation.z = Math.PI / 2 + s * .2; brow.position.set(s * .075, .1, .18); head.add(brow);
  }
  if (beard) {
    const bp = [[0, -.42], [.08, -.38], [.15, -.25], [.19, -.1], [.2, -.02]].map(([x, y]) => new THREE.Vector2(x, y));
    const bd = new THREE.Mesh(new THREE.LatheGeometry(bp, 20, -Math.PI * .55, Math.PI * 1.1), white); bd.position.set(0, .02, .02); head.add(bd);
    const mo = new THREE.Mesh(new THREE.CapsuleGeometry(.03, .1, 4, 8), white); mo.rotation.z = Math.PI / 2; mo.position.set(0, -.06, .2); head.add(mo);
  } else {
    const smile = new THREE.Mesh(new THREE.TorusGeometry(.045, .008, 6, 16, Math.PI), std('mouth', { color: 0x7a2a22 })); smile.rotation.z = Math.PI; smile.position.set(0, -.08, .185); head.add(smile);
  }
  // Zipfelmütze (gebogen, mit Fellrand und Bommel)
  const hatMat = new THREE.MeshStandardMaterial({ color: hatCol, roughness: .9, map: T.knit && o.stripes ? T.knit : null });
  const hat = new THREE.Mesh(bentCone(.21, .62, -.28), hatMat); hat.position.y = .1; head.add(hat);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.205, .045, 10, 28), white); rim.rotation.x = Math.PI / 2; rim.position.y = .11; head.add(rim);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(.06, 14, 12), white); pom.position.set(-.28, .1 + .62 - .07, 0); head.add(pom);
  body.scale.setScalar(scale);
  compact(head); legs.forEach(compact); arms.forEach(compact); compact(body);
  shade(root);
  root.userData = { legs, arms, head, body, t: 0 };
  return root;
}
export function animateWichtel(w, dt, speed) {
  const u = w.userData; u.t += dt * (4 + speed * 2.2);
  const sw = Math.min(1, speed / 3) * .7, s = Math.sin(u.t);
  u.legs[0].rotation.x = s * sw; u.legs[1].rotation.x = -s * sw;
  u.arms[0].rotation.x = -s * sw * .8; u.arms[1].rotation.x = s * sw * .8;
  u.body.position.y = Math.abs(Math.cos(u.t)) * .05 * Math.min(1, speed) + Math.sin(performance.now() / 600) * .006;
  u.head.rotation.z = Math.sin(u.t * .5) * .04;
}

// ---------- Fenster ----------
let winTexCache = [];
function windowMesh(w, h, seed) {
  if (!winTexCache.length) for (let i = 0; i < 4; i++) { const wt = windowTexture(i + 1); winTexCache.push(new THREE.MeshStandardMaterial({ map: wt, emissive: 0xffb060, emissiveMap: wt, emissiveIntensity: .85, roughness: .35, color: 0x553311 })); }
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), winTexCache[seed % 4]);
  g.add(glass);
  const fr = std('frame', { color: 0xf1ebe0, roughness: .7 });
  const top = new THREE.Mesh(roundBox(w + .16, .1, .1, .03), fr); top.position.set(0, h / 2 + .04, .03); g.add(top);
  const sill = new THREE.Mesh(roundBox(w + .26, .08, .2, .03), fr); sill.position.set(0, -h / 2 - .04, .08); g.add(sill);
  const snow = new THREE.Mesh(roundBox(w + .22, .07, .18, .035), std('snowsoft', { color: 0xf6f9ff, roughness: .95 })); snow.position.set(0, -h / 2 + .03, .09); g.add(snow);
  for (const s of [-1, 1]) { const sh = new THREE.Mesh(roundBox(w * .5, h + .1, .05, .02), std('shutter' + (seed % 3), { color: [0x2e5a3a, 0x7a2a22, 0x2c4a6e][seed % 3], roughness: .8 })); sh.position.set(s * (w * .75 + .06), 0, .02); g.add(sh); }
  return g;
}

// ---------- Gebäude ----------
// opts: w,d,h, wall (Textur-Key), roof (Textur-Key), sign, chimney, door, floors, tower
export function makeBuilding(o) {
  const g = new THREE.Group(), w = o.w, d = o.d, h = o.h, rh = o.roofH || Math.min(w, d) * .45;
  const wk = o.wall || 'wood', wallMat = tmat(wk, wk === 'brick' ? 'brickN' : wk === 'stone' ? 'stoneN' : (wk === 'woodRed' ? 'woodRedN' : 'woodN'));
  // Sockel
  const base = new THREE.Mesh(uvs(new THREE.BoxGeometry(w + .3, .7, d + .3), (w + d) / 4, .5), tmat('stone', 'stoneN', .95, 1));
  base.position.y = .35; g.add(base);
  const walls = new THREE.Mesh(uvs(new THREE.BoxGeometry(w, h, d), w / 3, h / 3), wallMat); walls.position.y = .7 + h / 2; g.add(walls);
  // Eckbalken
  const beam = std('beam', { color: 0x3a2414, roughness: .8 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const b = new THREE.Mesh(new THREE.BoxGeometry(.22, h, .22), beam); b.position.set(sx * w / 2, .7 + h / 2, sz * d / 2); g.add(b); }
  // Giebel (Dreiecke vorne/hinten)
  const tri = new THREE.Shape(); tri.moveTo(-w / 2, 0); tri.lineTo(w / 2, 0); tri.lineTo(0, rh); tri.closePath();
  const gab = uvs(new THREE.ExtrudeGeometry(tri, { depth: .02, bevelEnabled: false }), 1 / 3, 1 / 3);
  for (const s of [-1, 1]) { const m = new THREE.Mesh(gab, wallMat); m.position.set(0, .7 + h, s * d / 2 - (s > 0 ? .02 : 0)); g.add(m); }
  // Dach mit Überstand, Schnee und Eiszapfen
  const slope = Math.atan2(rh, w / 2), len = Math.hypot(w / 2, rh) + .55, ov = d + 1;
  const roofMat = tmat(o.roof || 'roofRed', 'roofN', .8, 1);
  const snowMat = std('roofsnow', { color: 0xf7faff, roughness: .92 });
  for (const s of [-1, 1]) {
    const pl = new THREE.Group(); pl.position.set(0, .7 + h + rh, 0); pl.rotation.z = s * -(Math.PI / 2 - slope) * -1;
    pl.rotation.z = s > 0 ? -slope : slope;
    const r = new THREE.Mesh(uvs(new THREE.BoxGeometry(len, .18, ov), len / 2, ov / 3), roofMat); r.position.x = s * len / 2; pl.add(r);
    const sn = new THREE.Mesh(roundBox(len * .97, .22, ov * .98, .1), snowMat); sn.position.set(s * len / 2, .17, 0); pl.add(sn);
    // Eiszapfen an der Traufe
    const ice = std('icicle', { color: 0xdff4ff, roughness: .1, metalness: .1, transparent: true, opacity: .85 });
    for (let k = -ov / 2 + .3; k < ov / 2; k += .45 + Math.abs(Math.sin(k * 7)) * .3) { const ic = new THREE.Mesh(new THREE.ConeGeometry(.05, .25 + Math.abs(Math.sin(k * 13)) * .35, 6), ice); ic.rotation.x = Math.PI; ic.position.set(s * (len - .05), -.25, k); ic.rotation.z = s > 0 ? slope : -slope; pl.add(ic); }
    g.add(pl);
  }
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, ov, 10), snowMat); ridge.rotation.x = Math.PI / 2; ridge.position.y = .7 + h + rh + .12; g.add(ridge);
  // Tür + Vordach + Lampe
  const door = new THREE.Group(); door.position.set(0, .7, d / 2 + .02);
  const dm = new THREE.Mesh(roundBox(1.3, 2.2, .14, .05), std('door' + (o.door || 0), { color: [0x5a2e18, 0x8a1e1e, 0x234a34, 0x2a3e6a][o.door || 0], roughness: .6 })); dm.position.y = 1.1; door.add(dm);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 6), std('gold', { color: 0xd8a62a, metalness: .9, roughness: .3 })); knob.position.set(.45, 1.1, .09); door.add(knob);
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(.26, .08, 8, 20), std('wreath', { color: 0x1f5a2e, roughness: .9 })); wreath.position.set(0, 1.6, .1); door.add(wreath);
  const bow = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 6), std('bow', { color: 0xc4161c })); bow.position.set(0, 1.36, .14); door.add(bow);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), std('lampglow', { color: 0xffe2a0, emissive: 0xffb04a, emissiveIntensity: 2.2 })); lamp.position.set(-.95, 2.1, .25); door.add(lamp);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(2, .25, .8), std('stepstone', { color: 0x8d8d95, roughness: .95 })); steps.position.set(0, -.55, .3); door.add(steps);
  g.add(door);
  // Fenster
  const floors = o.floors || 1, per = Math.max(1, Math.floor((w - 2) / 2.4));
  let seed = (o.seed || 1);
  for (let f = 0; f < floors; f++) {
    const y = .7 + (h / floors) * (f + .55);
    for (let i = 0; i < per; i++) {
      const x = -w / 2 + (i + .5) * (w / per); if (f === 0 && Math.abs(x) < 1.1) continue;
      const wm = windowMesh(.9, 1.1, seed++); wm.position.set(x, y, d / 2 + .02); g.add(wm);
      const wb = windowMesh(.9, 1.1, seed++); wb.position.set(x, y, -d / 2 - .02); wb.rotation.y = Math.PI; g.add(wb);
    }
    for (const s of [-1, 1]) { const ws = windowMesh(.9, 1.1, seed++); ws.position.set(s * (w / 2 + .02), y, 0); ws.rotation.y = s * Math.PI / 2; g.add(ws); }
  }
  // Kamin
  if (o.chimney !== false) {
    const ch = new THREE.Mesh(uvs(new THREE.BoxGeometry(.7, rh + 1.2, .7), .5, 1), tmat('brick', 'brickN', .9, 1));
    ch.position.set(w * .25, .7 + h + rh * .5 + .4, -d * .2); g.add(ch);
    const cs = new THREE.Mesh(roundBox(.8, .18, .8, .08), snowMat); cs.position.set(w * .25, .7 + h + rh + 1.05, -d * .2); g.add(cs);
    g.userData.chimney = new THREE.Vector3(w * .25, .7 + h + rh + 1.2, -d * .2);
  }
  // Schild
  if (o.sign) {
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * .7, 4.2), Math.min(w * .7, 4.2) / 4), new THREE.MeshStandardMaterial({ map: signTexture(o.sign), roughness: .6, emissive: 0x332211, emissiveIntensity: .4 }));
    sg.position.set(0, .7 + h - .45, d / 2 + .06); g.add(sg);
  }
  shade(g);
  g.userData.size = { w: w + 1, d: d + 1 }; g.userData.door = new THREE.Vector3(0, 0, d / 2 + 1.4);
  return g;
}

// Glockenturm (für Schule/Rathaus)
export function makeTower(h, roof = 'roofDark', clock = true) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(uvs(new THREE.BoxGeometry(2.6, h, 2.6), 1, h / 3), tmat('stone', 'stoneN', .9, 1)); body.position.y = h / 2; g.add(body);
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 2.8), std('belfry', { color: 0x3a2a20, roughness: .8 })); belfry.position.y = h + .9; g.add(belfry);
  const bell = new THREE.Mesh(new THREE.LatheGeometry([[0, .7], [.25, .65], [.32, .4], [.45, .05], [.5, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 20), std('gold', {})); bell.position.y = h + .2; g.add(bell); g.userData.bell = bell; bell.userData.keep = true;
  const sp = new THREE.Mesh(uvs(new THREE.ConeGeometry(2.2, 3.4, 4), 2, 2), tmat(roof, 'roofN', .8, 1)); sp.position.y = h + 1.8 + 1.7; sp.rotation.y = Math.PI / 4; g.add(sp);
  const sps = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.4, 4), std('roofsnow', {})); sps.position.y = h + 1.8 + 2.9; sps.rotation.y = Math.PI / 4; g.add(sps);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.35), std('starglow', { color: 0xffe08a, emissive: 0xffc040, emissiveIntensity: 2 })); star.position.y = h + 1.8 + 3.7; g.add(star);
  if (clock) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#f3ead6'; x.beginPath(); x.arc(128, 128, 124, 0, 7); x.fill(); x.strokeStyle = '#2b1a0e'; x.lineWidth = 8; x.stroke();
    x.fillStyle = '#2b1a0e'; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillRect(128 + Math.sin(a) * 100 - 4, 128 - Math.cos(a) * 100 - 10, 8, 20); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const face = new THREE.Mesh(new THREE.CircleGeometry(.9, 32), new THREE.MeshStandardMaterial({ map: t, emissive: 0xffe9b0, emissiveMap: t, emissiveIntensity: .5 })); face.position.set(0, h - 1.2, 1.31); g.add(face);
    const hand = std('hand', { color: 0x1a1008 });
    const hh = new THREE.Mesh(new THREE.BoxGeometry(.06, .5, .02), hand); hh.geometry.translate(0, .25, 0); hh.position.set(0, h - 1.2, 1.33); g.add(hh);
    const mh = new THREE.Mesh(new THREE.BoxGeometry(.04, .75, .02), hand); mh.geometry.translate(0, .37, 0); mh.position.set(0, h - 1.2, 1.34); g.add(mh);
    g.userData.hands = [hh, mh]; hh.userData.keep = mh.userData.keep = true;
  }
  return shade(g);
}

// ---------- Weihnachtsbaum mit Lichtern ----------
export function makeXmasTree(h = 14) {
  const g = new THREE.Group();
  const tree = new THREE.Mesh(spruceGeometry(99, h), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); g.add(tree);
  const n = 220, lights = new THREE.InstancedMesh(new THREE.SphereGeometry(.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.4 }), n);
  const m = new THREE.Matrix4(), cols = [0xffd27a, 0xff4a4a, 0x7ad0ff, 0x8aff9a, 0xffffff];
  for (let i = 0; i < n; i++) {
    const t = i / n, y = h * .22 + t * h * .7, r = (1 - (y - h * .18) / (h * .78)) * h * .27 + .1, a = t * 40 + Math.sin(i) * .3;
    m.makeTranslation(Math.cos(a) * r, y, Math.sin(a) * r); lights.setMatrixAt(i, m); lights.setColorAt(i, new THREE.Color(cols[i % 5]));
  }
  g.add(lights); g.userData.lights = lights;
  for (let i = 0; i < 26; i++) { const t = (i + .5) / 26, y = h * .22 + t * h * .65, r = (1 - (y - h * .18) / (h * .78)) * h * .26, a = i * 2.4; const b = new THREE.Mesh(new THREE.SphereGeometry(.22, 14, 10), std('ball' + (i % 3), { color: [0xc4161c, 0xd8a62a, 0x2a6ad8][i % 3], metalness: .8, roughness: .2 })); b.position.set(Math.cos(a) * r, y - .3, Math.sin(a) * r); g.add(b); }
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(.7), new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xffc040, emissiveIntensity: 3 })); star.position.y = h + .5; g.add(star); g.userData.star = star; star.userData.keep = true; lights.userData.keep = true;
  compact(g);
  return shade(g);
}

// ---------- Wichtelmobil (fliegender Schlitten) ----------
export function makeWichtelmobil() {
  const g = new THREE.Group();
  const side = new THREE.Shape(); side.moveTo(-1.6, .2); side.lineTo(1.1, .2); side.quadraticCurveTo(1.9, .25, 2.0, 1.2); side.quadraticCurveTo(1.6, 1.0, 1.2, 1.0); side.lineTo(-.6, 1.0); side.quadraticCurveTo(-1.3, 1.6, -1.8, 1.7); side.quadraticCurveTo(-1.9, .9, -1.6, .2);
  const bodyG = new THREE.ExtrudeGeometry(side, { depth: 1.5, bevelEnabled: true, bevelSize: .08, bevelThickness: .08, bevelSegments: 3, curveSegments: 16 }); bodyG.translate(0, 0, -.75);
  const lac = new THREE.MeshStandardMaterial({ color: 0xa8141a, metalness: .45, roughness: .28 });
  g.add(new THREE.Mesh(bodyG, lac));
  const gold = std('gold', { color: 0xd8a62a, metalness: .9, roughness: .3 });
  for (const s of [-1, 1]) {
    const trim = new THREE.Mesh(new THREE.TorusGeometry(.5, .04, 8, 24, Math.PI), gold); trim.position.set(.2, .6, s * .84); g.add(trim);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.8, -.2, 0), new THREE.Vector3(1.4, -.2, 0), new THREE.Vector3(2.2, .1, 0), new THREE.Vector3(2.3, .7, 0), new THREE.Vector3(2.0, .9, 0)]);
    const run = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, .06, 8), gold); run.position.z = s * .7; g.add(run);
    for (const x of [-1.1, .9]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .45, 8), gold); st.position.set(x, 0, s * .7); g.add(st); }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.13, 12, 10), std('mobilamp', { color: 0xfff2c0, emissive: 0xffd070, emissiveIntensity: 3 })); lamp.position.set(1.9, 1.3, s * .65); g.add(lamp);
  }
  const seat = new THREE.Mesh(roundBox(1.1, .35, 1.3, .12), std('seat', { color: 0x2a5a3a, roughness: .9 })); seat.position.set(-.6, 1.05, 0); g.add(seat);
  const back = new THREE.Mesh(roundBox(.3, .8, 1.3, .12), std('seat', {})); back.position.set(-1.15, 1.4, 0); g.add(back);
  const sack = new THREE.Mesh(new THREE.SphereGeometry(.55, 16, 12), std('sack', { color: 0x8a6a3e, roughness: 1 })); sack.scale.set(1, 1.15, 1); sack.position.set(-1.25, 1.75, 0); g.add(sack);
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, .05, 24), new THREE.MeshBasicMaterial({ color: 0x9fe6ff, transparent: true, opacity: .25, depthWrite: false })); glow.position.y = -.3; g.add(glow); g.userData.glow = glow;
  g.scale.setScalar(.8);
  return shade(g);
}

// ---------- Rentier ----------
export function makeReindeer() {
  const g = new THREE.Group(), fur = std('fur_rd', { color: 0x7a5232, roughness: .95 }), light = std('fur_light', { color: 0xd8c0a0, roughness: 1 });
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(.42, 1.1, 6, 14), fur); body.rotation.z = Math.PI / 2; body.position.y = 1.25; g.add(body);
  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(.3, .7, 4, 10), light); belly.rotation.z = Math.PI / 2; belly.position.set(0, 1.05, 0); g.add(belly);
  const neck = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .55, 4, 10), fur); neck.position.set(.75, 1.75, 0); neck.rotation.z = -.6; g.add(neck);
  const head = new THREE.Group(); head.position.set(1.0, 2.05, 0); g.add(head);
  const hd = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .38, 4, 10), fur); hd.rotation.z = Math.PI / 2 - .3; hd.position.x = .15; head.add(hd);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.09, 10, 8), std('rdnose', { color: 0x221410, roughness: .3 })); nose.position.set(.45, -.08, 0); head.add(nose);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.035, 8, 6), std('eye', {})); eye.position.set(.2, .06, s * .13); head.add(eye);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.06, .2, 8), fur); ear.position.set(-.05, .15, s * .17); ear.rotation.x = s * .9; head.add(ear);
    const ant = std('antler', { color: 0xd9c7a8, roughness: .7 });
    const a1 = new THREE.Mesh(new THREE.CylinderGeometry(.025, .04, .7, 6), ant); a1.position.set(-.05, .45, s * .14); a1.rotation.set(s * .5, 0, .3); head.add(a1);
    const a2 = new THREE.Mesh(new THREE.CylinderGeometry(.02, .03, .35, 6), ant); a2.position.set(.1, .55, s * .25); a2.rotation.set(s * .2, 0, -.6); head.add(a2);
    const a3 = new THREE.Mesh(new THREE.CylinderGeometry(.018, .025, .3, 6), ant); a3.position.set(-.2, .7, s * .3); a3.rotation.set(s * .9, 0, .9); head.add(a3);
  }
  const legs = [];
  for (const x of [-.55, .55]) for (const z of [-.22, .22]) { const l = new THREE.Mesh(new THREE.CapsuleGeometry(.07, .85, 4, 8), fur); l.position.set(x, .55, z); g.add(l); legs.push(l); const hf = new THREE.Mesh(new THREE.CylinderGeometry(.08, .09, .12, 8), std('hoof', { color: 0x1a120c })); hf.position.set(x, .06, z); g.add(hf); }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), light); tail.position.set(-.95, 1.4, 0); g.add(tail);
  g.userData = { legs, head };
  return shade(g);
}

// ---------- Kleinteile ----------
export function makeLantern() {
  const g = new THREE.Group(), iron = std('iron', { color: 0x1c1c22, metalness: .7, roughness: .45 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.06, .1, 3.2, 10), iron); pole.position.y = 1.6; g.add(pole);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(.32, .3, 4), iron); cap.position.y = 3.65; cap.rotation.y = Math.PI / 4; g.add(cap);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(.34, .45, .34), std('lanternglass', { color: 0xfff1c8, emissive: 0xffb84a, emissiveIntensity: 2.6, transparent: true, opacity: .95 })); glass.position.y = 3.3; g.add(glass);
  const sn = new THREE.Mesh(new THREE.ConeGeometry(.25, .12, 4), std('roofsnow', {})); sn.position.y = 3.83; sn.rotation.y = Math.PI / 4; g.add(sn);
  return shade(g);
}
export function makeSnowman(s = 1) {
  const g = new THREE.Group(), sn = std('snowball', { color: 0xf8fbff, roughness: .9 });
  [[.7, .7], [.5, 1.75], [.36, 2.5]].forEach(([r, y]) => { const b = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), sn); b.position.y = y; g.add(b); });
  const carrot = new THREE.Mesh(new THREE.ConeGeometry(.07, .4, 10), std('carrot', { color: 0xe8701e })); carrot.rotation.x = Math.PI / 2; carrot.position.set(0, 2.5, .5); g.add(carrot);
  for (const x of [-.12, .12]) { const e = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 6), std('coal', { color: 0x111111 })); e.position.set(x, 2.62, .32); g.add(e); }
  const hat = new THREE.Mesh(new THREE.CylinderGeometry(.25, .27, .4, 16), std('coal', {})); hat.position.y = 2.95; g.add(hat);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .05, 16), std('coal', {})); brim.position.y = 2.78; g.add(brim);
  const scarf = new THREE.Mesh(new THREE.TorusGeometry(.38, .09, 8, 20), new THREE.MeshStandardMaterial({ map: T.knit, roughness: .95 })); scarf.rotation.x = Math.PI / 2; scarf.position.y = 2.2; g.add(scarf);
  g.scale.setScalar(s); return shade(g);
}
export function makeBench() {
  const g = new THREE.Group(), w = new THREE.MeshStandardMaterial({ map: T.wood, roughness: .8 }), iron = std('iron', {});
  for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(roundBox(2.2, .08, .22, .03), w); p.position.set(0, .55, -.25 + i * .25); g.add(p); }
  for (let i = 0; i < 2; i++) { const p = new THREE.Mesh(roundBox(2.2, .22, .06, .03), w); p.position.set(0, .8 + i * .28, -.4); g.add(p); }
  for (const x of [-.9, .9]) { const l = new THREE.Mesh(new THREE.BoxGeometry(.08, .55, .6), iron); l.position.set(x, .27, -.1); g.add(l); }
  const sn = new THREE.Mesh(roundBox(2.1, .1, .65, .05), std('snowsoft', {})); sn.position.set(0, .63, 0); g.add(sn);
  return shade(g);
}
export function makeFence(len) {
  const g = new THREE.Group(), w = std('fencewood', { color: 0x6a4a30, roughness: .9 });
  for (let x = 0; x <= len; x += 1.2) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .08, 1.2, 8), w); p.position.set(x - len / 2, .6, 0); g.add(p); const c = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 6), std('snowsoft', {})); c.scale.y = .6; c.position.set(x - len / 2, 1.22, 0); g.add(c); }
  for (const y of [.45, .9]) { const r = new THREE.Mesh(new THREE.BoxGeometry(len, .1, .06), w); r.position.y = y; g.add(r); }
  return shade(g);
}
export function makeHay() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .9, 18), std('hay', { color: 0xd6b04a, roughness: 1 })); m.rotation.z = Math.PI / 2; m.position.y = .55; g.add(m); return shade(g); }
export function makeCrate() { const g = new THREE.Group(); const m = new THREE.Mesh(roundBox(.8, .6, .8, .05), new THREE.MeshStandardMaterial({ map: T.wood, roughness: .85 })); m.position.y = .3; g.add(m); const s = new THREE.Mesh(roundBox(.75, .1, .75, .05), std('snowsoft', {})); s.position.y = .63; g.add(s); return shade(g); }
export function makeGift(c = 0xc4161c) { const g = new THREE.Group(); const b = new THREE.Mesh(roundBox(.5, .45, .5, .04), new THREE.MeshStandardMaterial({ color: c, roughness: .5 })); b.position.y = .225; g.add(b); const gold = std('gold', {}); const r1 = new THREE.Mesh(new THREE.BoxGeometry(.52, .46, .08), gold); r1.position.y = .225; g.add(r1); const r2 = new THREE.Mesh(new THREE.BoxGeometry(.08, .46, .52), gold); r2.position.y = .225; g.add(r2); const bow = new THREE.Mesh(new THREE.TorusKnotGeometry(.08, .025, 32, 6), gold); bow.position.y = .5; g.add(bow); return shade(g); }

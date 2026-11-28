// Echte 3D-Figuren mit Skelett-Animationen (Quaternius CC0 + Khronos Fox CC-BY)
import * as THREE from './three.min.js';
import { GLTFLoader } from './pp-GLTFLoader.js';
import * as SU from './pp-SkeletonUtils.js';
import * as MD from './w3d-models.js?v=9';

const A = { man: null, woman: null, anims: null, fox: null };
export let ready = false;
const RIGS = new Set();

export async function load(base = '', onProg) {
  const L = new GLTFLoader(); let n = 0;
  const get = (f) => L.loadAsync(base + f).then(g => { n++; onProg && onProg(n / 4); return g; });
  const [man, woman, anims, fox] = await Promise.all([get('wm-man.glb?v=9'), get('wm-woman.glb?v=9'), get('wm-anims.glb?v=9'), get('wm-fox.glb?v=9')]);
  A.man = man; A.woman = woman; A.fox = fox;
  A.clips = {}; anims.animations.forEach(c => A.clips[c.name] = c);
  A.foxClips = {}; fox.animations.forEach(c => A.foxClips[c.name] = c);
  ready = true;
}

// ---------- Kleidung per Shader (nach Körperzonen in der Grundpose) ----------
function outfitMaterial(src, o, H, X) {
  const m = src.clone();
  m.roughness = .82; m.metalness = 0;
  const u = {
    uTop: { value: new THREE.Color(o.top) }, uPants: { value: new THREE.Color(o.pants) }, uBoot: { value: new THREE.Color(o.boot) },
    uTrim: { value: new THREE.Color(o.trim ?? o.top) }, uBelt: { value: new THREE.Color(o.belt ?? o.top) }, uMit: { value: new THREE.Color(o.mit ?? 0) },
    uOpt: { value: new THREE.Vector4(o.elf ? 1 : 0, o.mit != null ? 1 : 0, o.stripes ? 1 : 0, 0) }, uH: { value: H }, uX: { value: X }
  };
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, u);
    s.vertexShader = 'varying vec3 vBind;\n' + s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvBind = position;');
    s.fragmentShader = 'varying vec3 vBind; uniform vec3 uTop,uPants,uBoot,uTrim,uBelt,uMit; uniform vec4 uOpt; uniform float uH,uX;\n' + s.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    {
      vec3 p = vBind; float y = p.y / uH; float ax = abs(p.x) / uX;
      bool head = y > (uOpt.x > .5 ? .835 : .84);
      bool hand = ax > .76;
      if (!head && !(hand && uOpt.y < .5)) {
        vec3 c = uTop;
        if (hand) c = uMit;
        else if (y < (uOpt.x > .5 ? .085 : .04)) c = uBoot;
        else if (y < (uOpt.x > .5 ? .44 : .5) && ax < .27) c = uPants;
        if (uOpt.x > .5 && !hand) {
          if (abs(y - .445) < .018 && ax < .2) c = uTrim;           // Fellsaum
          if (abs(y - .565) < .015 && ax < .2) c = (abs(p.x) < .035 && p.z > 0.) ? vec3(.85,.65,.16) : uBelt; // Gurt + Schnalle
          if (y > .805 && ax < .2) c = uTrim;                        // Kragen
          if (ax > .70 && ax < .76) c = uTrim;                       // Ärmelbund
          if (y > .085 && y < .1) c = uTrim * .9;                    // Stiefelrand
        }
        if (uOpt.z > .5 && c != uBoot && !hand) c *= .82 + .18 * step(.5, fract(p.y * 18.));  // Pyjama-Streifen
        float knit = .9 + .1 * abs(sin(p.x * 700.) * sin(p.y * 700. + p.z * 300.));
        diffuseColor.rgb = c * knit;
      } else diffuseColor.rgb *= vec3(1.3, 1.18, 1.1);
    }`);
  };
  m.customProgramCacheKey = () => 'outfit';
  return m;
}

function rig(src, clips, scale) {
  const model = SU.clone(src.scene);
  model.scale.setScalar(scale);
  const mixer = new THREE.AnimationMixer(model);
  const r = { mixer, clips, actions: {}, cur: null, model, last: new THREE.Vector3(), spd: 0, auto: true };
  model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
  return r;
}
export function play(r, name, fade = .2, ts = 1, once = false) {
  const clip = r.clips[name]; if (!clip) return;
  let a = r.actions[name]; if (!a) { a = r.actions[name] = r.mixer.clipAction(clip); }
  a.timeScale = ts;
  if (r.cur === name) return a;
  if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
  a.reset().play();
  const prev = r.cur && r.actions[r.cur]; if (prev) a.crossFadeFrom(prev, fade, false);
  r.cur = name; return a;
}
function bone(model, name) { let b = null; model.traverse(o => { if (!b && o.isBone && o.name === name) b = o; }); return b; }
// Objekt an Knochen hängen, so dass es in der Grundpose an Weltposition wp mit Welt-Ausrichtung steht
function attach(model, b, obj, wp) {
  model.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(b.matrixWorld).invert();
  const m = new THREE.Matrix4().compose(wp, new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
  m.premultiply(inv); m.decompose(obj.position, obj.quaternion, obj.scale);
  b.add(obj);
}

const COAT = { coatRed: 0xa8161c, coatGreen: 0x2a6a3e, coatBlue: 0x2c4c8c };
// ---------- Wichtel ----------
export function makeWichtel(o = {}) {
  const src = o.female ? A.woman : A.man, S = .74;
  const r = rig(src, A.clips, S);
  const H = o.female ? 1.767 : 1.81, X = o.female ? .834 : .929;
  const top = COAT[o.coat] ?? (typeof o.coat === 'number' ? o.coat : 0xa8161c);
  r.model.traverse(m => {
    if (m.isMesh && /Superhero/i.test(m.material.name)) m.material = outfitMaterial(m.material, { elf: 1, top, pants: o.pants || 0x3a3f4f, boot: 0x2b1a10, trim: 0xf4f1ea, belt: 0x1d1410, mit: o.mitten || 0x2f6b3e }, H, X);
  });
  const head = bone(r.model, 'Head');
  // grösserer Kopf = Wichtel-Proportionen
  head.scale.setScalar(1.42);
  r.model.scale.set(S * 1.12, S, S * 1.12);
  const fur = new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 1 });
  const hatMat = new THREE.MeshStandardMaterial({ color: o.hat ?? 0xc4161c, roughness: .9, map: o.stripes && MD.T.knit ? MD.T.knit : null });
  const hat = new THREE.Group();
  const cone = new THREE.Mesh(MD.bentCone(.118, .36, -.16), hatMat); cone.castShadow = true; hat.add(cone);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(.115, .028, 10, 28), fur); rim.rotation.x = Math.PI / 2; rim.position.y = .01; hat.add(rim);
  const pom = new THREE.Mesh(new THREE.SphereGeometry(.035, 12, 10), fur); pom.position.set(-.16, .32, 0); hat.add(pom);
  hat.rotation.x = -.12;
  attach(r.model, head, hat, new THREE.Vector3(0, (H - .035) * S, -.015 * S));
  hat.scale.setScalar(S); hat.userData.cone = cone;
  if (o.beard) {
    const bd = new THREE.Mesh(new THREE.SphereGeometry(.075, 16, 12), fur); bd.scale.set(1.05, 1.35, .7);
    attach(r.model, head, bd, new THREE.Vector3(0, (H - .225) * S, .07 * S)); bd.scale.multiplyScalar(S);
    const mo = new THREE.Mesh(new THREE.CapsuleGeometry(.018, .06, 4, 8), fur); mo.rotation.z = Math.PI / 2;
    attach(r.model, head, mo, new THREE.Vector3(0, (H - .175) * S, .1 * S)); mo.scale.multiplyScalar(S); mo.rotation.z = Math.PI / 2;
  }
  // Wichtel-Kittel: ausgestellter Rock mit Fellsaum an der Hüfte
  const pel = bone(r.model, 'pelvis');
  if (pel) {
    const kit = new THREE.Group();
    const coatM = new THREE.MeshStandardMaterial({ color: top, roughness: .9 });
    const sk = new THREE.Mesh(new THREE.CylinderGeometry(.16, .2, .15, 22, 1, true), coatM); sk.position.y = -.075; sk.material.side = THREE.DoubleSide; kit.add(sk);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(.2, .02, 8, 26), fur); hem.rotation.x = Math.PI / 2; hem.position.y = -.15; kit.add(hem);
    kit.scale.set(o.female ? .95 : 1, 1, .82);
    attach(r.model, pel, kit, new THREE.Vector3(0, (H * .575) * S, 0)); kit.scale.multiplyScalar(1);
    kit.traverse(m => m.castShadow = true);
  }
  // Stiefel mit Spitze
  const bootM = new THREE.MeshStandardMaterial({ color: 0x3a2214, roughness: .5 });
  for (const sd of ['l', 'r']) { const fb = bone(r.model, 'foot_' + sd); if (!fb) continue; r.model.updateMatrixWorld(true); const fp = new THREE.Vector3().setFromMatrixPosition(fb.matrixWorld);
    const bt = new THREE.Group(); const b1 = new THREE.Mesh(MD.roundBox(.12, .11, .25, .045), bootM); b1.position.z = .05; bt.add(b1); const tip = new THREE.Mesh(new THREE.ConeGeometry(.04, .12, 10), bootM); tip.rotation.x = Math.PI / 2 + .5; tip.position.set(0, .04, .2); bt.add(tip); bt.traverse(m => m.castShadow = true);
    attach(r.model, fb, bt, new THREE.Vector3(fp.x, .055 * S, fp.z + .02 * S)); bt.scale.multiplyScalar(S); }
  // spitze Ohren
  const skin = new THREE.MeshStandardMaterial({ color: 0xe9b392, roughness: .6 });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.ConeGeometry(.022, .07, 8), skin); attach(r.model, head, e, new THREE.Vector3(s * .085 * S, (H - .12) * S, -.005 * S)); e.scale.multiplyScalar(S); e.rotateZ(-s * 1.1); }
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.add(r.model);
  play(r, 'Idle_Loop', 0);
  r.mixer.setTime(Math.random() * 3);
  const dummy = () => new THREE.Object3D();
  root.userData = { rig: r, body, head, hat, legs: [dummy(), dummy()], arms: [dummy(), dummy()], t: 0 };
  root.userData.rig.root = root; RIGS.add(r);
  return root;
}

export function animateWichtel(w, dt, speed, st = {}) {
  const u = w.userData, r = u.rig;
  let clip = 'Idle_Loop', ts = 1, once = false;
  if (st.throwT > 0) { clip = 'Spell_Simple_Shoot'; once = true; ts = 1.6; }
  else if (st.air) {
    if (st.glide) clip = 'Swim_Fwd_Loop';
    else if (st.vy > 1.5) { clip = 'Jump_Start'; once = true; ts = 1.4; }
    else clip = 'Jump_Loop';
  }
  else if (st.land > .45) { clip = 'Jump_Land'; once = true; ts = 1.5; }
  else if (st.cheer > 0) clip = 'Dance_Loop';
  else if (st.talk) clip = 'Idle_Talking_Loop';
  else if (st.work) clip = st.work;
  else if (st.sneak) { clip = speed > .25 ? 'Crouch_Fwd_Loop' : 'Crouch_Idle_Loop'; ts = speed > .25 ? Math.max(.6, Math.min(1.6, speed / 2.2)) : 1; }
  else if (speed > .25) {
    if (speed < 3.4) { clip = 'Walk_Loop'; ts = Math.max(.7, speed / 1.9); }
    else if (speed < 7) { clip = 'Jog_Fwd_Loop'; ts = Math.max(.8, speed / 4.4); }
    else { clip = 'Sprint_Loop'; ts = Math.min(1.5, speed / 7.5); }
  }
  play(r, clip, st.air || st.land ? .1 : .22, ts, once);
  // Saltos und Lande-Stauchung bleiben prozedural
  const L = (a, b, k) => a + (b - a) * Math.min(1, dt * k);
  if (st.flip > 0) { const th = (1 - st.flip) * Math.PI * 2; u.body.rotation.x = th; u.body.position.set(0, .6 - .6 * Math.cos(th), -.6 * Math.sin(th)); }
  else { u.body.rotation.x = L(u.body.rotation.x, 0, 10); u.body.position.set(0, 0, 0); }
  const sq = st.land || 0; u.body.scale.set(1 + sq * .1, 1 - sq * .15, 1 + sq * .1);
  r.ticked = true;
}

// ---------- Menschen (Eltern im Pyjama) ----------
export function makeHuman(o = {}) {
  const fem = o.hair === 1;
  const src = fem ? A.woman : A.man, S = 6.3, H = fem ? 1.767 : 1.81, X = fem ? .834 : .929;
  const r = rig(src, A.clips, S);
  r.model.traverse(m => { if (m.isMesh && /Superhero/i.test(m.material.name)) m.material = outfitMaterial(m.material, { top: o.pj || 0x5a7ab8, pants: o.pj || 0x5a7ab8, boot: 0x8a2a2a, stripes: 1 }, H, X); });
  const g = new THREE.Group(); g.add(r.model);
  // Haare
  const head = bone(r.model, 'Head');
  const hair = new THREE.Mesh(new THREE.SphereGeometry(.112, 20, 14, 0, Math.PI * 2, 0, Math.PI * .55), new THREE.MeshStandardMaterial({ color: [0x3a2414, 0xc89a5a, 0x1a1a1a][o.hair || 0], roughness: .9 }));
  attach(r.model, head, hair, new THREE.Vector3(0, (H - .1) * S, -.01 * S)); hair.scale.multiplyScalar(S); hair.rotateX(-.25);
  // Taschenlampe mit Lichtkegel (am Körper, nicht an der Hand -> ruhiger)
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(.25, .3, 1, 10), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: .6, roughness: .4 }));
  lamp.position.set(2.1, 6, 1.2); lamp.rotation.x = Math.PI / 2; g.add(lamp);
  const cg = new THREE.ConeGeometry(5, 18, 24, 1, true); cg.translate(0, -9, 0); cg.rotateX(-Math.PI / 2);
  const cone = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  cone.position.set(2.1, 6, 1.6); cone.rotation.x = .28; g.add(cone);
  const spot = new THREE.SpotLight(0xfff0c0, 80, 40, .4, .5, 1.2); spot.position.set(2.1, 6, 1.6); g.add(spot); const tgt = new THREE.Object3D(); tgt.position.set(2.1, 0, 16); g.add(tgt); spot.target = tgt;
  play(r, 'Idle_Torch_Loop', 0);
  g.userData = { rig: r, legs: [], arms: [new THREE.Object3D(), new THREE.Object3D()], cone, spot, t: 0 };
  r.root = g; RIGS.add(r);
  return g;
}
export function animateHuman(h, dt, speed) {
  const r = h.userData.rig;
  if (speed > 5.5) play(r, 'Jog_Fwd_Loop', .3, Math.max(.5, speed / 16));
  else if (speed > .3) play(r, 'Walk_Loop', .3, Math.max(.45, speed / 7.5));
  else play(r, 'Idle_Torch_Loop', .4);
  r.ticked = true;
}

// ---------- Katze / Hund (Fuchs-Modell, Khronos glTF-Beispiel, CC-BY) ----------
export function makeAnimal(kind = 'cat') {
  const r = rig(A.fox, A.foxClips, 1);
  const box = new THREE.Box3().setFromObject(r.model); const sz = box.getSize(new THREE.Vector3());
  const len = Math.max(sz.x, sz.z), want = kind === 'dog' ? 6 : 4.6;
  r.model.scale.setScalar(want / len);
  if (kind === 'dog') r.model.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = vec3(dot(diffuseColor.rgb, vec3(.3,.59,.11))) * vec3(.78,.7,.6);'); }; m.material.customProgramCacheKey = () => 'dog'; } });
  const inner = new THREE.Group(); inner.rotation.y = Math.PI / 2; inner.add(r.model); // Blick nach +x wie das alte Modell
  const g = new THREE.Group(); g.add(inner);
  // leuchtende Augen am Kopfknochen
  let hb = null; r.model.traverse(o => { if (!hb && o.isBone && /head/i.test(o.name)) hb = o; });
  const eyes = [];
  if (hb) {
    r.model.updateMatrixWorld(true);
    const hp = new THREE.Vector3().setFromMatrixPosition(hb.matrixWorld);
    const em = new THREE.MeshStandardMaterial({ color: kind === 'dog' ? 0xffc040 : 0x9aff6a, emissive: kind === 'dog' ? 0xff9a20 : 0x6aff40, emissiveIntensity: 1.5 });
    for (const s of [-1, 1]) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(.018 * want, 10, 8), em);
      attach(r.model, hb, e, new THREE.Vector3(hp.x + s * .03 * want, hp.y + .0 * want, hp.z + .1 * want));
      eyes.push(e);
    }
  }
  play(r, 'Survey', 0);
  g.userData = { rig: r, head: new THREE.Object3D(), eyes, legs: [], tail: null, t: 0 };
  r.root = g; r.animal = true; RIGS.add(r);
  return g;
}

// Pro Frame: alle Mixer laufen lassen. Tiere wählen ihre Animation selbst nach Tempo.
export function tick(dt) {
  for (const r of RIGS) {
    const root = r.root; if (!root || !root.parent) continue;
    if (r.animal) {
      const p = root.position, sp = r.last.distanceTo(p) / Math.max(dt, 1e-4); r.last.copy(p);
      r.spd += (Math.min(sp, 30) - r.spd) * Math.min(1, dt * 6);
      const sleep = root.userData.sleep;
      if (sleep) play(r, 'Survey', .5, .15);
      else if (r.spd > 6) play(r, 'Run', .25, Math.max(.6, r.spd / 11));
      else if (r.spd > .5) play(r, 'Walk', .25, Math.max(.6, r.spd / 3.5));
      else play(r, 'Survey', .4, 1);
    } else if (!r.ticked) { /* nicht animiert in diesem Frame -> idle lassen */ }
    r.ticked = false;
    r.mixer.update(dt);
  }
}
export function forget(obj) { const r = obj.userData && obj.userData.rig; if (r) RIGS.delete(r); }

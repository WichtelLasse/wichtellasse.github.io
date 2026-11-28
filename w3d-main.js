// Wichtel 3D – Das Leben im Wichteldorf
import * as THREE from './three.min.js';
import { makeTextures } from './w3d-tex.js?v=8';
import * as MD from './w3d-models.js?v=8';
import * as W from './w3d-world.js?v=8';
import { Particles, Footprints, candyFly } from './w3d-fx.js?v=8';
import * as TR from './w3d-travel.js?v=8';

const $ = s => document.querySelector(s);
const isTouch = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const QP = new URLSearchParams(location.search), TEST = QP.has('test');
const LOW = TEST || isTouch || (navigator.hardwareConcurrency || 8) <= 4;
document.body.classList.toggle('touch', isTouch);

// ================= Spielstand =================
const SKEY = 'wl3d_save_v1';
const def = () => ({ name: '', coat: 'coatRed', hat: 0xc4161c, beard: false, candy: 25, xp: 0, stars: [], built: [], missions: 0, rings: 0, ringIdx: 0, tut: 0, day: '', tasks: [], tp: {}, tclaimed: false, streak: 0, lastDone: '', facts: [], music: true, sound: true, jobs: 0 });
let S; try { S = Object.assign(def(), JSON.parse(localStorage.getItem(SKEY)) || {}); } catch (e) { S = def(); }
const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(S)); } catch (e) { } };
const RANKS = [[0, 'Wichtel-Lehrling'], [120, 'Junior-Wichtel'], [350, 'Wichtel'], [800, 'Meister-Wichtel'], [1600, 'Ober-Wichtel'], [3000, 'Nordpol-Legende']];
const rank = () => { let i = 0; RANKS.forEach((r, k) => { if (S.xp >= r[0]) i = k; }); return i; };
function addXP(n) { const r0 = rank(); S.xp += n; if (n >= 10) P.cheer = 1; if (rank() > r0) { toast('🎉 Neuer Rang: ' + RANKS[rank()][1] + '!', 4000); sfx('rank'); } hud(); save(); }
function addCandy(n) { S.candy += n; if (n > 0) { try { candyFly(camera, player.getWorldPosition(new THREE.Vector3()).setY(player.getWorldPosition(new THREE.Vector3()).y + 1), Math.ceil(n / 3), $('#candy').parentNode); } catch (e) { } floatText('+' + n); } hud(); save(); }

// ================= Tagesaufgaben =================
const TASKS = { bake: ['Backe Plätzchen in der Bäckerei', 1], toy: ['Baue Spielzeug in der Werkstatt', 1], school: ['Mach den Unterricht in der Akademie', 1], post: ['Sortiere Wunschzettel in der Post', 1], stall: ['Füttere die Rentiere', 1], build: ['Bau etwas Neues ins Dorf', 1], mission: ['Mach einen Streich bei einem Kind', 1], rings: ['Flieg durch 5 Nordlicht-Ringe', 5], stars: ['Finde 2 Glitzersterne', 2], talk: ['Rede mit 3 Wichteln', 3] };
function today() { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function ensureDay() {
  const t = today(); if (S.day === t) return;
  const keys = Object.keys(TASKS); let seed = [...t].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0; const pick = [];
  while (pick.length < 3) { seed = (seed * 1103515245 + 12345) >>> 0; const k = keys[seed % keys.length]; if (!pick.includes(k)) pick.push(k); }
  S.day = t; S.tasks = pick; S.tp = {}; S.tclaimed = false; save();
}
function taskDone(k) { return (S.tp[k] || 0) >= TASKS[k][1]; }
function progress(k, n = 1) {
  try { questEvent(k); } catch (e) { console.error(e); }
  ensureDay(); if (!S.tasks.includes(k) || taskDone(k)) return;
  S.tp[k] = (S.tp[k] || 0) + n; if (taskDone(k)) { toast('✅ Tagesaufgabe geschafft: ' + TASKS[k][0]); sfx('ok'); }
  if (S.tasks.every(taskDone) && !S.tclaimed) toast('🏆 Alle Tagesaufgaben fertig! Hol die Belohnung im Rathaus.', 4500);
  save(); renderTasks();
}

// ================= Ton =================
let AC = null, master = null, musicGain = null;
function audio() { if (AC) { if (AC.state === 'suspended') AC.resume(); return; } try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = S.sound ? .9 : 0; master.connect(AC.destination); musicGain = AC.createGain(); musicGain.gain.value = S.music ? .12 : 0; musicGain.connect(master); wind(); music(); } catch (e) { } }
function tone(f, d, type = 'sine', v = .12, at = 0, dest) { if (!AC) return; const t = AC.currentTime + at, o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + .05); }
function noiseBurst(d, f, v) { if (!AC) return; const b = AC.createBuffer(1, AC.sampleRate * d, AC.sampleRate), a = b.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length); const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; fl.type = 'lowpass'; fl.frequency.value = f; g.gain.value = v; s.connect(fl); fl.connect(g); g.connect(master); s.start(); }
function tone2() { tone(660, .12, 'triangle', .07); tone(990, .2, 'triangle', .06, .06); }
function sfx(k) {
  if (!AC) return;
  if (k === 'coin') { tone(988, .12, 'triangle', .1); tone(1319, .25, 'triangle', .1, .08); }
  else if (k === 'star') { [784, 988, 1175, 1568].forEach((f, i) => tone(f, .3, 'triangle', .09, i * .06)); }
  else if (k === 'rank') { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .5, 'triangle', .1, i * .1)); }
  else if (k === 'ok') { tone(659, .15, 'square', .05); tone(988, .3, 'square', .05, .1); }
  else if (k === 'fail') { tone(220, .4, 'sawtooth', .07); tone(165, .5, 'sawtooth', .07, .2); }
  else if (k === 'jump') tone(420, .15, 'sine', .08);
  else if (k === 'step') noiseBurst(.07, 900, .05);
  else if (k === 'click') tone(1200, .05, 'square', .03);
  else if (k === 'bell') { tone(880, 1.2, 'sine', .08); tone(1760, .8, 'sine', .03); }
  else if (k === 'meow') { if (!AC) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(900, t + .15); o.frequency.linearRampToValueAtTime(500, t + .5); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.06, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + .55); o.connect(g); g.connect(master); o.start(t); o.stop(t + .6); }
}
function wind() { const b = AC.createBuffer(1, AC.sampleRate * 4, AC.sampleRate), a = b.getChannelData(0); let l = 0; for (let i = 0; i < a.length; i++) { l = (l + .02 * (Math.random() * 2 - 1)) / 1.02; a[i] = l * 3; } const s = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; s.loop = true; fl.type = 'lowpass'; fl.frequency.value = 500; g.gain.value = .25; s.connect(fl); fl.connect(g); g.connect(master); s.start(); }
// Spieluhr-Melodie: «Stille Nacht» (gemeinfrei, Franz Xaver Gruber 1818)
const MEL = [[67, 1.5], [69, .5], [67, 1], [64, 3], [67, 1.5], [69, .5], [67, 1], [64, 3], [74, 2], [74, 1], [71, 3], [72, 2], [72, 1], [67, 3], [69, 2], [69, 1], [72, 1.5], [71, .5], [69, 1], [67, 1.5], [69, .5], [67, 1], [64, 3], [69, 2], [69, 1], [72, 1.5], [71, .5], [69, 1], [67, 1.5], [69, .5], [67, 1], [64, 3], [74, 2], [74, 1], [77, 1.5], [74, .5], [71, 1], [72, 3], [76, 3], [72, 1], [67, 1], [64, 1], [67, 1.5], [65, .5], [62, 1], [60, 6]];
function music() { let t = AC.currentTime + 1; const beat = .42; const loop = () => { if (!AC) return; let tt = t; for (const [n, d] of MEL) { const f = 440 * Math.pow(2, (n - 69) / 12); tone(f, d * beat * 1.6, 'triangle', .5, tt - AC.currentTime, musicGain); tone(f * 2, d * beat, 'sine', .12, tt - AC.currentTime, musicGain); tt += d * beat; } t = tt + 6; setTimeout(loop, (t - AC.currentTime - 2) * 1000); }; loop(); }

// ================= Grafik =================
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, LOW ? 1.25 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !QP.has('ns'); renderer.shadowMap.type = THREE.PCFSoftShadowMap;
if (QP.has('ns')) renderer.setPixelRatio(.5);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1; renderer.outputColorSpace = THREE.SRGBColorSpace;
$('#game').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .1, 1400);
function fit() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 300)); if (window.visualViewport) visualViewport.addEventListener('resize', fit);
['gesturestart', 'gesturechange', 'dblclick'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (!e.target.closest('.panel,.tbox,#taskbox')) e.preventDefault(); }, { passive: false });

MD.setTextures(makeTextures());
const village = new THREE.Scene();
village.fog = new THREE.FogExp2(0x0d1a36, .0075);
const sky = W.makeSky(); village.add(sky);
const hemi = new THREE.HemisphereLight(0xa8c4f0, 0x2a3550, 1.1); village.add(hemi);
const sun = new THREE.DirectionalLight(0xc8d8ff, 1.7); sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048); Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 160 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .04;
village.add(sun, sun.target);
// Gelände
{
  const seg = LOW ? 150 : 230, g = new THREE.PlaneGeometry(760, 760, seg, seg); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, W.H(p.getX(i), p.getZ(i))); g.computeVertexNormals();
  const ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: MD.T.snow, normalMap: MD.T.snowN, normalScale: new THREE.Vector2(.55, .55), roughness: .9, color: 0xffffff }));
  ground.receiveShadow = true; village.add(ground);
}
const V = W.buildVillage(village);
const snow = W.makeSnowfall(LOW ? 1300 : 2800); village.add(snow);
const smoke = W.makeSmoke(V.chimneys); village.add(smoke);
const colliders = V.colliders, circles = V.circles;
const REG = W.buildRegions(village, colliders, circles);
const FX = new Particles(village, LOW ? 260 : 500);
const STEPS = new Footprints(village, LOW ? 120 : 220);
// Leuchten (Bloom) auf starken Geräten
let composer = null, renderPass = null;
if (!LOW && !QP.has('nobloom')) {
  Promise.all([import('./pp-EffectComposer.js'), import('./pp-RenderPass.js'), import('./pp-UnrealBloomPass.js'), import('./pp-OutputPass.js')]).then(([E, R, U, O]) => {
    composer = new E.EffectComposer(renderer); renderPass = new R.RenderPass(village, camera); composer.addPass(renderPass);
    composer.addPass(new U.UnrealBloomPass(new THREE.Vector2(innerWidth / 2, innerHeight / 2), .55, .5, .82)); composer.addPass(new O.OutputPass());
    composer.setSize(innerWidth, innerHeight);
  }).catch(() => { composer = null; });
}
addEventListener('resize', () => { if (composer) composer.setSize(innerWidth, innerHeight); FX.resize(); });

// ================= Spieler =================
let player = null;
function makePlayer() {
  const old = player; player = MD.makeWichtel({ coat: S.coat, hat: S.hat, beard: S.beard, stripes: S.hat === 'stripes' });
  if (S.hat === 'stripes') player.userData.head.children.forEach(c => { if (c.material && c.material.map === null && c.geometry.type === 'ConeGeometry') { c.material.map = MD.T.knit; c.material.color.set(0xffffff); c.material.needsUpdate = true; } });
  if (old) { player.position.copy(old.position); player.rotation.copy(old.rotation); old.parent && old.parent.remove(old); }
  return player;
}
makePlayer(); village.add(player);
const P = { pos: new THREE.Vector3(0, 0, 22), vel: new THREE.Vector3(), vy: 0, onG: true, mode: 'title', boost: 0, stepT: 0, scene: village, jumps: 0, flip: 0, land: 0, cheer: 0, glide: false, airT: 0, throwT: 0 };
player.position.copy(P.pos);

// Kamera
const CAM = { yaw: 0, pitch: .38, dist: 7.5, tgt: new THREE.Vector3() };

// ================= NPC-Wichtel =================
const NPCS = [
  { n: 'Oma Zimt', coat: 'coatGreen', hat: 0xd8a62a, beard: false, home: 'baeckerei', say: ['Probier meine Zimtsterne, Liebes! Aber nicht alle auf einmal.', 'In der Bäckerei kannst du dir Zuckerstangen verdienen. Trau dich!', 'Weisst du, warum Wichtel nachts arbeiten? Weil dann die Kinder schlafen.'] },
  { n: 'Professor Knopf', coat: 'coatBlue', hat: 0x2a3e6a, beard: true, home: 'schule', say: ['In der Akademie lernst du alles, was ein guter Wichtel wissen muss.', 'Merke: Ein Wichtel lässt sich nie erwischen. Sonst verliert er seine Zauberkraft!', 'Wer viel lernt, steigt schneller im Rang auf.'] },
  { n: 'Flocki', coat: 'coatRed', hat: 0x2a6ad8, beard: false, home: 'werkstatt', say: ['Hast du schon das Nordlicht-Tor gesehen? Dahinter liegt die Menschenwelt!', 'Mit dem Wichtelmobil kannst du durch die Ringe am Himmel fliegen. Das macht so Spass!', 'Ich habe einen Glitzerstern auf einem Dach gesehen. Nur von oben erreichbar …'] },
  { n: 'Funki', coat: 'coatGreen', hat: 0x7a2a22, beard: false, home: 'stall', say: ['Die Rentiere haben Hunger. Hilfst du mir beim Füttern?', 'Blitzi klaut mir jeden Morgen die Mütze.', 'Rentiere lieben Äpfel. Und Kraulen hinter den Ohren.'] },
  { n: 'Frau Post', coat: 'coatBlue', hat: 0xc4161c, beard: false, home: 'post', say: ['So viele Wunschzettel! Ich komme gar nicht nach.', 'Kinder aus der ganzen Welt schreiben uns. Sogar aus der Schweiz!', 'Hilf mir sortieren, dann gibt es Zuckerstangen.'] },
  { n: 'Bürgermeister Bommel', coat: 'coatRed', hat: 0x1f1f1f, beard: true, home: 'rathaus', say: ['Im Rathaus holst du die Belohnung für deine Tagesaufgaben ab.', 'Unser Dorf wird jedes Jahr schöner. Bau mit!', 'Jeden Tag gibt es neue Aufgaben. Wer dranbleibt, bekommt einen Bonus.'] },
  { n: 'Kakao-Kurt', coat: 'coatGreen', hat: 0x8a5a2a, beard: true, home: 'cafe', say: ['Ein heisser Kakao macht schnelle Beine!', 'Mit Sahne oder mit extra Sahne?', 'Im Café ist es immer warm.'] },
  { n: 'Marktfrau Nelli', coat: 'coatGreen', hat: 0xd8a62a, beard: false, home: 'bib', stay: [80, 20], say: ['Willkommen auf dem Weihnachtsmarkt! Hier duftet es nach gebrannten Mandeln.', 'Hast du die Eishöhle im Norden schon gesehen? Dort glitzert es überall!', 'Die Lichterketten hier hat Flocki aufgehängt. Ganz allein!'] },
  { n: 'Höhlenforscher Ole', coat: 'coatBlue', hat: 0x2f8a4e, beard: true, home: 'bib', stay: [-50, -84], say: ['Die Eishöhle ist uralt. Die Kristalle leuchten seit tausend Jahren.', 'Irgendwo hier drin sollen Glitzersterne versteckt sein …', 'Pass auf, der Boden ist rutschig!'] },
  { n: 'Lotte', coat: 'coatRed', hat: 0xff4fa8, beard: false, home: 'bib', say: ['In der Bibliothek gibt es Wichtel-Wissen. Lies alles, dann wirst du schlauer!', 'Auf dem gefrorenen See kann man rutschen. Juhuu!', 'Hast du schon alle Glitzersterne gefunden?'] },
];
const npcs = NPCS.map((d, i) => { const m = MD.makeWichtel({ coat: d.coat, hat: d.hat, beard: d.beard }); const door = V.doors.find(x => x.id === d.home) || V.doors[0]; m.position.set(door.pos.x, 0, door.pos.z); if (d.stay) m.position.set(d.stay[0], W.H(d.stay[0], d.stay[1]), d.stay[1]); village.add(m); return { d, m, target: null, wait: Math.random() * 3, talkedToday: false }; });
function npcTarget(n) { const all = V.doors.filter(x => x.job); const t = Math.random() < .35 ? new THREE.Vector3((Math.random() - .5) * 20, 0, (Math.random() - .5) * 20) : all[Math.floor(Math.random() * all.length)].pos.clone(); n.target = t; }

// ================= Glitzersterne =================
const starMeshes = [];
W.STAR_SPOTS.forEach(([x, z, y], i) => { if (S.stars.includes(i)) return; const s = W.makeStar(); s.position.set(x, W.H(x, z) + y + .8, z); s.userData.i = i; village.add(s); starMeshes.push(s); });

// ================= Ringe am Himmel =================
const rings = [];
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = 70 + Math.sin(i * 1.7) * 18; const g = new THREE.Mesh(new THREE.TorusGeometry(4, .35, 10, 40), new THREE.MeshStandardMaterial({ color: 0x9fffd8, emissive: 0x30ffa8, emissiveIntensity: .6, transparent: true, opacity: .55 })); g.position.set(Math.cos(a) * r, 18 + Math.sin(i * 2.3) * 9, Math.sin(a) * r); g.lookAt(Math.cos(a + .3) * r, g.position.y, Math.sin(a + .3) * r); village.add(g); rings.push(g); }
function ringStyle() { rings.forEach((r, i) => { const on = i === S.ringIdx % 12; r.material.emissive.set(on ? 0xffc040 : 0x30ffa8); r.material.emissiveIntensity = on ? 2.2 : .5; r.material.opacity = on ? .95 : .4; r.scale.setScalar(on ? 1.15 : 1); }); }
ringStyle();

// ================= Wichtelmobil =================
const mobil = MD.makeWichtelmobil(); mobil.position.set(W.PAD.x, W.H(W.PAD.x, W.PAD.z) + .7, W.PAD.z); mobil.rotation.y = Math.PI; village.add(mobil);
const F = { speed: 18, yaw: Math.PI, pitch: 0, roll: 0 };

// ================= Gebautes laden =================
const CAT = [
  { id: 'tanne', n: 'Tanne', p: 10, r: 0, rad: 1.4 }, { id: 'laterne', n: 'Laterne', p: 15, r: 0, rad: .6 }, { id: 'bank', n: 'Bank', p: 12, r: 0, rad: 1.2 },
  { id: 'schneemann', n: 'Schneemann', p: 20, r: 0, rad: .9 }, { id: 'geschenke', n: 'Geschenkberg', p: 25, r: 0, rad: 1.3 }, { id: 'brunnen', n: 'Eisbrunnen', p: 60, r: 1, rad: 2.6 },
  { id: 'stand', n: 'Marktstand', p: 70, r: 1, rad: 2.4 }, { id: 'rentier', n: 'Rentier', p: 90, r: 1, rad: 1.4 }, { id: 'haus', n: 'Wichtelhaus', p: 120, r: 1, rad: 4.6 },
  { id: 'lebkuchen', n: 'Lebkuchenhaus', p: 180, r: 2, rad: 4.4 }, { id: 'turm', n: 'Glockenturm', p: 250, r: 3, rad: 2.2 }, { id: 'christbaum', n: 'Grosser Christbaum', p: 300, r: 3, rad: 3.6 }
];
const treeGeo = MD.spruceGeometry(5, 7), treeMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 });
function makeItem(id) {
  let g;
  if (id === 'tanne') { g = new THREE.Group(); const m = new THREE.Mesh(treeGeo, treeMat); m.castShadow = m.receiveShadow = true; g.add(m); }
  else if (id === 'laterne') g = MD.makeLantern();
  else if (id === 'bank') g = MD.makeBench();
  else if (id === 'schneemann') g = MD.makeSnowman();
  else if (id === 'geschenke') { g = new THREE.Group(); [0xc4161c, 0x2a6ad8, 0x2f8a4e, 0xd8a62a, 0x8a3ad8, 0xc4161c].forEach((c, i) => { const b = MD.makeGift(c); b.position.set(Math.cos(i * 2.1) * .7 * (i < 4 ? 1 : .2), i < 4 ? 0 : .45 * (i - 3), Math.sin(i * 2.1) * .7 * (i < 4 ? 1 : .2)); b.scale.setScalar(1.2 - i * .08); b.rotation.y = i; g.add(b); }); }
  else if (id === 'brunnen') { g = new THREE.Group(); const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.5, .9, 32, 1, true), new THREE.MeshStandardMaterial({ map: MD.T.stone, roughness: .9, side: THREE.DoubleSide })); basin.position.y = .45; g.add(basin); const ice = new THREE.Mesh(new THREE.CircleGeometry(2.25, 32), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, roughness: .05, metalness: .2 })); ice.rotation.x = -Math.PI / 2; ice.position.y = .7; g.add(ice); const col = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.5, 0], [.25, .8], [.4, 1.6], [.15, 2.4], [.3, 2.9], [0, 3.1]].map(([x, y]) => new THREE.Vector2(x, y)), 18), new THREE.MeshStandardMaterial({ color: 0xd8f2ff, roughness: .05, metalness: .1, transparent: true, opacity: .85 })); col.position.y = .7; g.add(col); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); }
  else if (id === 'stand') { g = new THREE.Group(); const wood = new THREE.MeshStandardMaterial({ map: MD.T.wood, roughness: .8 }); const counter = new THREE.Mesh(MD.roundBox(3.6, 1.1, 1.4, .08), wood); counter.position.y = .55; g.add(counter); for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.CylinderGeometry(.08, .08, 2.8, 8), wood); post.position.set(sx * 1.7, 1.4, -.6); g.add(post); const p2 = post.clone(); p2.position.z = .6; g.add(p2); } const c = document.createElement('canvas'); c.width = 128; c.height = 8; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#fff' : '#c4161c'; x.fillRect(i * 16, 0, 16, 8); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const roof = new THREE.Mesh(new THREE.BoxGeometry(4.2, .12, 2), new THREE.MeshStandardMaterial({ map: t, roughness: .9 })); roof.position.set(0, 2.85, 0); roof.rotation.x = .25; g.add(roof); const sn = new THREE.Mesh(MD.roundBox(4.1, .14, 1.9, .07), new THREE.MeshStandardMaterial({ color: 0xf6f9ff, roughness: .95 })); sn.position.set(0, 3, .02); sn.rotation.x = .25; g.add(sn); for (let i = 0; i < 6; i++) { const ck = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .06, 12), new THREE.MeshStandardMaterial({ color: 0xb8742a, roughness: .7 })); ck.position.set(-1.3 + i * .5, 1.14, .2); g.add(ck); } const lamp = new THREE.Mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe2a0, emissive: 0xffb04a, emissiveIntensity: 2.5 })); lamp.position.set(0, 2.5, .3); g.add(lamp); g.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = true; }); }
  else if (id === 'rentier') { g = MD.makeReindeer(); g.scale.setScalar(.85); }
  else if (id === 'haus') g = W.mergeStatic(MD.makeBuilding({ w: 7, d: 6, h: 3.8, wall: ['wood', 'woodRed', 'woodBlue', 'woodGreen'][Math.floor(Math.random() * 4)], roof: 'roofRed', door: 1, seed: Math.floor(Math.random() * 50) }));
  else if (id === 'lebkuchen') { const b = MD.makeBuilding({ w: 7, d: 6, h: 3.6, wall: 'woodCream', roof: 'roofDark', door: 1, seed: 7 }); b.traverse(o => { if (o.isMesh && o.material.map && o.material.map.image === MD.T.woodCream.image) { o.material = o.material.clone(); o.material.color.set(0xa0622a); } }); g = W.mergeStatic(b); for (let i = 0; i < 4; i++) { const cane = new THREE.Mesh(new THREE.CylinderGeometry(.12, .12, 2.2, 10), new THREE.MeshStandardMaterial({ map: MD.T.knit, roughness: .4 })); cane.position.set(-1.4 + (i % 2) * 2.8, 1.8, 3.4 + (i > 1 ? .2 : 0)); g.add(cane); } }
  else if (id === 'turm') g = MD.makeTower(7);
  else if (id === 'christbaum') g = MD.makeXmasTree(10);
  return g;
}
const builtObjs = [];
function placeBuilt(b) { const def = CAT.find(c => c.id === b.id); if (!def) return; const g = makeItem(b.id); g.position.set(b.x, W.H(b.x, b.z) - (b.id === 'haus' || b.id === 'lebkuchen' ? .2 : 0), b.z); g.rotation.y = b.r; village.add(g); const c = { x: b.x, z: b.z, r: def.rad * .75, built: true }; circles.push(c); builtObjs.push({ b, g, c }); }
S.built.forEach(placeBuilt);

// ================= UI-Helfer =================
let toastT = 0;
function toast(m, ms = 2600) { if (isTouch) ms = Math.min(ms, 2200); const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
function floatText(m) { const e = document.createElement('div'); e.className = 'float'; e.textContent = m; document.body.appendChild(e); setTimeout(() => e.remove(), 1400); }
function hud() { $('#candy').textContent = S.candy; $('#starsN').textContent = S.stars.length + '/' + W.STAR_SPOTS.length; const r = rank(), lo = RANKS[r][0], hi = RANKS[r + 1] ? RANKS[r + 1][0] : lo + 1; $('#rank').textContent = RANKS[r][1]; $('#xpbar').style.width = Math.min(100, (S.xp - lo) / (hi - lo) * 100) + '%'; $('#pname').textContent = S.name || 'Wichtel'; }
function renderTasks() { ensureDay(); $('#tasks').innerHTML = S.tasks.map(k => `<li class="${taskDone(k) ? 'ok' : ''}">${taskDone(k) ? '✅' : '⬜'} ${TASKS[k][0]} <b>${Math.min(S.tp[k] || 0, TASKS[k][1])}/${TASKS[k][1]}</b></li>`).join('') + `<li class="streak">🔥 Serie: ${S.streak} Tag${S.streak === 1 ? '' : 'e'}</li>`; }
function panel(html, cls = '') { const old = $('#panel'), p = old.cloneNode(false); old.replaceWith(p); p.className = 'panel on ' + cls; p.innerHTML = html; P.prev = P.mode === 'ui' ? P.prev : P.mode; P.mode = 'ui'; return p; }
function closePanel() { $('#panel').className = 'panel'; $('#panel').innerHTML = ''; if (P.mode === 'ui') P.mode = P.prev || 'walk'; }
window.addEventListener('click', e => { if (e.target.closest('[data-close]')) { sfx('click'); closePanel(); } });

// ================= Tutorial / Ziel-Kompass =================
const TUT = [['Lauf zur Bäckerei Zimtstern und backe Plätzchen', 'baeckerei'], ['Kauf im Bau-Laden etwas und stell es ins Dorf', 'laden'], ['Steig auf dem Landeplatz ins Wichtelmobil', 'pad'], ['Flieg durch das grüne Nordlicht-Tor zur Menschenwelt', 'portal']];
function tutTarget() { const qt = questTarget(); if (qt) return qt; if (S.tut >= TUT.length) return null; const [txt, id] = TUT[S.tut]; let pos; if (id === 'pad') pos = new THREE.Vector3(W.PAD.x, 0, W.PAD.z); else if (id === 'portal') pos = W.PORTAL.clone(); else pos = V.doors.find(d => d.id === id).pos; return { txt, pos }; }
function tutStep(n) { if (S.tut === n) { S.tut++; save(); } }

// ================= Eingabe =================
const K = {}; let joy = { x: 0, y: 0, on: false }, actionPressed = false, jumpPressed = false;
addEventListener('keydown', e => { K[e.code] = true; if (e.code === 'KeyE' || e.code === 'Enter') actionPressed = true; if (e.code === 'Space') { jumpPressed = true; if (P.mode !== 'ui') e.preventDefault(); } if (e.code === 'KeyB' && P.mode === 'walk') openBuild(); if (e.code === 'KeyM') toggleMap(); if (e.code === 'KeyF') throwBall(); if (e.code === 'Escape') { if (P.mode === 'ui') closePanel(); else if (P.mode === 'build') endBuild(); } if (e.code === 'KeyR' && P.mode === 'build') BUILD.r += Math.PI / 8; });
addEventListener('keyup', e => { K[e.code] = false; });
// Kamera ziehen (Maus/Touch ausserhalb der Steuerung)
let drag = null;
const cvs = renderer.domElement;
cvs.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && e.clientX < innerWidth * .45 && e.clientY > innerHeight * .45) return; drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; cvs.setPointerCapture(e.pointerId); });
cvs.addEventListener('pointermove', e => { if (!drag || drag.id !== e.pointerId) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; CAM.yaw -= dx * .006; CAM.pitch = Math.max(.05, Math.min(1.25, CAM.pitch + dy * .004)); });
cvs.addEventListener('pointerup', e => { if (drag && drag.id === e.pointerId) drag = null; });
cvs.addEventListener('wheel', e => { CAM.dist = Math.max(3.5, Math.min(16, CAM.dist + e.deltaY * .01)); }, { passive: true });
// Joystick
{
  const z = $('#joy'), k = $('#knob'); let id = null, cx = 0, cy = 0;
  const set = (x, y) => { const dx = x - cx, dy = y - cy, l = Math.min(55, Math.hypot(dx, dy)), a = Math.atan2(dy, dx); joy.x = Math.cos(a) * l / 55; joy.y = -Math.sin(a) * l / 55; k.style.transform = `translate(${Math.cos(a) * l}px,${Math.sin(a) * l}px)`; };
  z.addEventListener('pointerdown', e => { id = e.pointerId; const r = z.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.top + r.height / 2; joy.on = true; z.setPointerCapture(id); set(e.clientX, e.clientY); });
  z.addEventListener('pointermove', e => { if (e.pointerId === id) set(e.clientX, e.clientY); });
  const up = e => { if (e.pointerId !== id) return; id = null; joy.on = false; joy.x = joy.y = 0; k.style.transform = ''; }; z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up);
}
$('#btnA').addEventListener('pointerdown', e => { e.preventDefault(); actionPressed = true; holdA = true; });
let holdA = false; addEventListener('pointerup', () => { holdA = false; });
$('#btnJ').addEventListener('pointerdown', e => { e.preventDefault(); jumpPressed = true; holdJ = true; });
let holdJ = false; addEventListener('pointerup', () => { holdJ = false; });
$('#btnD').addEventListener('pointerdown', e => { e.preventDefault(); holdD = true; });
$('#btnS').addEventListener('pointerdown', e => { e.preventDefault(); throwBall(); }); let holdD = false; addEventListener('pointerup', () => { holdD = false; });

// ================= Kollision =================
function collide(p, cols, circs, r = .42) {
  for (const c of cols) {
    const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > c.hw + c.hd + 2 || Math.abs(dz) > c.hw + c.hd + 2) continue;
    if (c.top !== undefined && p.y !== undefined && p.y >= topAt(c, dx, dz) - .15) continue;
    const cs = Math.cos(c.ry), sn = Math.sin(c.ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs, ex = c.hw + r, ez = c.hd + r;
    if (Math.abs(lx) < ex && Math.abs(lz) < ez) { let nx = lx, nz = lz; if (ex - Math.abs(lx) < ez - Math.abs(lz)) nx = Math.sign(lx) * ex; else nz = Math.sign(lz) * ez; p.x = c.x + nx * cs + nz * sn; p.z = c.z - nx * sn + nz * cs; }
  }
  for (const c of circs) { const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > 6 || Math.abs(dz) > 6) continue; if (c.top !== undefined && p.y !== undefined && p.y >= c.top - .15) continue; const d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; } }
}

// Höhe eines Hindernisses an einer Stelle (Dächer sind schräg!)
function topAt(c, dx, dz) {
  if (!c.roof) return c.top;
  const cs = Math.cos(c.ry), sn = Math.sin(c.ry), lx = dx * cs - dz * sn;
  return c.top + .3 + c.roof.rh * Math.max(0, 1 - Math.abs(lx) / c.roof.half);
}
// Worauf steht der Wichtel? Boden, Kiste, Bank, Dach …
function supportY(p, cols, circs, base) {
  let g = base;
  for (const c of cols) {
    if (c.top === undefined || c.top > 500) continue;
    const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > c.hw + c.hd || Math.abs(dz) > c.hw + c.hd) continue;
    const cs = Math.cos(c.ry), sn = Math.sin(c.ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
    if (Math.abs(lx) < c.hw + .25 && Math.abs(lz) < c.hd + .25) { const h = topAt(c, dx, dz); if (p.y >= h - .6) g = Math.max(g, h); }
  }
  for (const c of circs) { if (c.top === undefined) continue; const dx = p.x - c.x, dz = p.z - c.z; if (Math.abs(dx) > c.r + .3 || Math.abs(dz) > c.r + .3) continue; if (Math.hypot(dx, dz) < c.r + .2 && p.y >= c.top - .6) g = Math.max(g, c.top); }
  return g;
}
// Kamera nicht durch Häuser
function camBlock(from, to) {
  const d = to.clone().sub(from), steps = 22, pt = new THREE.Vector3();
  for (let i = 1; i <= steps; i++) {
    pt.copy(from).addScaledVector(d, i / steps);
    for (const c of colliders) {
      if (c.top === undefined || c.top < 1) continue;
      const dx = pt.x - c.x, dz = pt.z - c.z; if (Math.abs(dx) > c.hw + c.hd || Math.abs(dz) > c.hw + c.hd) continue;
      const cs = Math.cos(c.ry), sn = Math.sin(c.ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs;
      if (Math.abs(lx) < c.hw && Math.abs(lz) < c.hd && pt.y < (c.top > 500 ? 30 : topAt(c, dx, dz)) + .4) return from.clone().addScaledVector(d, Math.max(.12, (i - 1.3) / steps));
    }
  }
  return to;
}

// ================= Schneebälle =================
const balls = [];
const ballGeo = new THREE.SphereGeometry(.16, 12, 10), ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 });
function throwBall() {
  if (P.mode !== 'walk' && P.mode !== 'mission' && P.mode !== 'town') return;
  const yaw = player.rotation.y, m = new THREE.Mesh(ballGeo, ballMat); m.castShadow = true;
  m.position.set(P.pos.x + Math.sin(yaw) * .4, P.pos.y + 1.1, P.pos.z + Math.cos(yaw) * .4);
  m.userData.v = new THREE.Vector3(Math.sin(yaw) * 16 + P.vel.x * .5, 5, Math.cos(yaw) * 16 + P.vel.z * .5); m.userData.t = 3;
  // Zielhilfe: nächstes Ziel vor dem Wichtel automatisch anvisieren
  if (P.scene === village) {
    const fw = new THREE.Vector3(Math.sin(CAM.yaw + Math.PI), 0, Math.cos(CAM.yaw + Math.PI)); let best = null, bs = 1e9;
    const cands = targets.map(t => t.userData.root.position.clone().setY(t.userData.root.position.y + 1.6)).concat(npcs.filter(n => n.m.visible).map(n => n.m.position.clone().setY(n.m.position.y + .9)));
    for (const c of cands) { const d = c.clone().sub(m.position); const hd = Math.hypot(d.x, d.z); if (hd > 28 || hd < 1) continue; const dot = (d.x * fw.x + d.z * fw.z) / hd; if (dot < .6) continue; const sc = hd * (1.6 - dot); if (sc < bs) { bs = sc; best = c; } }
    if (best) { const d = best.clone().sub(m.position), hd = Math.hypot(d.x, d.z), t = hd / 17; m.userData.v.set(d.x / t, (d.y + .5 * 14 * t * t) / t, d.z / t); player.rotation.y = Math.atan2(d.x, d.z); }
  }
  else if (P.mode === 'mission' && MS.cat && MS.catState !== 'sleep') { const c = MS.cat.position.clone().setY(2); const d = c.sub(m.position), hd = Math.hypot(d.x, d.z); if (hd < 30) { const t = hd / 17; m.userData.v.set(d.x / t, (d.y + .5 * 14 * t * t) / t, d.z / t); player.rotation.y = Math.atan2(d.x, d.z); } }
  P.scene.add(m); balls.push(m); P.throwT = .35; sfx('jump'); if (P.mode === 'mission') MS.noise += 10;
}
function updateBalls(dt) {
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i], v = b.userData.v; v.y -= 14 * dt; b.position.addScaledVector(v, dt); b.userData.t -= dt;
    let hit = false; const gy = P.scene === village ? W.H(b.position.x, b.position.z) : 0;
    if (b.position.y < gy + .1) hit = true;
    if (P.scene === village) {
      for (const n of npcs) if (n.m.visible && n.m.position.distanceTo(b.position.clone().setY(b.position.y - .8)) < .7) { hit = true; n.hitT = 1.2; n.wait = 1.5; toast('❄️ ' + n.d.n + ': «' + ['Hey! Na warte!', 'Hihi, getroffen!', 'Das gibt Revanche!', 'Brrr, kalt!'][Math.floor(Math.random() * 4)] + '»'); addXP(1); QUEST && QUEST.ev('hitnpc', n.d.n); }
      for (const t of [...targets]) { const rp = t.userData.root.position; if (t.userData.root.visible && Math.hypot(rp.x - b.position.x, rp.z - b.position.z) < 1.1 && Math.abs(rp.y + 1.6 - b.position.y) < 1.1) { hit = true; QUEST && QUEST.ev('target', t); } }
      for (const c of colliders) { const dx = b.position.x - c.x, dz = b.position.z - c.z, cs = Math.cos(c.ry), sn = Math.sin(c.ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; if (Math.abs(lx) < c.hw && Math.abs(lz) < c.hd && b.position.y < (c.top > 500 ? 30 : topAt(c, dx, dz))) { hit = true; break; } }
    }
    if (P.mode === 'mission' && MS.cat && b.position.distanceTo(MS.cat.position.clone().setY(2)) < 2.6) { hit = true; if (MS.catState !== 'sleep') { MS.catState = 'scared'; MS.catT = 4; toast('❄️ Treffer! Die Katze rennt davon.'); sfx('meow'); } }
    if (hit || b.userData.t < 0) { FX.emit(b.position, 14, { speed: 2.5, life: .7, size: .35, grav: 6 }); P.scene.remove(b); balls.splice(i, 1); }
  }
}
const targets = [];
let QUEST = null;

// ================= Interaktion =================
let near = null;
function findNear() {
  if (P.mode === 'walk') {
    for (const d of V.doors) if (d.job && P.pos.distanceTo(d.pos) < 3.2) return { t: 'door', d, label: INSIDE_JOB[d.id] ? d.name + ' betreten' : (JOBLABEL[d.job] ? d.name + ': ' + JOBLABEL[d.job] : d.name) };
    for (const n of npcs) if (n.m.position.distanceTo(P.pos) < 2.4) return { t: 'npc', n, label: 'Mit ' + n.d.n + ' reden' };
    if (Math.hypot(P.pos.x - W.PAD.x, P.pos.z - W.PAD.z) < 5.5) return { t: 'mobil', label: 'Ins Wichtelmobil steigen' };
    if (hay.length) for (const h of hay) if (h.position.distanceTo(P.pos) < 2) return { t: 'hay', h, label: 'Futter aufheben' };
  } else if (P.mode === 'town' && TOWN) {
    for (const h of TOWN.houses) if (Math.hypot(P.pos.x - h.pos.x, P.pos.z - h.pos.z) < 2.4) return { t: 'kidhouse', h, label: 'Durch die Wichteltür: ' + h.name };
    if (Math.hypot(P.pos.x - TOWN.pad.x, P.pos.z - TOWN.pad.z) < 4.5) return { t: 'order', label: orderT > 0 ? 'Wichtelmobil kommt …' : 'Wichtelmobil bestellen (5 Zuckerstangen)' };
  } else if (P.mode === 'inside' && IN) {
    if (Math.hypot(P.pos.x - IN.station.x, P.pos.z - IN.station.z) < 1.5) return { t: 'station', label: IN.stationLabel };
    if (Math.hypot(P.pos.x - IN.exit.x, P.pos.z - IN.exit.z) < 1.6) return { t: 'out', label: 'Nach draussen gehen' };
  } else if (P.mode === 'fly') {
    if (Math.hypot(mobil.position.x - W.PAD.x, mobil.position.z - W.PAD.z) < 14 && mobil.position.y < 30) return { t: 'land', label: 'Landen' };
  } else if (P.mode === 'mission') {
    for (const k of MS.todo) { const s = MS.kh.spots[k]; if (!MS.done.includes(k) && Math.hypot(P.pos.x - s.pos.x, P.pos.z - s.pos.z) < 3.6) return { t: 'prank', k, label: 'Halten: ' + s.name }; }
    if (MS.done.length === MS.todo.length && Math.hypot(P.pos.x - MS.kh.exit.x, P.pos.z - MS.kh.exit.z) < 3.5) return { t: 'exit', label: 'Durch die Wichteltür verschwinden' };
  }
  return null;
}
const JOBLABEL = { bake: 'Plätzchen backen', toy: 'Spielzeug bauen', school: 'Unterricht', post: 'Wunschzettel sortieren', stall: 'Rentiere füttern', cafe: 'Kakao kaufen', build: 'Bau-Laden', home: 'Kleiderschrank', rathaus: 'Tagesaufgaben', lib: 'Wichtel-Wissen lesen', talk: 'Besuchen' };
function interact(n) {
  sfx('click');
  if (n.t === 'door') { if (INSIDE_JOB[n.d.id]) enterBuilding(n.d); else JOBS[n.d.job] && JOBS[n.d.job](n.d); }
  else if (n.t === 'station') JOBS[INSIDE_JOB[IN.door.id]](IN.door);
  else if (n.t === 'out') exitBuilding();
  else if (n.t === 'npc' && questTalk(n.n.d.n)) { if (!n.n.talkedToday) { n.n.talkedToday = true; progress('talk'); } }
  else if (n.t === 'npc') { const line = n.n.d.say[Math.floor(Math.random() * n.n.d.say.length)]; panel(`<h2>${n.n.d.n}</h2><p class="say">«${line}»</p><button class="btn" data-close>Tschüss!</button>`); if (!n.n.talkedToday) { n.n.talkedToday = true; progress('talk'); addXP(2); } }
  else if (n.t === 'mobil') travelMenu();
  else if (n.t === 'kidhouse') startMission({ town: TOWN, pos: P.pos.clone(), variant: n.h.variant });
  else if (n.t === 'order') { if (orderT > 0) return; if (S.candy < 5) { toast('Du brauchst 5 Zuckerstangen für die Bestellung.'); return; } addCandy(-5); orderT = 8; toast('📞 Wichtelmobil bestellt! Es landet in 8 Sekunden.'); }
  else if (n.t === 'land') land();
  else if (n.t === 'hay') { village.remove(n.h); hay.splice(hay.indexOf(n.h), 1); sfx('coin'); if (!hay.length) { clearTimeout(hayTimer); addCandy(14); addXP(14); progress('stall'); toast('🦌 Alle Rentiere sind satt! Danke!'); S.jobs++; save(); } else toast('Noch ' + hay.length + ' Futter übrig'); }
  else if (n.t === 'exit') endMission(true);
}

// ================= Begehbare Häuser =================
const INSIDE_JOB = { baeckerei: 'bake', werkstatt: 'toy', schule: 'school', post: 'post', cafe: 'cafe', bib: 'lib', home: 'home' };
const ROOMS = {}; let IN = null;
function enterBuilding(d) {
  fade(() => {
    IN = ROOMS[d.id] || (ROOMS[d.id] = W.buildInterior(d.id, d.name)); IN.door = d;
    village.remove(player); IN.scene.add(player); P.scene = IN.scene; P.mode = 'inside'; P.pos.copy(IN.spawn); P.vel.set(0, 0, 0); P.vy = 0; player.rotation.y = Math.PI; CAM.yaw = 0; CAM.pitch = .55; CAM.dist = 4.2; FX.move(IN.scene);
    $('#quest').style.display = 'none'; sfx('bell');
  });
}
function exitBuilding() {
  fade(() => { IN.scene.remove(player); village.add(player); P.scene = village; P.mode = 'walk'; const d = IN.door; P.pos.set(d.pos.x, W.H(d.pos.x, d.pos.z), d.pos.z); player.rotation.y = d.ry; CAM.yaw = d.ry + Math.PI; CAM.dist = 7.5; FX.move(village); $('#quest').style.display = ''; IN = null; });
}

// ================= Jobs / Minispiele =================
const JOBS = {};
JOBS.bake = () => {
  let round = 0, total = 0, pos = 0, dir = 1, raf, zone = Math.max(.12, .26 - rank() * .025), z0 = .3 + Math.random() * .4, speed = 1 + rank() * .15;
  const p = panel(`<h2>🍪 Plätzchen backen</h2><p>Stopp die Nadel im goldenen Bereich, dann sind die Plätzchen perfekt!</p><div class="meter"><div class="zone" id="bz"></div><div class="needle" id="bn"></div></div><p id="bmsg" class="big">Blech 1/5</p><button class="btn" id="bgo">Jetzt aus dem Ofen!</button><button class="btn ghost" data-close>Abbrechen</button>`);
  const setZone = () => { z0 = .1 + Math.random() * (.8 - zone); $('#bz').style.left = z0 * 100 + '%'; $('#bz').style.width = zone * 100 + '%'; }; setZone();
  let last = performance.now(); const loop = n => { const dt = (n - last) / 1000; last = n; pos += dir * dt * .9 * speed; if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; } const e = $('#bn'); if (!e) return; e.style.left = pos * 100 + '%'; raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
  const hit = () => { const c = z0 + zone / 2, d = Math.abs(pos - c); let pts = 0, m; if (d < zone * .18) { pts = 4; m = 'Perfekt goldbraun! ⭐'; } else if (d < zone / 2) { pts = 2; m = 'Gut gebacken!'; } else { m = pos < c ? 'Noch roh …' : 'Angebrannt! 🔥'; } total += pts; round++; sfx(pts ? 'coin' : 'fail'); $('#bmsg').textContent = m; if (round >= 5) { cancelAnimationFrame(raf); setTimeout(() => { closePanel(); addCandy(total + 2); addXP(12 + total); progress('bake'); S.jobs++; save(); toast('🍪 ' + total + ' Punkte beim Backen!'); tutStep(0); }, 900); } else { setTimeout(() => { if ($('#bmsg')) $('#bmsg').textContent = 'Blech ' + (round + 1) + '/5'; setZone(); }, 700); } };
  $('#bgo').onclick = hit; P.uiAction = hit;
};
JOBS.toy = () => {
  const PARTS = ['🪵', '🔩', '🎨', '🎀', '⚙️', '🧸', '🚂', '🪀', '🧩'], TOYS = ['Holzeisenbahn', 'Teddybär', 'Kreisel', 'Puppenhaus', 'Roboter', 'Schaukelpferd'];
  let toy = 0, score = 0, seq, pos;
  const p = panel(`<h2>🧸 Spielzeug-Werkstatt</h2><p id="tmsg">Merk dir die Reihenfolge der Teile!</p><div id="tseq" class="seq"></div><div id="tbtn" class="grid3"></div><button class="btn ghost" data-close>Abbrechen</button>`);
  const next = () => { const n = 3 + Math.min(4, rank()) + Math.min(toy, 2); seq = []; while (seq.length < n) seq.push(PARTS[Math.floor(Math.random() * PARTS.length)]); pos = 0; $('#tmsg').textContent = 'Bauplan für: ' + TOYS[Math.floor(Math.random() * TOYS.length)] + ' (merken!)'; $('#tseq').innerHTML = seq.map(s => `<span>${s}</span>`).join(''); $('#tbtn').innerHTML = ''; setTimeout(() => { if (!$('#tseq')) return; $('#tseq').innerHTML = seq.map(() => '<span>❔</span>').join(''); $('#tmsg').textContent = 'Jetzt zusammenbauen!'; $('#tbtn').innerHTML = PARTS.map(s => `<button class="tile">${s}</button>`).join(''); }, 1600 + n * 350); };
  p.addEventListener('click', e => { const b = e.target.closest('.tile'); if (!b) return; if (b.textContent === seq[pos]) { $('#tseq').children[pos].textContent = seq[pos]; pos++; sfx('click'); if (pos === seq.length) { score += 5; toy++; sfx('ok'); if (toy >= 3) { setTimeout(() => { closePanel(); addCandy(score + 3); addXP(15 + score); progress('toy'); S.jobs++; save(); toast('🧸 3 Spielzeuge gebaut!'); }, 600); } else setTimeout(next, 700); } } else { sfx('fail'); $('#tmsg').textContent = 'Falsches Teil! Nochmal von vorn.'; score = Math.max(0, score - 1); pos = 0; [...$('#tseq').children].forEach(c => c.textContent = '❔'); } });
  next();
};
const QUIZ = [['Wann schlafen Wichtel meistens?', 'Am Tag', 'In der Nacht', 'Nie', 0], ['Was passiert, wenn ein Mensch einen Wichtel berührt (laut Legende)?', 'Er verliert seine Zauberkraft', 'Er wird grösser', 'Er wird unsichtbar', 0], ['Wie viele Kerzen hat ein Adventskranz?', '3', '4', '6', 1], ['Was frisst ein Rentier am liebsten im Winter?', 'Flechten und Moos', 'Fisch', 'Schokolade', 0], ['Wie heisst die Hauptstadt der Schweiz (Bundesstadt)?', 'Zürich', 'Bern', 'Genf', 1], ['12 Wichtel backen je 5 Plätzchen. Wie viele sind es?', '50', '60', '70', 1], ['Wo wohnt der Weihnachtsmann der Legende nach?', 'Am Nordpol', 'In Australien', 'Auf dem Mond', 0], ['Was ist ein Polarlicht?', 'Leuchten am Himmel', 'Eine Taschenlampe', 'Ein Eis', 0], ['Welches Tier lebt am Nordpol?', 'Pinguin', 'Eisbär', 'Känguru', 1], ['Wann ist Heiligabend?', '24. Dezember', '6. Dezember', '31. Dezember', 0], ['Was bringt der Samichlaus am 6. Dezember in der Schweiz?', 'Nüsse, Mandarinen, Lebkuchen', 'Ostereier', 'Feuerwerk', 0], ['48 Geschenke auf 6 Schlitten verteilt. Wie viele pro Schlitten?', '6', '8', '9', 1], ['Wie viele Tage hat der Dezember?', '30', '31', '28', 1], ['Was braucht ein Schneemann als Nase?', 'Rüebli', 'Gurke', 'Banane', 0], ['Wie heisst der Monat nach Dezember?', 'Februar', 'Januar', 'November', 1], ['Welche Farbe hat die Mütze eines klassischen Wichtels?', 'Rot', 'Gelb', 'Lila', 0], ['Was ist 7 × 8?', '54', '56', '64', 1], ['Wo baut man eine Wichteltür hin?', 'An die Wand, unten', 'Aufs Dach', 'In den Kühlschrank', 0], ['Wie lange dauert die Polarnacht am Nordpol ungefähr?', 'Ein Tag', 'Etwa ein halbes Jahr', 'Eine Woche', 1], ['Welches Gewürz ist in Zimtsternen?', 'Pfeffer', 'Zimt', 'Salz', 1], ['Welcher Kontinent liegt am Südpol?', 'Antarktis', 'Arktis', 'Afrika', 0], ['Was ist 125 + 75?', '190', '200', '210', 1], ['Wie heisst Schnee, der vom Wind verweht wird?', 'Schneewehe', 'Schneesuppe', 'Schneeball', 0], ['Was machen Wichtel in der Nacht bei Kindern?', 'Streiche und Überraschungen', 'Hausaufgaben', 'Rasen mähen', 0], ['Wie viele Beine hat ein Rentier?', '2', '4', '6', 1], ['Was ist kälter?', '-5 Grad', '-20 Grad', '0 Grad', 1], ['Welche Form hat eine Schneeflocke meistens?', 'Sechseckig', 'Dreieckig', 'Rund', 0], ['Wie viele Minuten hat eine Stunde?', '100', '60', '30', 1], ['Was ist Milchreis?', 'Reis in Milch gekocht', 'Reis mit Käse', 'Milch aus Reisfeldern', 0], ['Welche Zahl kommt nach 999?', '1000', '9100', '1001', 0]];
JOBS.school = () => {
  const qs = QUIZ.slice().sort(() => Math.random() - .5).slice(0, 5); let i = 0, right = 0;
  const p = panel(`<h2>🎓 Wichtel-Akademie</h2><p id="qn"></p><p class="q" id="qq"></p><div id="qa" class="answers"></div><button class="btn ghost" data-close>Pause</button>`);
  const show = () => { const q = qs[i]; $('#qn').textContent = 'Frage ' + (i + 1) + ' von 5'; $('#qq').textContent = q[0]; $('#qa').innerHTML = [1, 2, 3].map(k => `<button class="ans" data-k="${k - 1}">${q[k]}</button>`).join(''); };
  p.addEventListener('click', e => { const b = e.target.closest('.ans'); if (!b || b.disabled) return; const q = qs[i], ok = +b.dataset.k === q[4]; [...$('#qa').children].forEach((x, k) => { x.disabled = true; if (k === q[4]) x.classList.add('right'); }); if (ok) { right++; sfx('coin'); } else { b.classList.add('wrong'); sfx('fail'); } setTimeout(() => { i++; if (i < 5) show(); else { closePanel(); addCandy(right * 3); addXP(8 + right * 6); progress('school'); S.jobs++; save(); toast('🎓 ' + right + ' von 5 richtig!'); } }, 1000); });
  show();
};
const WISHES = [['Ich wünsche mir einen Fussball', 'Sport'], ['Bitte ein Buch über Dinosaurier', 'Bücher'], ['Eine Tüte Gummibärchen', 'Süsses'], ['Ein ferngesteuertes Auto', 'Spielzeug'], ['Neue Skier', 'Sport'], ['Ein Comic-Heft', 'Bücher'], ['Schoggi! Ganz viel Schoggi!', 'Süsses'], ['Ein Lego-Set', 'Spielzeug'], ['Einen Schlitten', 'Sport'], ['Ein Rätselbuch', 'Bücher'], ['Lebkuchen mit Zuckerguss', 'Süsses'], ['Eine Puppe', 'Spielzeug'], ['Ein Unihockey-Stock', 'Sport'], ['Ein Detektiv-Roman', 'Bücher'], ['Zuckerstangen', 'Süsses'], ['Einen Kreisel', 'Spielzeug'], ['Schlittschuhe', 'Sport'], ['Ein Märchenbuch', 'Bücher'], ['Mandarinen und Nüsse', 'Süsses'], ['Ein Puzzle mit 1000 Teilen', 'Spielzeug']];
JOBS.post = () => {
  let t = 25, score = 0, cur, timer; const cats = ['Spielzeug', 'Bücher', 'Süsses', 'Sport'];
  const p = panel(`<h2>✉️ Wunschzettel-Post</h2><p>Sortiere so viele Briefe wie möglich! <b id="pt">25</b> s</p><div class="letter" id="pl"></div><div class="grid2">${cats.map(c => `<button class="ans" data-c="${c}">${c}</button>`).join('')}</div><p class="big" id="ps">0 Briefe</p><button class="btn ghost" data-close>Abbrechen</button>`);
  const next = () => { cur = WISHES[Math.floor(Math.random() * WISHES.length)]; $('#pl').textContent = '«' + cur[0] + '»'; };
  p.addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b || t <= 0) return; if (b.dataset.c === cur[1]) { score++; sfx('coin'); $('#ps').textContent = score + ' Briefe'; } else { sfx('fail'); t = Math.max(0, t - 2); } next(); });
  timer = setInterval(() => { if (!$('#pt')) { clearInterval(timer); return; } t--; $('#pt').textContent = t; if (t <= 0) { clearInterval(timer); closePanel(); addCandy(score); addXP(6 + score * 2); progress('post'); S.jobs++; save(); toast('✉️ ' + score + ' Briefe sortiert!'); } }, 1000);
  next();
};
let hay = [], hayTimer = 0;
JOBS.stall = () => {
  if (hay.length) { toast('Sammle zuerst das restliche Futter!'); return; }
  panel(`<h2>🦌 Rentierstall</h2><p class="say">«Die Rentiere haben Hunger! Sammle die 6 leuchtenden Futterbündel rund um den Stall. Du hast 90 Sekunden.»</p><button class="btn" id="hs">Los geht's!</button><button class="btn ghost" data-close>Später</button>`);
  $('#hs').onclick = () => {
    closePanel();
    for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, d = 8 + Math.random() * 16, x = 40 + Math.cos(a) * d, z = 18 + Math.sin(a) * d; const h = MD.makeHay(); h.scale.setScalar(.6); h.position.set(x, W.H(x, z), z); const glow = new THREE.Mesh(new THREE.RingGeometry(.7, .9, 24), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .8 })); glow.rotation.x = -Math.PI / 2; glow.position.y = .05; h.add(glow); village.add(h); hay.push(h); }
    toast('Finde 6 Futterbündel!'); hayTimer = setTimeout(() => { hay.forEach(h => village.remove(h)); if (hay.length) toast('Zeit um! Versuch es nochmal.'); hay = []; }, 90000);
  };
};
let kakaoT = 0;
JOBS.cafe = () => {
  const p = panel(`<h2>☕ Kakao-Café</h2><p class="say">«Hereinspaziert! Was darf's sein?»</p><div class="shop"><button class="buy" data-b="kakao">☕ Heisser Kakao<br><small>Schneller laufen und fliegen (2 Min)</small><b>8 🍬</b></button><button class="buy" data-b="lebkuchen">🍪 Lebkuchen<br><small>+15 Erfahrung</small><b>6 🍬</b></button><button class="buy" data-b="milchreis">🍚 Milchreis mit Zimt<br><small>+40 Erfahrung</small><b>15 🍬</b></button></div><button class="btn ghost" data-close>Tschüss</button>`);
  p.addEventListener('click', e => { const b = e.target.closest('.buy'); if (!b) return; const k = b.dataset.b, price = { kakao: 8, lebkuchen: 6, milchreis: 15 }[k]; if (S.candy < price) { sfx('fail'); toast('Zu wenig Zuckerstangen!'); return; } addCandy(-price); sfx('coin'); if (k === 'kakao') { kakaoT = 120; toast('☕ Mmmh! Du bist jetzt superschnell.'); } else addXP(k === 'lebkuchen' ? 15 : 40); });
};
JOBS.rathaus = () => {
  ensureDay(); const all = S.tasks.every(taskDone);
  const p = panel(`<h2>🏛️ Rathaus</h2><p class="say">«Hallo ${S.name || 'Wichtel'}! Das sind deine Aufgaben für heute:»</p><ul class="tl">${S.tasks.map(k => `<li>${taskDone(k) ? '✅' : '⬜'} ${TASKS[k][0]} (${Math.min(S.tp[k] || 0, TASKS[k][1])}/${TASKS[k][1]})</li>`).join('')}</ul><p>🔥 Serie: <b>${S.streak}</b> Tage · Rang: <b>${RANKS[rank()][1]}</b> · Streiche: <b>${S.missions}</b></p>${all && !S.tclaimed ? '<button class="btn" id="claim">Belohnung abholen (40 🍬 + Bonus)</button>' : ''}<button class="btn ghost" data-close>Danke!</button>`);
  const c = $('#claim'); if (c) c.onclick = () => { const y = new Date(Date.now() - 864e5), yk = y.getFullYear() + '-' + (y.getMonth() + 1) + '-' + y.getDate(); S.streak = S.lastDone === yk ? S.streak + 1 : 1; S.lastDone = today(); S.tclaimed = true; const bonus = Math.min(50, S.streak * 5); addCandy(40 + bonus); addXP(30 + bonus); sfx('rank'); closePanel(); toast('🏆 Belohnung: ' + (40 + bonus) + ' Zuckerstangen! Serie: ' + S.streak); renderTasks(); };
};
const FACTS = ['Wichtel kommen aus alten Geschichten aus Skandinavien. Dort heissen sie Tomte oder Nisse.', 'Eine Wichteltür ist nur etwa 10 Zentimeter hoch. Wichtel kommen nachts hindurch.', 'Laut Legende darf ein Wichtel nie von Menschen berührt werden, sonst verliert er seine Zauberkraft.', 'Am Nordpol geht im Winter die Sonne monatelang nicht auf. Das nennt man Polarnacht.', 'Rentiere sind die einzigen Hirsche, bei denen auch die Weibchen ein Geweih tragen.', 'Polarlichter entstehen, wenn Teilchen der Sonne auf die Luft hoch über der Erde treffen.', 'Eisbären haben schwarze Haut unter ihrem hellen Fell. So speichern sie Wärme.', 'Wichtel lieben Milchreis mit Zimt und Zucker. Das ist sozusagen ihr Lieblingsessen.', 'In der Schweiz kommt am 6. Dezember der Samichlaus mit dem Schmutzli.', 'Schneeflocken haben fast immer sechs Arme. Keine sieht genau gleich aus wie eine andere.', 'Der Adventskranz wurde 1839 von Johann Hinrich Wichern erfunden. Er hatte am Anfang sogar über 20 Kerzen!', 'Ein Rentier kann im Schnee bis zu 80 Kilometer pro Stunde schnell rennen.'];
JOBS.lib = () => {
  const p = panel(`<h2>📚 Bibliothek</h2><p>Lies das Wichtel-Wissen. Jede neue Seite gibt Erfahrung.</p><div class="facts">${FACTS.map((f, i) => `<button class="fact ${S.facts.includes(i) ? 'read' : ''}" data-i="${i}">${S.facts.includes(i) ? '📖 ' + f : '📕 Seite ' + (i + 1) + ' lesen'}</button>`).join('')}</div><button class="btn ghost" data-close>Zuklappen</button>`, 'wide');
  p.addEventListener('click', e => { const b = e.target.closest('.fact'); if (!b) return; const i = +b.dataset.i; if (!S.facts.includes(i)) { S.facts.push(i); addXP(6); sfx('coin'); } b.classList.add('read'); b.textContent = '📖 ' + FACTS[i]; save(); });
};
JOBS.talk = d => { panel(`<h2>${d.name}</h2><p class="say">«Hallo! Hier werden kranke Wichtel wieder gesund. Zum Glück ist heute niemand krank. Trink genug Kakao und zieh die Mütze an, dann bleibst du fit!»</p><button class="btn" data-close>Mach ich!</button>`); };
const HATS = [[0xc4161c, 'Rot', 0], [0x2f8a4e, 'Grün', 0], [0x2a6ad8, 'Blau', 1], [0xd8a62a, 'Gold', 2], [0x8a3ad8, 'Lila', 2], ['stripes', 'Geringelt', 3], [0x1f1f1f, 'Schwarz', 4]];
const COATS = [['coatRed', 'Rot', 0], ['coatGreen', 'Grün', 0], ['coatBlue', 'Blau', 1]];
JOBS.home = () => {
  const r = rank();
  const p = panel(`<h2>🏠 Dein Wichtelhaus</h2><h3>Mütze</h3><div class="sw">${HATS.map(([c, n, rr]) => `<button class="opt ${S.hat === c ? 'on' : ''}" data-hat="${c}" ${rr > r ? 'disabled' : ''}>${n}${rr > r ? '<br><small>🔒 ' + RANKS[rr][1] + '</small>' : ''}</button>`).join('')}</div><h3>Mantel</h3><div class="sw">${COATS.map(([c, n, rr]) => `<button class="opt ${S.coat === c ? 'on' : ''}" data-coat="${c}" ${rr > r ? 'disabled' : ''}>${n}${rr > r ? '<br><small>🔒 ' + RANKS[rr][1] + '</small>' : ''}</button>`).join('')}</div><h3>Bart</h3><div class="sw"><button class="opt ${!S.beard ? 'on' : ''}" data-beard="0">Ohne</button><button class="opt ${S.beard ? 'on' : ''}" data-beard="1">Mit Bart</button></div><button class="btn" data-close>Fertig</button>`, 'wide');
  p.addEventListener('click', e => { const b = e.target.closest('.opt'); if (!b || b.disabled) return; if (b.dataset.hat) S.hat = b.dataset.hat === 'stripes' ? 'stripes' : +b.dataset.hat; if (b.dataset.coat) S.coat = b.dataset.coat; if (b.dataset.beard) S.beard = b.dataset.beard === '1'; save(); makePlayer(); village.add(player); sfx('click'); [...b.parentNode.children].forEach(x => x.classList.toggle('on', x === b)); });
};
JOBS.build = () => openBuild();

// ================= Bauen =================
const BUILD = { item: null, ghost: null, r: 0, ok: false };
function openBuild() {
  if (P.mode !== 'walk' && P.mode !== 'ui') return; const r = rank();
  const p = panel(`<h2>🔨 Bau-Laden</h2><p>Kauf etwas und stell es irgendwo im Dorf auf. Du hast <b>${S.candy} 🍬</b>.</p><div class="shop">${CAT.map(c => `<button class="buy" data-id="${c.id}" ${c.r > r ? 'disabled' : ''}>${c.n}<b>${c.p} 🍬</b>${c.r > r ? '<small>🔒 ab ' + RANKS[c.r][1] + '</small>' : ''}</button>`).join('')}</div><button class="btn ghost" id="demol">Etwas in der Nähe abbauen (50% zurück)</button><button class="btn ghost" data-close>Schliessen</button>`, 'wide');
  p.addEventListener('click', e => { const b = e.target.closest('.buy'); if (b && !b.disabled) { const c = CAT.find(x => x.id === b.dataset.id); if (S.candy < c.p) { sfx('fail'); toast('Zu wenig Zuckerstangen! Arbeite in Bäckerei, Werkstatt, Post …'); return; } closePanel(); startBuild(c); } });
  $('#demol').onclick = () => { let best = null, bd = 9; for (const o of builtObjs) { const d = Math.hypot(o.b.x - P.pos.x, o.b.z - P.pos.z); if (d < bd) { bd = d; best = o; } } if (!best) { toast('Hier steht nichts von dir.'); return; } village.remove(best.g); circles.splice(circles.indexOf(best.c), 1); builtObjs.splice(builtObjs.indexOf(best), 1); S.built.splice(S.built.indexOf(best.b), 1); addCandy(Math.floor(CAT.find(c => c.id === best.b.id).p / 2)); closePanel(); toast('Abgebaut.'); };
}
function startBuild(c) { BUILD.item = c; BUILD.ghost = makeItem(c.id); BUILD.r = CAM.yaw + Math.PI; village.add(BUILD.ghost); BUILD.ring = new THREE.Mesh(new THREE.RingGeometry(c.rad, c.rad + .25, 40), new THREE.MeshBasicMaterial({ color: 0x40ff80, transparent: true, opacity: .8, depthWrite: false })); BUILD.ring.rotation.x = -Math.PI / 2; village.add(BUILD.ring); P.mode = 'build'; $('#buildbar').classList.add('on'); toast('Lauf herum, um den Platz zu wählen. Dann «Platzieren».'); }
function updateBuild() {
  const c = BUILD.item, fwd = new THREE.Vector3(-Math.sin(CAM.yaw), 0, -Math.cos(CAM.yaw)), d = c.rad + 3.5;
  const x = P.pos.x + fwd.x * d, z = P.pos.z + fwd.z * d; BUILD.ghost.position.set(x, W.H(x, z), z); BUILD.ghost.rotation.y = BUILD.r; BUILD.ring.position.set(x, W.H(x, z) + .08, z);
  let ok = Math.hypot(x, z) < 82 && Math.hypot(x, z) > 15.5 + c.rad && !W.onIce(x, z) && Math.hypot(x - W.PAD.x, z - W.PAD.z) > 6 + c.rad;
  if (ok) for (const k of colliders) { const dx = x - k.x, dz = z - k.z, cs = Math.cos(k.ry), sn = Math.sin(k.ry), lx = dx * cs - dz * sn, lz = dx * sn + dz * cs; if (Math.abs(lx) < k.hw + c.rad && Math.abs(lz) < k.hd + c.rad) { ok = false; break; } }
  if (ok) for (const k of circles) { if (Math.hypot(x - k.x, z - k.z) < k.r + c.rad * .8) { ok = false; break; } }
  if (ok) for (const dd of V.doors) if (Math.hypot(x - dd.pos.x, z - dd.pos.z) < c.rad + 1.5) { ok = false; break; }
  BUILD.ok = ok; BUILD.ring.material.color.set(ok ? 0x40ff80 : 0xff4040);
}
function placeNow() { if (!BUILD.ok) { sfx('fail'); toast('Hier ist kein Platz.'); return; } const c = BUILD.item; const b = { id: c.id, x: +BUILD.ghost.position.x.toFixed(2), z: +BUILD.ghost.position.z.toFixed(2), r: +BUILD.r.toFixed(3) }; S.built.push(b); addCandy(-c.p); village.remove(BUILD.ghost); placeBuilt(b); addXP(Math.round(c.p / 4) + 5); progress('build'); sfx('bell'); toast('🏡 ' + c.n + ' gebaut!'); tutStep(1); endBuild(); }
function endBuild() { if (BUILD.ghost && BUILD.ghost.parent && !S.built.find(b => b.x === +BUILD.ghost.position.x.toFixed(2) && b.z === +BUILD.ghost.position.z.toFixed(2))) village.remove(BUILD.ghost); if (BUILD.ring) village.remove(BUILD.ring); BUILD.ghost = BUILD.ring = null; $('#buildbar').classList.remove('on'); P.mode = 'walk'; }
$('#bRot').onclick = () => { BUILD.r += Math.PI / 8; sfx('click'); };
$('#bPlace').onclick = () => placeNow();
$('#bCancel').onclick = () => { sfx('click'); endBuild(); };
$('#hBuild').onclick = () => { if (P.mode === 'walk') openBuild(); else toast('Bauen geht nur zu Fuss im Dorf.'); };

// ================= Fliegen =================
function startFly() {
  P.mode = 'fly'; F.yaw = mobil.rotation.y + Math.PI / 2; F.pitch = 0; F.speed = 16; village.remove(player);
  player.position.set(-.5, .55, 0); player.rotation.set(0, Math.PI / 2, 0); player.scale.setScalar(1.2); mobil.add(player);
  $('#btnJ').textContent = '🚀'; $('#btnD').classList.add('on'); toast('Fliegen: Joystick/WASD lenken & steigen · 🚀 Turbo · Lande auf dem Landeplatz', 4000); tutStep(2); sfx('bell');
}
function land() {
  P.mode = 'walk'; mobil.remove(player); player.scale.setScalar(1); village.add(player);
  mobil.position.set(W.PAD.x, W.H(W.PAD.x, W.PAD.z) + .7, W.PAD.z); mobil.rotation.set(0, F.yaw - Math.PI / 2, 0);
  P.pos.set(W.PAD.x + 3, 0, W.PAD.z + 3); P.vy = 0; $('#btnJ').textContent = '⤒'; $('#btnD').classList.remove('on'); toast('Gelandet!'); sfx('ok');
}
function updateFly(dt) {
  const ix = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + joy.x, iy = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + joy.y;
  const down = holdD || K.ShiftLeft || K.KeyQ;
  const boost = (K.Space || holdJ) ? 1 : 0, target = (kakaoT > 0 ? 24 : 18) + boost * 18;
  F.speed += (target - F.speed) * Math.min(1, dt * 2);
  F.yaw -= ix * dt * 1.4; F.roll += (-ix * .5 - F.roll) * Math.min(1, dt * 4);
  F.pitch += ((iy - (down ? 1 : 0)) * .55 - F.pitch) * Math.min(1, dt * 3);
  const dir = new THREE.Vector3(Math.sin(F.yaw) * Math.cos(F.pitch), Math.sin(F.pitch), Math.cos(F.yaw) * Math.cos(F.pitch));
  mobil.position.addScaledVector(dir, F.speed * dt);
  const gy = Math.max(0, W.H(mobil.position.x, mobil.position.z)) + 1.6; if (mobil.position.y < gy) { mobil.position.y = gy; F.pitch = Math.max(F.pitch, 0); }
  mobil.position.y = Math.min(mobil.position.y, 120); const r = Math.hypot(mobil.position.x, mobil.position.z); if (r > 360) { mobil.position.x *= 360 / r; mobil.position.z *= 360 / r; F.yaw += Math.PI * dt; }
  mobil.rotation.set(0, 0, 0); mobil.rotateY(F.yaw - Math.PI / 2); mobil.rotateX(F.roll); mobil.rotateZ(F.pitch);
  // Ringe
  const ring = rings[S.ringIdx % 12]; if (ring.position.distanceTo(mobil.position) < 5) { S.ringIdx++; S.rings++; addCandy(3); addXP(4); progress('rings'); sfx('star'); if (S.ringIdx % 12 === 0) { addCandy(30); toast('🌌 Ganze Ring-Runde geschafft! +30 🍬'); } ringStyle(); }
  // Sterne auf Dächern
  for (const s of starMeshes) if (s.visible && s.position.distanceTo(mobil.position) < 3.2) collectStar(s);
  // Portal
  if (mobil.position.distanceTo(W.PORTAL) < 9) startMission();
  if (Math.random() < dt * 40) FX.emit(mobil.position.clone().addScaledVector(dir, -2), 1, { speed: .4, life: 1.2, size: .45, glow: 1, color: [0x9fffd8, 0xffd27a, 0xbfe6ff][Math.floor(Math.random() * 3)], grav: 0 });
  P.pos.copy(mobil.position);
}

// ================= Streich-Mission beim Kind =================
const MS = { kh: null, todo: [], done: [], noise: 0, t: 0, hold: 0, cat: null, over: false, hearts: 3, par: null, parState: 'sleep', parI: 0, alertT: 0, seenT: 0, lostT: 0, catState: 'sleep', catT: 0, origin: null, hidden: false, hideName: '' };
function startMission(opt = {}) {
  if (P.mode === 'mission') return;
  fade(() => {
    MS.kh = W.buildKidHouse(opt.variant !== undefined ? opt.variant : Math.floor(Math.random() * 5));
    const keys = Object.keys(MS.kh.spots).sort(() => Math.random() - .5); MS.todo = keys.slice(0, Math.min(5, 3 + Math.floor(S.missions / 3))); MS.done = []; MS.noise = 0; MS.t = 240; MS.over = false; MS.hearts = 3; MS.parState = 'sleep'; MS.catState = 'sleep'; MS.seenT = 0;
    MS.origin = opt.town ? { town: opt.town, pos: opt.pos.clone() } : null;
    if (player.parent) player.parent.remove(player); player.scale.setScalar(1); MS.kh.scene.add(player); FX.move(MS.kh.scene); P.scene = MS.kh.scene; P.mode = 'mission'; P.pos.copy(MS.kh.start); P.vy = 0; player.rotation.y = 0; CAM.yaw = Math.PI; CAM.pitch = .6; CAM.dist = 7;
    MS.marks = {}; for (const k of MS.todo) { const sp = MS.kh.spots[k], m = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.1, 40), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .85, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(sp.pos.x, .06, sp.pos.z); MS.kh.scene.add(m); MS.marks[k] = m; }
    MS.hideMarks = MS.kh.hides.map(h => { const m = new THREE.Mesh(new THREE.RingGeometry(h.r - .25, h.r, 40), new THREE.MeshBasicMaterial({ color: 0x7ad0ff, transparent: true, opacity: .35, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(h.x, .05, h.z); MS.kh.scene.add(m); return m; });
    MS.cat = TR.makeCat(); MS.cat.position.set(-18, 0, -14); MS.cat.rotation.y = 1; MS.kh.scene.add(MS.cat);
    MS.par = TR.makeHuman({ pj: [0x5a7ab8, 0x7a4a8a, 0x3a6a4a][Math.floor(Math.random() * 3)], hair: Math.floor(Math.random() * 3) }); MS.par.visible = false; MS.kh.scene.add(MS.par);
    $('#mission').classList.add('on'); $('#quest').style.display = 'none'; $('#btnJ').textContent = '⤒'; $('#btnD').classList.remove('on'); renderMission(); tutStep(3);
    toast('🌙 Psst! Die Katze schläft auf dem Teppich. Schleich dich an ihr vorbei (Joystick nur leicht / Shift).', 5000);
  });
}
function renderMission() { $('#mlist').innerHTML = MS.todo.map(k => `<li class="${MS.done.includes(k) ? 'ok' : ''}">${MS.done.includes(k) ? '✅' : '⬜'} ${MS.kh.spots[k].name}</li>`).join('') + (MS.done.length === MS.todo.length ? '<li class="go">➡️ Zurück zur Wichteltür!</li>' : ''); }
function endMission(win, why) {
  if (MS.over) return; MS.over = true;
  const back = MS.origin ? 'Zurück nach ' + MS.origin.town.dest.name : 'Zurück ins Wichteldorf';
  if (win) { const rew = Math.min(90, 35 + S.missions * 3) + MS.hearts * 5; S.missions++; addCandy(rew); addXP(70 + MS.todo.length * 8); progress('mission'); sfx('rank'); panel(`<h2>🌟 Streich gelungen!</h2><p class="say">Am Morgen wird das Kind staunen. ${MS.hearts === 3 ? 'Niemand hat dich bemerkt!' : 'Knapp, aber geschafft!'}</p><p class="big">+${rew} 🍬</p><button class="btn" data-close>${back}</button>`); }
  else { sfx('fail'); addCandy(3); panel(`<h2>😱 Erwischt!</h2><p class="say">${why}</p><p>Zum Glück bist du gerade noch durch die Wichteltür entkommen. Versuch es nochmal!</p><button class="btn" data-close>${back}</button>`); }
  P.prev = 'walk';
  setTimeout(() => fade(() => {
    MS.kh.scene.remove(player);
    if (MS.origin) { const T2 = MS.origin.town; T2.scene.add(player); P.scene = T2.scene; FX.move(T2.scene); P.pos.copy(MS.origin.pos); P.prev = 'town'; }
    else { village.add(player); P.scene = village; FX.move(village); P.pos.set(W.PAD.x + 3, 0, W.PAD.z + 4); mobil.position.set(W.PAD.x, W.H(W.PAD.x, W.PAD.z) + .7, W.PAD.z); }
    $('#mission').classList.remove('on'); MS.kh = null; $('#quest').style.display = '';
  }), 50);
}
function loseHeart(why) {
  MS.hearts--; sfx('fail'); P.land = 1; if (navigator.vibrate) try { navigator.vibrate(200); } catch (e) { }
  if (MS.hearts <= 0) { endMission(false, why); return true; }
  toast('💔 ' + why + ' Noch ' + MS.hearts + ' Leben!', 3200); return false;
}
function sees(from, yaw, to, range, cosA) { const d = to.clone().sub(from); d.y = 0; const l = d.length(); if (l > range) return false; d.multiplyScalar(1 / l); return d.x * Math.sin(yaw) + d.z * Math.cos(yaw) > cosA; }
function updateMission(dt) {
  const K2 = MS.kh; MS.t -= dt; MS.noise = Math.max(0, MS.noise - dt * 7);
  // Versteckt?
  const hz = K2.hides.find(h => Math.hypot(P.pos.x - h.x, P.pos.z - h.z) < h.r); MS.hidden = !!hz && P.speed < 4.6;
  if (MS.hidden && MS.hideName !== hz.n) { MS.hideName = hz.n; toast('🤫 Versteckt: ' + hz.n); } if (!MS.hidden) MS.hideName = '';
  MS.hideMarks.forEach(m => m.material.opacity = MS.parState !== 'sleep' || MS.catState === 'hunt' ? .5 + Math.sin(T * 6) * .3 : .25);
  // ---- Katze ----
  const c = MS.cat, cu = c.userData; cu.t += dt;
  const toP = P.pos.clone().sub(c.position); toP.y = 0; const dP = toP.length();
  if (MS.catState === 'sleep') { MS.catT -= dt; cu.head.rotation.z = -.6; c.scale.y = 1 + Math.sin(T * 1.5) * .03; cu.eyes.forEach(e => e.visible = false); if (MS.catT <= 0 && (MS.noise > 35 || (dP < 7 && P.speed > 4.6))) { MS.catState = 'hunt'; sfx('meow'); toast('🐱 Die Katze ist aufgewacht und will dich fressen! Renn weg oder wirf einen Schneeball!', 3500); } }
  else {
    cu.eyes.forEach(e => e.visible = true); cu.head.rotation.z = 0; c.scale.y = 1;
    let target, sp;
    if (MS.catState === 'hunt') { target = MS.hidden ? null : P.pos; sp = 8.6; if (!target) { MS.catT += dt; if (MS.catT > 4) { MS.catState = 'sleep'; MS.catT = 8; toast('😼 Die Katze hat dich verloren und legt sich wieder hin.'); } } else MS.catT = 0; }
    else if (MS.catState === 'scared') { target = new THREE.Vector3(c.position.x - toP.x, 0, c.position.z - toP.z); sp = 11; MS.catT -= dt; if (MS.catT <= 0) { MS.catState = 'sleep'; MS.catT = 25; } }
    else if (MS.catState === 'pause') { MS.catT -= dt; if (MS.catT <= 0) MS.catState = 'hunt'; }
    if (target && MS.catState !== 'pause') { const to = target.clone().sub(c.position); to.y = 0; if (to.length() > .5) { to.normalize(); c.position.addScaledVector(to, dt * sp); c.rotation.y = Math.atan2(-to.z, to.x); collide(c.position, K2.colliders, K2.circles, 1.6); cu.legs.forEach((l, i) => l.rotation.z = Math.sin(cu.t * 14 + i * 1.6) * .6); } }
    if (MS.catState === 'hunt' && dP < 2.4 && !MS.hidden) { sfx('meow'); const away = toP.normalize(); P.pos.addScaledVector(away, 9); P.vy = 6; P.onG = false; MS.catState = 'pause'; MS.catT = 2; FX.emit(c.position.clone().setY(2), 20, { speed: 3, life: .6, size: .4, color: 0xd8823a, grav: 4 }); if (loseHeart('Die Katze hat dich geschnappt!')) return; }
  }
  // ---- Eltern ----
  const p = MS.par, pu = p.userData;
  if (MS.parState === 'sleep') { if (MS.noise >= 55) { MS.parState = 'search'; MS.parI = 0; MS.alertT = 35; p.visible = true; p.position.copy(K2.parentPath[0]); K2.kidLight.material.opacity = 1; sfx('fail'); toast('😨 Zu laut! Mama/Papa ist aufgewacht und sucht mit der Taschenlampe. Versteck dich!', 4000); } }
  else {
    let target, sp = 4.2;
    if (MS.parState === 'search') { target = K2.parentPath[MS.parI]; if (p.position.distanceTo(target) < 1.5) MS.parI = (MS.parI + 1) % K2.parentPath.length; MS.alertT -= dt; if (MS.alertT <= 0) MS.parState = 'back'; }
    else if (MS.parState === 'chase') { target = P.pos; sp = 6.2; if (MS.hidden) { MS.lostT += dt; if (MS.lostT > 2) { MS.parState = 'search'; toast('🤔 «Hm … war wohl nichts.»'); } } else MS.lostT = 0; }
    else if (MS.parState === 'back') { target = K2.parentPath[0]; if (p.position.distanceTo(target) < 1.5) { MS.parState = 'sleep'; p.visible = false; MS.noise = 20; K2.kidLight.material.opacity = 0; toast('😴 Alle schlafen wieder. Weiter geht\'s!'); } }
    if (target) { const to = target.clone().sub(p.position); to.y = 0; if (to.length() > .3) { to.normalize(); p.position.addScaledVector(to, dt * sp); const ry = Math.atan2(to.x, to.z); let dd = ry - p.rotation.y; while (dd > Math.PI) dd -= Math.PI * 2; while (dd < -Math.PI) dd += Math.PI * 2; p.rotation.y += dd * Math.min(1, dt * 4); collide(p.position, K2.colliders, [], 2); TR.animateHuman(p, dt, sp); } }
    pu.cone.material.opacity = .08 + Math.sin(T * 7) * .015;
    if (MS.parState !== 'back' && !MS.hidden && sees(p.position, p.rotation.y, P.pos, 22, .88)) { MS.seenT += dt; if (MS.seenT > .5 && MS.parState === 'search') { MS.parState = 'chase'; toast('😲 «Was war das?!» Lauf und versteck dich!', 2500); sfx('fail'); } } else MS.seenT = Math.max(0, MS.seenT - dt);
    if (MS.parState === 'chase' && p.position.distanceTo(P.pos) < 3.5) { P.pos.copy(K2.start); MS.parState = 'search'; if (loseHeart('Fast hätte dich Mama/Papa gepackt! Du bist zur Wichteltür geflüchtet.')) return; }
  }
  if (MS.t <= 0) { endMission(false, 'Die Nacht ist vorbei, es wird schon hell!'); return; }
  const hh = Math.floor(1 + (240 - MS.t) / 60), mm = Math.floor(((240 - MS.t) % 60));
  $('#mclock').innerHTML = '🕐 0' + hh + ':' + String(mm).padStart(2, '0') + ' <span style="color:#ff5a6a;letter-spacing:2px">' + '♥'.repeat(MS.hearts) + '<span style="opacity:.25">' + '♥'.repeat(3 - MS.hearts) + '</span></span>' + (MS.hidden ? ' <small>🤫</small>' : '');
  $('#noisebar').style.width = Math.min(100, MS.noise / .55) + '%'; $('#noisebar').style.background = MS.noise > 40 ? '#ff4a4a' : MS.noise > 25 ? '#ffb347' : '#6fe39a';
  // Streich halten
  const holding = (holdA || K.KeyE) && near && near.t === 'prank';
  if (holding) { MS.hold += dt; MS.noise += dt * 3; $('#hold').style.width = Math.min(100, MS.hold / 2.2 * 100) + '%'; if (MS.hold >= 2.2) { const s = K2.spots[near.k]; s.done(); MS.done.push(near.k); if (MS.marks[near.k]) K2.scene.remove(MS.marks[near.k]); MS.hold = 0; sfx('star'); toast('✨ ' + s.name + ' – erledigt!'); renderMission(); } } else { MS.hold = Math.max(0, MS.hold - dt * 2); $('#hold').style.width = Math.min(100, MS.hold / 2.2 * 100) + '%'; }
}

// ================= Weltreise =================
const TOWNS = {}; let TOWN = null, FL = null, TRV = null;
const EXPRESS_MS = 20 * 60 * 1000;
function nextExpress() { return Math.ceil(Date.now() / EXPRESS_MS) * EXPRESS_MS; }
function expressDest() { return TR.DEST[Math.floor(Date.now() / EXPRESS_MS + 1) % TR.DEST.length]; }
function mmss(ms) { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function drawWorld(cv, sel) {
  const x = cv.getContext('2d'), w = cv.width, h = cv.height;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0c2a4a'); g.addColorStop(1, '#06182c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(255,255,255,.06)'; for (let i = 1; i < 12; i++) { x.beginPath(); x.moveTo(i * w / 12, 0); x.lineTo(i * w / 12, h); x.stroke(); } for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(0, i * h / 6); x.lineTo(w, i * h / 6); x.stroke(); }
  const land = [[.18, .3, .14, .14], [.3, .62, .07, .16], [.52, .28, .07, .06], [.55, .55, .08, .15], [.7, .3, .18, .14], [.85, .68, .06, .05], [.5, .95, .45, .05], [.45, .1, .08, .04], [.83, .38, .02, .05]];
  x.fillStyle = '#2f6a4e'; land.forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx * w, cy * h, rx * w, ry * h, 0, 0, 7); x.fill(); });
  x.fillStyle = '#e8f2ff'; x.beginPath(); x.ellipse(.5 * w, .02 * h, .5 * w, .05 * h, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(.5 * w, .98 * h, .5 * w, .05 * h, 0, 0, 7); x.fill();
  // Nordpol / Wichteldorf
  x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(.5 * w, .04 * h, 7, 0, 7); x.fill(); x.font = 'bold 13px system-ui'; x.textAlign = 'center'; x.fillText('Wichteldorf', .5 * w, .04 * h + 22);
  TR.DEST.forEach(d => { x.fillStyle = d.id === sel ? '#ffd27a' : '#ff5a5a'; x.beginPath(); x.arc(d.x * w, d.y * h, d.id === sel ? 8 : 6, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = (d.id === sel ? 'bold ' : '') + '12px system-ui'; x.fillText(d.name, d.x * w, d.y * h - 11); });
}
function travelMenu() {
  const nx = nextExpress(), ed = expressDest();
  const p = panel(`<h2>🛷 Wichtelmobil</h2><div class="shop"><button class="buy" data-t="free">Rund ums Dorf fliegen<small>Ringe, Sterne auf Dächern, Nordlicht-Tor</small></button><button class="buy" data-t="world">Weltreise<small>Alleine zu einem Ort auf der Weltkarte fliegen</small></button><button class="buy" data-t="express">Wichtel-Express<small>Mit allen Wichteln nach ${ed.name} · Abfahrt in <b id="excd">${mmss(nx - Date.now())}</b></small></button></div><button class="btn ghost" data-close>Doch nicht</button>`, 'wide');
  const iv = setInterval(() => { const e = $('#excd'); if (!e) { clearInterval(iv); return; } e.textContent = mmss(nextExpress() - Date.now()); }, 500);
  p.addEventListener('click', e => { const b = e.target.closest('.buy'); if (!b) return; sfx('click'); const t = b.dataset.t; if (t === 'free') { closePanel(); startFly(); } else if (t === 'world') worldMap(); else if (t === 'express') { closePanel(); waitExpress(); } });
}
function worldMap(fromTown) {
  let sel = TR.DEST[0].id;
  const p = panel(`<h2>🌍 Weltkarte</h2><canvas id="wmap" width="760" height="380" style="width:100%;border-radius:14px;cursor:pointer"></canvas><div class="sw" id="wlist">${TR.DEST.map(d => `<button class="opt" data-d="${d.id}">${d.name}</button>`).join('')}</div><p id="wsel" class="big"></p><button class="btn" id="wgo">Losfliegen!</button>${fromTown ? '<button class="btn ghost" id="whome">Nach Hause ins Wichteldorf</button>' : ''}<button class="btn ghost" data-close>Abbrechen</button>`, 'wide');
  const cv = $('#wmap'); const upd = () => { drawWorld(cv, sel); const d = TR.DEST.find(d => d.id === sel); $('#wsel').textContent = d.name + ' · ' + d.land; [...document.querySelectorAll('#wlist .opt')].forEach(b => b.classList.toggle('on', b.dataset.d === sel)); }; upd();
  $('#wlist').addEventListener('click', e => { const b = e.target.closest('.opt'); if (b) { sel = b.dataset.d; sfx('click'); upd(); } });
  cv.addEventListener('click', e => { const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height; let best = null, bd = 1; TR.DEST.forEach(d => { const dd = Math.hypot(d.x - mx, (d.y - my) * .5); if (dd < bd) { bd = dd; best = d; } }); if (best) { sel = best.id; sfx('click'); upd(); } });
  $('#wgo').onclick = () => { closePanel(); travelTo(TR.DEST.find(d => d.id === sel)); };
  if (fromTown) $('#whome').onclick = () => { closePanel(); travelTo(null); };
}
function waitExpress() {
  P.mode = 'express'; village.remove(player); player.position.set(-.5, .55, 0); player.rotation.set(0, Math.PI / 2, 0); player.scale.setScalar(1.2); mobil.add(player);
  toast('Du sitzt im Wichtel-Express. Die anderen Wichtel steigen auch ein …', 4000); $('#expressbar').classList.add('on');
}
function updateExpress() { const left = nextExpress() - Date.now(); const ed = expressDest(); $('#extext').textContent = 'Wichtel-Express nach ' + ed.name + ' · Abfahrt in ' + mmss(left); if (left < 900) { $('#expressbar').classList.remove('on'); mobil.remove(player); player.scale.setScalar(1); travelTo(TR.DEST[Math.floor(Date.now() / EXPRESS_MS) % TR.DEST.length], true); } }
$('#exLeave').onclick = () => { $('#expressbar').classList.remove('on'); mobil.remove(player); player.scale.setScalar(1); village.add(player); P.mode = 'walk'; P.pos.set(W.PAD.x + 3, 0, W.PAD.z + 3); };
function travelTo(dest, express) {
  fade(() => {
    if (player.parent) player.parent.remove(player);
    FL = FL || TR.buildFlight(); FL.scene.add(player); player.position.set(-.5, .55, 0); player.rotation.set(0, Math.PI / 2, 0); player.scale.setScalar(1.2); FL.mobil.add(player);
    TRV = { dest, t: 0, dur: 6, express }; P.scene = FL.scene; P.mode = 'travel'; FX.move(FL.scene);
    $('#travelbar').classList.add('on'); $('#trtext').textContent = (dest ? 'Flug nach ' + dest.name : 'Flug nach Hause ins Wichteldorf') + (express ? ' (Wichtel-Express)' : '');
    $('#quest').style.display = 'none'; sfx('bell');
  });
}
function arrive() {
  const dest = TRV.dest; $('#travelbar').classList.remove('on');
  fade(() => {
    FL.mobil.remove(player); player.scale.setScalar(1); player.rotation.set(0, 0, 0);
    if (!dest) { TOWN = null; village.add(player); P.scene = village; FX.move(village); P.mode = 'walk'; P.pos.set(W.PAD.x + 3, 0, W.PAD.z + 3); mobil.position.set(W.PAD.x, W.H(W.PAD.x, W.PAD.z) + .7, W.PAD.z); $('#quest').style.display = ''; toast('Willkommen zurück im Wichteldorf!'); return; }
    TOWN = TOWNS[dest.id] || (TOWNS[dest.id] = TR.buildTown(dest));
    TOWN.scene.add(player); P.scene = TOWN.scene; FX.move(TOWN.scene); P.mode = 'town'; P.pos.copy(TOWN.spawn); P.vel.set(0, 0, 0); CAM.yaw = 0; CAM.dist = 8; CAM.pitch = .35;
    if (!S.visited) S.visited = []; if (!S.visited.includes(dest.id)) { S.visited.push(dest.id); addXP(25); addCandy(15); save(); toast('🌍 Neuer Ort entdeckt: ' + dest.name + '! Leuchtende Ringe an den Türen = Kinderhäuser für Streiche.', 5000); } else toast('Willkommen in ' + dest.name + '!');
  });
}
let orderT = 0;

// ================= Stern einsammeln =================
function collectStar(s) { FX.emit(s.position, 40, { speed: 4, life: 1.1, size: .5, glow: 1, color: 0xffd27a, grav: 1 }); P.cheer = 1; s.visible = false; village.remove(s); S.stars.push(s.userData.i); addCandy(5); addXP(10); progress('stars'); sfx('star'); toast('✨ Glitzerstern gefunden! (' + S.stars.length + '/' + W.STAR_SPOTS.length + ')'); if (S.stars.length === W.STAR_SPOTS.length) { addCandy(100); toast('🌟 ALLE Glitzersterne gefunden! +100 🍬', 5000); } }

// ================= Übergänge & Karte =================
function fade(fn) { const f = $('#fade'); f.classList.add('on'); setTimeout(() => { fn(); setTimeout(() => f.classList.remove('on'), 120); }, 450); }
function toggleMap() { const m = $('#map'); m.classList.toggle('on'); if (m.classList.contains('on')) drawMap(); }
function drawMap() {
  const c = $('#mapc'), x = c.getContext('2d'), s = c.width / 230; x.fillStyle = '#e9f1fb'; x.fillRect(0, 0, c.width, c.height);
  const tx = v => (v + 115) * s; x.fillStyle = '#9ac0dc'; x.beginPath(); x.arc(tx(W.LAKE.x), tx(W.LAKE.z), W.LAKE.r * s, 0, 7); x.fill();
  x.fillStyle = '#c9cfd8'; x.beginPath(); x.arc(tx(0), tx(0), 15 * s, 0, 7); x.fill(); x.fillStyle = '#2f8a4e'; x.beginPath(); x.arc(tx(0), tx(0), 3 * s, 0, 7); x.fill();
  x.font = `bold ${Math.round(9 * s / 2.2)}px system-ui`; x.textAlign = 'center';
  for (const d of V.doors) { x.fillStyle = d.job ? '#a8141a' : '#8a6a4a'; x.save(); x.translate(tx(d.x), tx(d.z)); x.rotate(-d.ry); x.fillRect(-d.w / 2 * s, -d.d / 2 * s, d.w * s, d.d * s); x.restore(); if (d.job) { x.fillStyle = '#1a2440'; x.fillText(d.name, tx(d.x), tx(d.z) - d.d / 2 * s - 4); } }
  x.fillStyle = '#3cbcff'; x.beginPath(); x.arc(tx(W.PAD.x), tx(W.PAD.z), 5 * s, 0, 7); x.fill(); x.fillStyle = '#1a2440'; x.fillText('Wichtelmobil', tx(W.PAD.x), tx(W.PAD.z) + 7 * s);
  x.fillStyle = '#1a2440'; x.fillText('Weihnachtsmarkt', tx(REG.market.x), tx(REG.market.z) + 22 * s / 2.2); x.fillText('Eishöhle', tx(REG.cave.x), tx(REG.cave.z)); x.fillStyle = '#7ad0ff'; x.beginPath(); x.arc(tx(REG.cave.x), tx(REG.cave.z), 11 * s, 0, 7); x.globalAlpha = .4; x.fill(); x.globalAlpha = 1; x.fillStyle = '#c4161c'; x.beginPath(); x.arc(tx(REG.market.x), tx(REG.market.z), 13 * s, 0, 7); x.globalAlpha = .3; x.fill(); x.globalAlpha = 1;
  for (const b of S.built) { x.fillStyle = '#d8a62a'; x.fillRect(tx(b.x) - 2, tx(b.z) - 2, 4, 4); }
  x.save(); x.translate(tx(P.pos.x), tx(P.pos.z)); x.rotate(-player.rotation.y + Math.PI); x.fillStyle = '#ff2a2a'; x.beginPath(); x.moveTo(0, -9); x.lineTo(6, 7); x.lineTo(-6, 7); x.closePath(); x.fill(); x.restore();
}
$('#hMap').onclick = toggleMap; $('#map').onclick = toggleMap;
$('#hTasks').onclick = () => { renderTasks(); $('#taskbox').classList.toggle('on'); };
$('#hMenu').onclick = () => {
  const p = panel(`<h2>☰ Menü</h2><button class="btn" id="mSound">${S.sound ? '🔊 Ton an' : '🔇 Ton aus'}</button><button class="btn" id="mMusic">${S.music ? '🎵 Musik an' : '🎵 Musik aus'}</button><div class="help"><h3>Steuerung</h3><p><b>Handy:</b> Joystick links = laufen (weit drücken = rennen) · Bildschirm wischen = Kamera · ✋ = Aktion · ⤒ = Springen (2x = Doppelsprung, halten = gleiten) · Schneeball-Knopf = werfen</p><p><b>Computer:</b> WASD/Pfeile = laufen · Shift = rennen/schleichen · Maus ziehen = Kamera · Mausrad = Zoom · E = Aktion · Leertaste = Springen (2x = Doppelsprung, gedrückt halten = mit der Mütze gleiten) · F = Schneeball · B = Bauen · M = Karte</p><p><b>Tipp:</b> Über Kisten kommst du auf die Dächer!</p><p><b>Wichtelmobil:</b> lenken & steigen mit Joystick/WASD · ⬇ = sinken · 🚀/Leertaste = Turbo</p></div><a class="btn ghost" href="index.html">Zurück zur Website</a><button class="btn ghost" id="mReset">Spielstand löschen</button><button class="btn" data-close>Weiterspielen</button>`, 'wide');
  $('#mSound').onclick = () => { S.sound = !S.sound; if (master) master.gain.value = S.sound ? .9 : 0; save(); $('#mSound').textContent = S.sound ? '🔊 Ton an' : '🔇 Ton aus'; };
  $('#mMusic').onclick = () => { S.music = !S.music; if (musicGain) musicGain.gain.value = S.music ? .12 : 0; save(); $('#mMusic').textContent = S.music ? '🎵 Musik an' : '🎵 Musik aus'; };
  $('#mReset').onclick = () => { if ($('#mReset').dataset.sure) { localStorage.removeItem(SKEY); location.reload(); } else { $('#mReset').dataset.sure = 1; $('#mReset').textContent = 'Wirklich? Nochmal tippen'; } };
};

// ================= Story & Aufträge =================
const npcBy = name => npcs.find(n => n.d.n === name);
const doorPos = id => V.doors.find(d => d.id === id).pos.clone();
const qGroup = new THREE.Group(); village.add(qGroup);
function letterMesh() { const g = new THREE.Group(); const p = new THREE.Mesh(MD.roundBox(.6, .05, .42, .02), new THREE.MeshStandardMaterial({ color: 0xfff6e0, roughness: .8 })); g.add(p); const seal = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .03, 12), new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: .4 })); seal.position.y = .04; g.add(seal); const glow = new THREE.Mesh(new THREE.RingGeometry(.5, .62, 28), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = -.3; g.add(glow); g.userData.spin = true; return g; }
function targetMesh() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); ['#c4161c', '#fff', '#c4161c', '#fff', '#c4161c'].forEach((col, i) => { x.fillStyle = col; x.beginPath(); x.arc(64, 64, 62 - i * 12, 0, 7); x.fill(); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; const g = new THREE.Group(); const board = new THREE.Mesh(new THREE.CylinderGeometry(.8, .8, .12, 32), [new THREE.MeshStandardMaterial({ color: 0x6a4a30 }), new THREE.MeshStandardMaterial({ map: t }), new THREE.MeshStandardMaterial({ map: t })]); board.rotation.x = Math.PI / 2; board.position.y = 1.6; g.add(board); const post = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, 1.6, 8), new THREE.MeshStandardMaterial({ color: 0x4a3424 })); post.position.y = .8; g.add(post); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; }
function archMesh(i) { const g = new THREE.Group(); const a = new THREE.Mesh(new THREE.TorusGeometry(2.4, .18, 10, 40, Math.PI), new THREE.MeshStandardMaterial({ color: 0x9fffd8, emissive: 0x30ffa8, emissiveIntensity: 1.6 })); g.add(a); g.userData.i = i; return g; }
function giftCarry() { const g = MD.makeGift(0xc4161c); g.scale.setScalar(.8); return g; }
const Q = [
  { t: 'Kapitel 1: Neu im Wichteldorf', steps: [
    { k: 'talk', npc: 'Bürgermeister Bommel', say: 'Willkommen im Wichteldorf! Ich bin Bürgermeister Bommel. Jeder neue Wichtel lernt bei uns zuerst die wichtigsten Dinge. Geh zur Wichtel-Akademie, Professor Knopf wartet schon.', txt: 'Sprich mit Bürgermeister Bommel' },
    { k: 'talk', npc: 'Professor Knopf', say: 'Ah, der Neue! Regel Nummer 1: Ein Wichtel lässt sich nie erwischen. Regel Nummer 2: Ohne Wissen kein guter Wichtel. Setz dich, wir machen gleich einen Test!', txt: 'Sprich mit Professor Knopf bei der Akademie' },
    { k: 'job', job: 'school', txt: 'Mach den Unterricht in der Wichtel-Akademie', at: () => doorPos('schule') },
    { k: 'job', job: 'bake', txt: 'Hilf Oma Zimt in der Bäckerei beim Backen', at: () => doorPos('baeckerei') },
    { k: 'talk', npc: 'Bürgermeister Bommel', say: 'Bravo! Du bist jetzt offiziell ein Wichtel des Dorfes. Hier ist deine Belohnung. Und schau dich um: Mit Doppelsprung kommst du über Kisten sogar auf die Dächer!', txt: 'Zurück zu Bürgermeister Bommel', reward: 25 }
  ] },
  { t: 'Kapitel 2: Der Wunschzettel-Sturm', steps: [
    { k: 'talk', npc: 'Frau Post', say: 'Oh nein, oh nein! Ein Windstoss hat mir 8 Wunschzettel aus dem Sack geweht. Sie liegen überall im Dorf, einer sogar auf einem Dach! Bitte sammle sie ein, die Kinder warten!', txt: 'Sprich mit Frau Post' },
    { k: 'collect', n: 8, spawn: 'letters', txt: 'Sammle die verwehten Wunschzettel' },
    { k: 'talk', npc: 'Frau Post', say: 'Alle 8! Du bist ein Schatz. Jetzt müssen sie nur noch sortiert werden …', txt: 'Bring die Briefe zu Frau Post' },
    { k: 'job', job: 'post', txt: 'Sortiere die Wunschzettel in der Post', at: () => doorPos('post'), reward: 30 }
  ] },
  { t: 'Kapitel 3: Wo ist Blitzi?', steps: [
    { k: 'talk', npc: 'Funki', say: 'Blitzi ist weg! Das freche Rentier ist heute Nacht abgehauen. Siehst du die leuchtenden Hufspuren? Folge ihnen in den Wald!', txt: 'Sprich mit Funki beim Rentierstall' },
    { k: 'trail', txt: 'Folge den Hufspuren in den Wald' },
    { k: 'lead', txt: 'Bring Blitzi zurück zum Rentierstall (er folgt dir)', at: () => new THREE.Vector3(42, 0, 22) },
    { k: 'talk', npc: 'Funki', say: 'Blitzi! Da bist du ja, du Ausreisser! Danke, kleiner Wichtel. Hilfst du mir noch, alle Rentiere zu füttern?', txt: 'Sprich mit Funki' },
    { k: 'job', job: 'stall', txt: 'Füttere die Rentiere (sammle das Futter)', at: () => doorPos('stall'), reward: 35 }
  ] },
  { t: 'Kapitel 4: Die grosse Schneeballschlacht', steps: [
    { k: 'talk', npc: 'Flocki', say: 'Hey du! Ich bin der beste Schneeballwerfer im Dorf. Glaubst du, du kannst mich schlagen? Triff zuerst alle 10 Zielscheiben auf dem Dorfplatz, und zwar in 60 Sekunden!', txt: 'Sprich mit Flocki' },
    { k: 'targets', n: 10, time: 60, txt: 'Triff 10 Zielscheiben mit Schneebällen (F / Schneeball-Knopf)' },
    { k: 'hitnpc', npc: 'Flocki', n: 3, txt: 'Jetzt Revanche: Triff Flocki 3-mal!' },
    { k: 'talk', npc: 'Flocki', say: 'Okay, okay, du hast gewonnen! Du bist echt gut. Ab jetzt bist du mein bester Freund.', txt: 'Sprich mit Flocki', reward: 40 }
  ] },
  { t: 'Kapitel 5: Rennen um den Eissee', steps: [
    { k: 'talk', npc: 'Lotte', say: 'Jedes Jahr gibt es das grosse Wichtel-Rennen um den Eissee. Lauf durch alle 8 leuchtenden Tore in 70 Sekunden! Auf dem Eis rutschst du, pass auf!', txt: 'Sprich mit Lotte bei der Bibliothek' },
    { k: 'race', time: 70, txt: 'Lauf durch alle Tore!' },
    { k: 'talk', npc: 'Lotte', say: 'Wahnsinn, was für ein Tempo! Du bist der neue Rennmeister!', txt: 'Sprich mit Lotte', reward: 40 }
  ] },
  { t: 'Kapitel 6: Geschenke-Lieferdienst', steps: [
    { k: 'job', job: 'toy', txt: 'Baue Spielzeug in der Werkstatt', at: () => doorPos('werkstatt') },
    { k: 'deliver', n: 3, txt: 'Bring die 3 Geschenke zu den Wichtelhäusern (Tür)' },
    { k: 'talk', npc: 'Bürgermeister Bommel', say: 'Die ganze Nachbarschaft redet von dir! So einen fleissigen Wichtel hatten wir lange nicht.', txt: 'Sprich mit Bürgermeister Bommel', reward: 45 }
  ] },
  { t: 'Kapitel 7: Der erste Streich', steps: [
    { k: 'talk', npc: 'Professor Knopf', say: 'Jetzt kommt die Meisterprüfung. Flieg mit dem Wichtelmobil durch das Nordlicht-Tor in die Menschenwelt und mach einen Streich, ohne dass das Kind aufwacht. Viel Glück!', txt: 'Sprich mit Professor Knopf' },
    { k: 'fly', txt: 'Steig ins Wichtelmobil auf dem Landeplatz', at: () => new THREE.Vector3(W.PAD.x, 0, W.PAD.z) },
    { k: 'mission', txt: 'Flieg durch das Nordlicht-Tor und mach einen Streich', at: () => W.PORTAL.clone() },
    { k: 'talk', npc: 'Professor Knopf', say: 'Ausgezeichnet! Niemand hat dich gesehen. Du hast die Prüfung bestanden, Meisterwichtel in Ausbildung!', txt: 'Melde dich bei Professor Knopf', reward: 60 }
  ] },
  { t: 'Kapitel 8: Herr der Ringe am Himmel', steps: [
    { k: 'rings', n: 12, txt: 'Flieg mit dem Wichtelmobil durch 12 Nordlicht-Ringe' },
    { k: 'talk', npc: 'Flocki', say: 'Ich hab dich am Himmel gesehen! Das sah unglaublich aus!', txt: 'Erzähl es Flocki', reward: 50 }
  ] },
  { t: 'Kapitel 9: Das grosse Dorffest', steps: [
    { k: 'talk', npc: 'Bürgermeister Bommel', say: 'Heute Abend ist das grosse Dorffest! Hilf mir, das Dorf zu schmücken: Stell 3 Sachen aus dem Bau-Laden auf.', txt: 'Sprich mit Bürgermeister Bommel' },
    { k: 'build', n: 3, txt: 'Bau 3 Sachen ins Dorf', at: () => doorPos('laden') },
    { k: 'talk', npc: 'Bürgermeister Bommel', say: 'Es ist wunderschön! Liebe Wichtel, ich ernenne unseren Freund zum DORFHELDEN! Feuerwerk los!', txt: 'Geh zum Fest bei Bürgermeister Bommel', reward: 100, fireworks: true }
  ] }
];
function qState() { if (!S.q) S.q = { ch: 0, st: 0, n: 0 }; return S.q; }
function curStep() { const q = qState(); const ch = Q[q.ch]; return ch ? ch.steps[q.st] : null; }
const QS = { objs: [], blitzi: null, carry: null, timer: 0, gate: 0 };
function clearQ() { QS.objs.forEach(o => qGroup.remove(o)); QS.objs = []; targets.length = 0; if (QS.carry) { player.remove(QS.carry); QS.carry = null; } }
function setupStep() {
  clearQ(); const s = curStep(); renderQuest(); if (!s) return;
  if (s.k === 'collect') { const spots = [[12, 22, 0], [-18, 26, 0], [40, -4, 0], [-44, -8, 0], [22, -40, 0], [-30, 40, 0], [60, 34, 0], [-30, -20, 'roof']]; spots.slice(qState().n).forEach(([x, z, r]) => { const l = letterMesh(); let y = W.H(x, z) + .5; if (r === 'roof') { const c = colliders.find(c => Math.hypot(c.x - x, c.z - z) < 2); y = (c ? c.top + c.roof.rh + .6 : 8); } l.position.set(x, y, z); qGroup.add(l); QS.objs.push(l); }); }
  if (s.k === 'trail') { const from = new THREE.Vector2(44, 8), to = new THREE.Vector2(96, -62); for (let i = 0; i <= 22; i++) { const t = i / 22, x = from.x + (to.x - from.x) * t + Math.sin(t * 9) * 4, z = from.y + (to.y - from.y) * t; const hp = new THREE.Mesh(new THREE.CircleGeometry(.22, 12), new THREE.MeshBasicMaterial({ color: 0x7affd0, transparent: true, opacity: .85, depthWrite: false })); hp.rotation.x = -Math.PI / 2; hp.position.set(x, W.H(x, z) + .05, z); qGroup.add(hp); QS.objs.push(hp); }
    if (!QS.blitzi) { QS.blitzi = MD.makeReindeer(); QS.blitzi.scale.setScalar(.85); village.add(QS.blitzi); } QS.blitzi.position.set(96, W.H(96, -62), -62); }
  if (s.k === 'lead' && !QS.blitzi) { QS.blitzi = MD.makeReindeer(); QS.blitzi.scale.setScalar(.85); village.add(QS.blitzi); QS.blitzi.position.set(P.pos.x + 3, 0, P.pos.z); }
  if (s.k === 'targets') { for (let i = 0; i < s.n; i++) { const a = i / s.n * Math.PI * 2 + .3, r = 20 + (i % 3) * 2.5, x = Math.cos(a) * r, z = Math.sin(a) * r; const t = targetMesh(); t.position.set(x, W.H(x, z), z); t.rotation.y = Math.atan2(-x, -z) + Math.PI; qGroup.add(t); QS.objs.push(t); t.userData.board = t.children[0]; targets.push(t.children[0]); t.children[0].userData.root = t; } QS.timer = s.time; }
  if (s.k === 'race') { const L = W.LAKE, pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; pts.push([L.x + Math.cos(a) * (L.r + 5), L.z + Math.sin(a) * (L.r + 5)]); } pts.forEach(([x, z], i) => { const g = archMesh(i); g.position.set(x, W.H(x, z), z); const a = i / 8 * Math.PI * 2; g.rotation.y = -a; qGroup.add(g); QS.objs.push(g); }); QS.gate = 0; QS.timer = s.time; raceStyle(); }
  if (s.k === 'deliver') { QS.carry = giftCarry(); QS.carry.position.set(0, 1.75, 0); player.add(QS.carry); QS.homes = V.doors.filter(d => !d.job).sort((a, b) => a.pos.distanceTo(P.pos) - b.pos.distanceTo(P.pos)).slice(0, 3).map(d => d.pos.clone()); QS.homes.slice(qState().n).forEach(p => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: .25, side: THREE.DoubleSide, depthWrite: false })); m.position.set(p.x, W.H(p.x, p.z) + 3, p.z); m.userData.home = p; qGroup.add(m); QS.objs.push(m); }); }
}
function raceStyle() { QS.objs.forEach(o => { const on = o.userData.i === QS.gate; o.children[0].material.emissive.set(on ? 0xffc040 : 0x30ffa8); o.children[0].material.emissiveIntensity = on ? 2.6 : .5; o.visible = o.userData.i >= QS.gate; }); }
function stepDone() {
  const s = curStep(), q = qState(); if (!s) return;
  if (s.reward) { addCandy(s.reward); addXP(s.reward); }
  if (s.fireworks) fireworks();
  q.st++; q.n = 0; sfx('ok'); FX.emit(P.pos.clone().setY(P.pos.y + 1), 30, { speed: 3, life: 1, size: .45, glow: 1, color: 0x9fffd8, grav: 1 }); P.cheer = 1;
  if (q.st >= Q[q.ch].steps.length) { toast('🏆 ' + Q[q.ch].t + ' geschafft!', 4500); sfx('rank'); q.ch++; q.st = 0; addXP(40); if (Q[q.ch]) { const nt = Q[q.ch].t; setTimeout(() => toast('Neues Kapitel: ' + nt, 4500), 4600); } else setTimeout(() => toast('🎉 Du hast die ganze Geschichte geschafft! Jetzt warten jeden Tag neue Aufgaben im Rathaus.', 6000), 4600); }
  save(); setupStep();
}
function questTalk(name) {
  const s = curStep(); if (!s || s.k !== 'talk' || s.npc !== name) return false;
  panel(`<h2>${name}</h2><p class="say">«${s.say}»</p><button class="btn" data-close>${s.reward ? 'Danke!' : 'Mach ich!'}</button>`); stepDone(); return true;
}
function questEvent(type, data) {
  const s = curStep(), q = qState(); if (!s) return;
  if (s.k === 'job' && type === s.job) stepDone();
  else if (s.k === 'mission' && type === 'mission') stepDone();
  else if (s.k === 'build' && type === 'build') { q.n++; renderQuest(); if (q.n >= s.n) stepDone(); else save(); }
  else if (s.k === 'rings' && type === 'rings') { q.n++; renderQuest(); if (q.n >= s.n) stepDone(); else save(); }
  else if (s.k === 'target' + 's' && type === 'target') { const root = data.userData.root; if (!root.visible) return; root.visible = false; FX.emit(root.position.clone().setY(1.6), 25, { speed: 3, life: .8, size: .4, glow: 1, color: 0xff6a6a, grav: 2 }); targets.splice(targets.indexOf(data), 1); q.n++; sfx('coin'); renderQuest(); if (q.n >= s.n) stepDone(); }
  else if (s.k === 'hitnpc' && type === 'hitnpc' && data === s.npc) { q.n++; renderQuest(); if (q.n >= s.n) stepDone(); }
}
const QUESTAPI = { ev: (t, d) => { if (t === 'hitnpc') return; questEvent(t, d); } };
function updateQuest(dt) {
  const s = curStep(), q = qState(); if (!s || P.scene !== village) return;
  for (const o of QS.objs) if (o.userData.spin) { o.rotation.y += dt * 2; o.position.y += Math.sin(T * 3 + o.position.x) * .003; }
  if (s.k === 'collect') for (const o of [...QS.objs]) { if (o.position.distanceTo(P.pos.clone().setY(P.pos.y + .6)) < 1.4) { qGroup.remove(o); QS.objs.splice(QS.objs.indexOf(o), 1); q.n++; sfx('star'); FX.emit(o.position, 20, { speed: 2.5, life: .8, size: .4, glow: 1, color: 0xfff0c0, grav: 1 }); toast('✉️ Wunschzettel ' + q.n + '/' + s.n); renderQuest(); save(); if (q.n >= s.n) stepDone(); break; } }
  if (s.k === 'trail' && QS.blitzi && QS.blitzi.position.distanceTo(P.pos) < 4) { toast('🦌 Da ist Blitzi! Er versteckt sich hinter einer Tanne.'); stepDone(); }
  if ((s.k === 'lead' || s.k === 'trail') && QS.blitzi) { const b = QS.blitzi; if (s.k === 'lead') { const to = P.pos.clone().sub(b.position); to.y = 0; const d = to.length(); if (d > 3) { to.normalize(); b.position.addScaledVector(to, Math.min(d - 3, dt * (d > 8 ? 9 : 5))); b.rotation.y = Math.atan2(-to.z, to.x); b.userData.legs.forEach((l, i) => l.rotation.z = Math.sin(T * 12 + i * 1.6) * .5); } b.position.y = W.H(b.position.x, b.position.z); if (b.position.distanceTo(new THREE.Vector3(42, b.position.y, 22)) < 6) { village.remove(b); QS.blitzi = null; stepDone(); } } else { b.userData.head.rotation.z = Math.sin(T * 2) * .2; } }
  if (s.k === 'targets') { QS.timer -= dt; for (const o of QS.objs) if (o.visible) o.rotation.y += Math.sin(T + o.position.x) * dt * .5; if (QS.timer <= 0) { toast('⏱ Zeit um! Nochmal von vorn.'); q.n = 0; setupStep(); } renderQuestTimer(); }
  if (s.k === 'race') { QS.timer -= dt; const g = QS.objs.find(o => o.userData.i === QS.gate); if (g && Math.hypot(g.position.x - P.pos.x, g.position.z - P.pos.z) < 2.8) { QS.gate++; sfx('coin'); FX.emit(g.position.clone().setY(2), 20, { speed: 3, life: .8, size: .4, glow: 1, color: 0x9fffd8, grav: 0 }); if (QS.gate >= 8) { stepDone(); return; } raceStyle(); } if (QS.timer <= 0) { toast('⏱ Zu langsam! Versuch es nochmal.'); QS.gate = 0; QS.timer = s.time; raceStyle(); } renderQuestTimer(); }
  if (s.k === 'deliver') for (const o of [...QS.objs]) { const h = o.userData.home; if (Math.hypot(h.x - P.pos.x, h.z - P.pos.z) < 2.6) { qGroup.remove(o); QS.objs.splice(QS.objs.indexOf(o), 1); q.n++; sfx('bell'); toast('🎁 Geschenk geliefert! (' + q.n + '/3)'); FX.emit(h.clone().setY(W.H(h.x, h.z) + 1.5), 25, { speed: 3, life: 1, size: .4, glow: 1, color: 0xffd27a, grav: 1 }); renderQuest(); save(); if (q.n >= s.n) { stepDone(); } break; } }
  if (s.k === 'fly' && P.mode === 'fly') stepDone();
}
function questTarget() {
  const s = curStep(); if (!s) return null; const q = qState();
  if (s.k === 'talk') { const n = npcBy(s.npc); return n ? { txt: s.txt, pos: n.m.position } : null; }
  if (s.at) return { txt: s.txt, pos: s.at() };
  if (s.k === 'collect' && QS.objs.length) { const o = QS.objs.slice().sort((a, b) => a.position.distanceTo(P.pos) - b.position.distanceTo(P.pos))[0]; return { txt: s.txt + ' (' + q.n + '/' + s.n + ')', pos: o.position }; }
  if (s.k === 'trail') return { txt: s.txt, pos: new THREE.Vector3(96, 0, -62) };
  if (s.k === 'race') { const g = QS.objs.find(o => o.userData.i === QS.gate) || QS.objs[0]; return g ? { txt: s.txt + ' Tor ' + (QS.gate + 1) + '/8', pos: g.position } : null; }
  if (s.k === 'targets' && targets.length) return { txt: s.txt + ' ' + q.n + '/' + s.n, pos: targets[0].userData.root.position };
  if (s.k === 'deliver' && QS.objs.length) return { txt: s.txt + ' ' + q.n + '/3', pos: QS.objs[0].userData.home };
  if (s.k === 'hitnpc') { const n = npcBy(s.npc); return n ? { txt: s.txt + ' ' + q.n + '/' + s.n, pos: n.m.position } : null; }
  return { txt: s.txt, pos: null };
}
function renderQuest() { const s = curStep(), q = qState(), el = $('#quest'); if (!el) return; if (!s) { el.innerHTML = '<small>Dorfheld</small><b>Alle Kapitel geschafft! Tagesaufgaben gibt es im Rathaus.</b>'; return; } el.innerHTML = `<small>${Q[q.ch].t}</small><b>${s.txt}${s.n ? ' <span>' + q.n + '/' + s.n + '</span>' : ''}</b><i id="qtimer"></i>`; }
function renderQuestTimer() { const e = $('#qtimer'); if (e) e.textContent = Math.max(0, Math.ceil(QS.timer)) + ' s'; }
// Feuerwerk über dem Dorfplatz
function fireworks() {
  const cols = [0xff4a4a, 0xffd27a, 0x7ad0ff, 0x8aff9a, 0xff7ae0, 0xffffff]; let k = 0;
  const one = () => { const p = new THREE.Vector3((Math.random() - .5) * 30, 26 + Math.random() * 14, (Math.random() - .5) * 30); FX.emit(p, 70, { speed: 9, life: 1.6, size: .7, glow: 1, color: cols[k % cols.length], grav: 3, spread: .2 }); tone(200 + Math.random() * 100, .4, 'sawtooth', .05); noiseBurst(.4, 1200, .2); if (++k < 24) setTimeout(one, 260 + Math.random() * 300); };
  one();
}
// Zufalls-Aufträge nach der Story (Auftragsbrett im Rathaus)

QUEST = { ev: questEvent };

// ================= Titel =================
function title() {
  const has = !!S.name; $('#title').classList.add('on');
  $('#tname').value = S.name || '';
  $('#tcont').style.display = has ? '' : 'none';
  const sel = (q, v) => [...document.querySelectorAll(q)].forEach(b => b.classList.toggle('on', b.dataset.v === String(v)));
  sel('[data-th]', S.hat); sel('[data-tc]', S.coat);
  document.querySelectorAll('[data-th]').forEach(b => b.onclick = () => { S.hat = +b.dataset.v; sel('[data-th]', S.hat); makePlayer(); village.add(player); });
  document.querySelectorAll('[data-tc]').forEach(b => b.onclick = () => { S.coat = b.dataset.v; sel('[data-tc]', S.coat); makePlayer(); village.add(player); });
  const go = () => { S.name = ($('#tname').value || '').trim().slice(0, 16) || S.name || 'Wichtel'; save(); $('#title').classList.remove('on'); audio(); P.mode = 'walk'; CAM.yaw = 0; hud(); renderTasks(); setupStep(); $('#hudwrap').classList.add('on'); const t = tutTarget(); toast(t ? 'Hallo ' + S.name + '! ' + t.txt : 'Willkommen zurück, ' + S.name + '!', 4500); };
  const land = () => { try { if (isTouch && document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => { })).catch(() => { }); } catch (e) { } };
  $('#tstart').onclick = () => { land(); go(); }; $('#tcont').onclick = () => { land(); go(); };
}

// ================= Hauptschleife =================
let last = performance.now(), T = 0, dayT = .62;
P.speed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now; T += dt;
  if (kakaoT > 0) kakaoT -= dt;
  // Tag/Nacht (Polarnacht mit kurzer Dämmerung)
  dayT = (dayT + dt / 600) % 1; const day = Math.pow(Math.max(0, Math.sin(dayT * Math.PI * 2)), 1.2) * .8;
  sky.material.uniforms.uTime.value = T; sky.material.uniforms.uNight.value = 1 - day;
  hemi.intensity = .75 + day * .9; sun.intensity = 1.2 + day * 1.4; sun.color.setRGB(.75 + day * .25, .82 + day * .1, 1 - day * .15);
  village.fog.color.setRGB(.05 + day * .35, .1 + day * .3, .21 + day * .3);
  const inVillage = P.scene === village;
  // Eingabe → Bewegung
  if (P.mode === 'walk' || P.mode === 'build' || P.mode === 'mission' || P.mode === 'inside' || P.mode === 'town') {
    const RM = inVillage ? null : (P.mode === 'mission' ? MS.kh : P.mode === 'town' ? TOWN : IN);
    let ix = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + joy.x, iy = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) + joy.y;
    const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
    const mag = Math.min(1, l);
    const shift = K.ShiftLeft || K.ShiftRight;
    let sp = P.mode === 'mission' ? (shift || (joy.on && mag < .55) ? 2.4 : 6.5) : (shift || (joy.on && mag > .9) ? 9 : 5);
    if (kakaoT > 0 && P.mode !== 'mission') sp *= 1.45;
    if (P.mode === 'mission') sp *= 1.6;
    const fx = -Math.sin(CAM.yaw), fz = -Math.cos(CAM.yaw);
    const mx = (fx * iy + -fz * ix) * mag * sp, mz = (fz * iy + fx * ix) * mag * sp;
    const ice = inVillage && W.onIce(P.pos.x, P.pos.z); const k = ice ? 1.2 : 12;
    P.vel.x += (mx - P.vel.x) * Math.min(1, dt * k); P.vel.z += (mz - P.vel.z) * Math.min(1, dt * k);
    P.pos.x += P.vel.x * dt; P.pos.z += P.vel.z * dt;
    P.speed = Math.hypot(P.vel.x, P.vel.z);
    if (P.speed > .3) { const a = Math.atan2(P.vel.x, P.vel.z); let d = a - player.rotation.y; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; player.rotation.y += d * Math.min(1, dt * 10); }
    if (inVillage) { collide(P.pos, colliders, circles); const r = Math.hypot(P.pos.x, P.pos.z); if (r > 150) { P.pos.x *= 150 / r; P.pos.z *= 150 / r; } }
    else collide(P.pos, RM.colliders, RM.circles);
    const base = inVillage ? (ice ? .02 : W.H(P.pos.x, P.pos.z)) : 0;
    const gy = inVillage ? supportY(P.pos, colliders, circles, base) : supportY(P.pos, RM.colliders, RM.circles, base);
    const jumpHeld = K.Space || holdJ;
    if (jumpPressed && P.mode !== 'build') {
      if (P.onG) { P.vy = 8.2; P.onG = false; P.jumps = 1; sfx('jump'); FX.emit(P.pos, 8, { speed: 1.5, life: .5, size: .4, grav: 2 }); if (P.mode === 'mission') MS.noise += 6; }
      else if (P.jumps < 2) { P.vy = 7.6; P.jumps = 2; P.flip = 1; sfx('jump'); tone2(); FX.emit(P.pos.clone().setY(P.pos.y + .4), 14, { speed: 2, life: .6, size: .25, glow: 1, color: 0xffe7a0, grav: 0 }); if (P.mode === 'mission') MS.noise += 8; }
    }
    P.glide = !P.onG && P.vy < 0 && jumpHeld && P.jumps >= 1 && P.airT > .25;
    P.vy -= (P.glide ? 6 : 20) * dt; if (P.glide) { P.vy = Math.max(P.vy, -2.2); if (Math.random() < dt * 20) FX.emit(P.pos.clone().setY(P.pos.y + .2), 1, { speed: .3, life: .8, size: .18, glow: 1, color: 0xbfe6ff, grav: -0.3 }); }
    const wasAir = !P.onG; P.pos.y += P.vy * dt;
    if (P.pos.y <= gy) {
      if (wasAir) { const hard = -P.vy; if (hard > 4) { P.land = Math.min(1, hard / 14); FX.emit(P.pos, Math.min(22, 6 + hard * 1.2), { speed: 1.2 + hard * .15, life: .7, size: .45, grav: 3, up: .6 }); sfx('step'); if (P.mode === 'mission') MS.noise += hard > 9 ? 10 : 3; } }
      P.pos.y = gy; P.vy = 0; P.onG = true; P.jumps = 0; P.airT = 0;
    } else if (P.pos.y > gy + .05) { P.onG = false; P.airT += dt; }
    P.flip = Math.max(0, P.flip - dt * 2.2); P.land = Math.max(0, P.land - dt * 5); P.cheer = Math.max(0, P.cheer - dt); P.throwT = Math.max(0, P.throwT - dt);
    player.position.copy(P.pos);
    MD.animateWichtel(player, dt, P.onG ? P.speed : 0, { air: !P.onG, vy: P.vy, glide: P.glide, flip: P.flip, land: P.land, cheer: P.cheer });
    if (P.throwT > 0) player.userData.arms[1].rotation.x = -2.6 + (1 - P.throwT / .35) * 3.4;
    if (P.onG && P.speed > 1) { P.stepT -= dt * P.speed; if (P.stepT < 0) { P.stepT = 2.2; if (inVillage && !ice && P.pos.y - base < .1) { STEPS.add(P.pos.x, P.pos.y, P.pos.z, player.rotation.y); if (P.speed > 6) FX.emit(P.pos, 2, { speed: .8, life: .5, size: .3, grav: 3, up: .4 }); } if (P.mode !== 'mission') sfx('step'); else if (P.speed > 4) { sfx('step'); } } }
    if (ice && P.speed > 6 && P.onG && Math.random() < dt * 30) FX.emit(P.pos, 1, { speed: .5, life: .4, size: .2, glow: 1, color: 0xcff0ff, grav: 0 });
    if (P.mode === 'mission' && P.speed > 4.5) MS.noise += dt * (P.speed > 7 ? 20 : 5);
    if (P.mode === 'build') updateBuild();
  } else if (P.mode === 'fly') updateFly(dt);
  else if (P.mode === 'title') { CAM.yaw += dt * .08; }
  // Sterne
  updateBalls(dt); FX.update(dt); if (P.mode === 'walk' || P.mode === 'fly') updateQuest(dt);
  for (const s of starMeshes) if (s.visible) { s.rotation.y += dt * 2; s.position.y += Math.sin(T * 2 + s.userData.i) * .004; if (P.mode === 'walk' && s.position.distanceTo(player.position.clone().setY(player.position.y + .8)) < 1.4) collectStar(s); }
  // NPC
  if (inVillage) for (const n of npcs) {
    const m = n.m, d = m.position.distanceTo(P.pos);
    if (d > 70) { m.visible = false; continue; } m.visible = true;
    if (n.hitT > 0) { n.hitT -= dt; m.rotation.y += dt * 10; MD.animateWichtel(m, dt, 0, { cheer: n.hitT }); continue; }
    if (d < 2.6 && P.mode === 'walk') { const a = Math.atan2(P.pos.x - m.position.x, P.pos.z - m.position.z); m.rotation.y += (a - m.rotation.y) * .1; MD.animateWichtel(m, dt, 0); continue; }
    if (n.wait > 0 || n.d.stay) { n.wait -= dt; MD.animateWichtel(m, dt, 0); continue; }
    if (!n.target) npcTarget(n);
    const to = n.target.clone().sub(m.position); to.y = 0; const l = to.length();
    if (l < 1) { n.target = null; n.wait = 2 + Math.random() * 5; continue; }
    to.multiplyScalar(1 / l); m.position.addScaledVector(to, dt * 1.8); collide(m.position, colliders, circles, .4); m.position.y = W.H(m.position.x, m.position.z); m.rotation.y = Math.atan2(to.x, to.z); MD.animateWichtel(m, dt, 1.8);
  }
  // Animationen im Dorf
  if (inVillage) {
    const A = V.anim; if (A.tree) A.tree.userData.star.rotation.y += dt; if (A.padRing) A.padRing.material.emissiveIntensity = 1.5 + Math.sin(T * 3) * .8; if (A.portal) { A.portal.rotation.z += dt * .3; A.portal.children[1].material.opacity = .2 + Math.sin(T * 2) * .08; }
    if (A.towers) A.towers.forEach(t => { const h = t.userData.hands; if (h) { const d = new Date(); h[0].rotation.z = -(d.getHours() % 12 + d.getMinutes() / 60) / 12 * Math.PI * 2; h[1].rotation.z = -d.getMinutes() / 60 * Math.PI * 2; } if (t.userData.bell) t.userData.bell.rotation.z = Math.sin(T * 1.2) * .08; });
    if (A.reindeer) A.reindeer.forEach((r, i) => { r.userData.head.rotation.z = Math.sin(T * .8 + i) * .15 - .1; });
    mobil.userData.glow.material.opacity = .2 + Math.sin(T * 4) * .08; if (P.mode !== 'fly') mobil.position.y = W.H(W.PAD.x, W.PAD.z) + .7 + Math.sin(T * 1.5) * .12;
    snow.userData.update(dt, P.pos.x, P.pos.z, T); smoke.userData.update(dt);
    sun.position.set(P.pos.x + 30, P.pos.y + 55, P.pos.z + 18); sun.target.position.copy(P.pos);
  }
  if (P.mode === 'mission') updateMission(dt);
  if (IN && P.scene === IN.scene) IN.anim.forEach(f => f(T, dt));
  if (TOWN && P.scene === TOWN.scene) { TOWN.anim.forEach(f => f(T, dt)); if (orderT > 0) { orderT -= dt; if (orderT <= 0) { toast('🛷 Dein Wichtelmobil ist da!'); worldMap(true); } } }
  if (P.mode === 'travel' && FL) { FL.tick(T, dt); TRV.t += dt; if (TRV.t >= TRV.dur && !TRV.done) { TRV.done = true; arrive(); } }
  if (P.mode === 'express') updateExpress();
  if (inVillage) REG.anim.forEach(f => f(T, dt));
  // Kamera
  const tgt = P.mode === 'fly' || P.mode === 'express' ? mobil.position : P.mode === 'travel' ? FL.mobil.position : (P.mode === 'title' ? new THREE.Vector3(0, 6, 0) : P.pos);
  CAM.tgt.lerp(new THREE.Vector3(tgt.x, tgt.y + (P.mode === 'fly' ? 2 : 1.5), tgt.z), P.mode === 'title' ? 1 : Math.min(1, dt * 10));
  let dist = CAM.dist, yaw = CAM.yaw, pitch = CAM.pitch;
  if (P.mode === 'fly') { dist = 13; yaw = F.yaw + Math.PI; pitch = .28 - F.pitch * .4; CAM.yaw += (yaw - CAM.yaw) * .05; }
  if (P.mode === 'title') { dist = 48; pitch = .3; }
  if (P.mode === 'travel') { dist = 9; pitch = .25; yaw = -Math.PI / 2 + Math.sin(T * .3) * .6; }
  const cp = new THREE.Vector3(CAM.tgt.x + Math.sin(yaw) * Math.cos(pitch) * dist, CAM.tgt.y + Math.sin(pitch) * dist, CAM.tgt.z + Math.cos(yaw) * Math.cos(pitch) * dist);
  if (inVillage) { const gh = W.H(cp.x, cp.z) + .6; if (cp.y < gh) cp.y = gh; if (P.mode === 'walk' || P.mode === 'build') cp.copy(camBlock(CAM.tgt, cp)); } else { const RMc = P.mode === 'inside' ? IN : P.mode === 'mission' ? MS.kh : null; if (RMc) { cp.x = Math.max(-RMc.W + .6, Math.min(RMc.W - .6, cp.x)); cp.z = Math.max(-RMc.D + .6, Math.min(RMc.D - .6, cp.z)); cp.y = Math.min(cp.y, P.mode === 'inside' ? 3.7 : 10); } }
  camera.position.lerp(cp, P.mode === 'title' ? 1 : Math.min(1, dt * 8)); camera.lookAt(CAM.tgt);
  // Interaktionen
  near = (P.mode === 'walk' || P.mode === 'fly' || P.mode === 'mission' || P.mode === 'inside' || P.mode === 'town') ? findNear() : null;
  const pr = $('#prompt'); if (near) { pr.textContent = (isTouch ? '✋ ' : '[E] ') + near.label; pr.classList.add('on'); } else pr.classList.remove('on');
  if (actionPressed) { if (P.mode === 'ui' && P.uiAction) P.uiAction(); else if (near && near.t !== 'prank') interact(near); else if (P.mode === 'build') placeNow(); }
  if (P.mode !== 'ui') P.uiAction = null;
  actionPressed = false; jumpPressed = false;
  // Kompass zum Ziel
  let tt = P.mode === 'walk' || P.mode === 'fly' ? tutTarget() : null; const cmp = $('#compass');
  if (P.mode === 'mission' && MS.kh) { let best = null, bd = 1e9; for (const k of MS.todo) if (!MS.done.includes(k)) { const sp = MS.kh.spots[k], d = Math.hypot(sp.pos.x - P.pos.x, sp.pos.z - P.pos.z); if (d < bd) { bd = d; best = { txt: sp.name, pos: sp.pos }; } } tt = best || { txt: 'Zurück zur Wichteltür', pos: MS.kh.exit }; for (const k in MS.marks) MS.marks[k].material.opacity = .5 + Math.sin(T * 4) * .35; }
  if (tt && tt.pos) { const dx = tt.pos.x - P.pos.x, dz = tt.pos.z - P.pos.z, a = Math.atan2(dx, dz) - (CAM.yaw + Math.PI); cmp.classList.add('on'); $('#carrow').style.transform = `rotate(${-a}rad)`; $('#ctext').textContent = tt.txt; $('#cdist').textContent = Math.round(Math.hypot(dx, dz)) + ' m'; } else cmp.classList.remove('on');
  if (composer && P.scene === village) { renderPass.scene = P.scene; composer.render(); } else renderer.render(P.scene, camera);
  if (!window.__ready) { window.__ready = 1; $('#loading').classList.remove('on'); }
}
ensureDay(); hud(); title();
requestAnimationFrame(frame);
window.__dbg = { TR, travelTo, getTOWN: () => TOWN, worldMap, waitExpress, enterBuilding, exitBuilding, REG, getIN: () => IN, Q, qState, setupStep, stepDone, questEvent, questTalk, QS, targets, npcs, throwBall, renderer, village, S, P, V, MS, startMission, startFly, land, JOBS, toggleMap, CAM, interact, findNear: () => near };

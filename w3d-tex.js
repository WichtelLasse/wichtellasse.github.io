// Prozedurale Texturen für Wichtel 3D (keine externen Bilder nötig)
import * as THREE from './three.min.js';

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }

// Wertrauschen für weiche Strukturen
function noiseCanvas(size, seed, oct, base, amp) {
  const c = cv(size, size), g = c.getContext('2d'), img = g.createImageData(size, size), r = rnd(seed);
  const grids = [];
  for (let o = 0; o < oct; o++) { const n = 4 << o, a = []; for (let i = 0; i < n * n; i++) a.push(r()); grids.push([n, a]); }
  const sm = t => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, w = 1, tw = 0;
    for (const [n, a] of grids) {
      const fx = x / size * n, fy = y / size * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = sm(fx - ix), ty = sm(fy - iy);
      const g0 = (i, j) => a[((j % n + n) % n) * n + ((i % n + n) % n)];
      const top = g0(ix, iy) * (1 - tx) + g0(ix + 1, iy) * tx, bot = g0(ix, iy + 1) * (1 - tx) + g0(ix + 1, iy + 1) * tx;
      v += (top * (1 - ty) + bot * ty) * w; tw += w; w *= .5;
    }
    v /= tw; const k = (y * size + x) * 4;
    img.data[k] = base[0] + (v - .5) * amp; img.data[k + 1] = base[1] + (v - .5) * amp; img.data[k + 2] = base[2] + (v - .5) * amp; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}

// Normalmap aus Helligkeit (Sobel) – gibt Oberflächen echte Tiefe
function normalFrom(src, strength) {
  const w = src.width, h = src.height, s = src.getContext('2d').getImageData(0, 0, w, h).data;
  const c = cv(w, h), g = c.getContext('2d'), img = g.createImageData(w, h);
  const L = (x, y) => s[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (L(x + 1, y) - L(x - 1, y)) * strength, dy = (L(x, y + 1) - L(x, y - 1)) * strength;
    let nx = -dx, ny = -dy, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (y * w + x) * 4; img.data[k] = (nx * .5 + .5) * 255; img.data[k + 1] = (ny * .5 + .5) * 255; img.data[k + 2] = (nz * .5 + .5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}

function tex(c, rep, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
  t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}

function planks(seed, col, dark) {
  const c = cv(256, 256), g = c.getContext('2d'), r = rnd(seed);
  for (let i = 0; i < 8; i++) {
    const y = i * 32, sh = (r() - .5) * 26;
    g.fillStyle = `rgb(${col[0] + sh},${col[1] + sh * .8},${col[2] + sh * .6})`; g.fillRect(0, y, 256, 32);
    for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(0,0,0,${.04 + r() * .07})`; g.lineWidth = 1; g.beginPath(); const yy = y + r() * 32; g.moveTo(0, yy); g.bezierCurveTo(80, yy + (r() - .5) * 6, 170, yy + (r() - .5) * 6, 256, yy + (r() - .5) * 4); g.stroke(); }
    if (r() < .5) { g.fillStyle = 'rgba(40,20,5,.35)'; g.beginPath(); g.ellipse(r() * 256, y + 16, 5, 3, 0, 0, 7); g.fill(); }
    g.fillStyle = `rgba(${dark},${dark * .6},${dark * .3},.9)`; g.fillRect(0, y, 256, 2.5);
    const cut = r() * 256; g.fillRect(cut, y, 2, 32);
  }
  return c;
}

function bricks(seed, col) {
  const c = cv(256, 256), g = c.getContext('2d'), r = rnd(seed);
  g.fillStyle = '#d9d2c6'; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 16; row++) for (let i = -1; i < 5; i++) {
    const x = i * 64 + (row % 2) * 32 + 2, y = row * 16 + 2, sh = (r() - .5) * 40;
    g.fillStyle = `rgb(${col[0] + sh},${col[1] + sh * .6},${col[2] + sh * .5})`; g.fillRect(x, y, 60, 12);
    g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(x, y, 60, 3);
  }
  return c;
}

function shingles(seed, col) {
  const c = cv(256, 256), g = c.getContext('2d'), r = rnd(seed);
  g.fillStyle = `rgb(${col[0] * .6},${col[1] * .6},${col[2] * .6})`; g.fillRect(0, 0, 256, 256);
  for (let row = 0; row < 12; row++) for (let i = -1; i < 9; i++) {
    const x = i * 32 + (row % 2) * 16, y = row * 22, sh = (r() - .5) * 30;
    g.fillStyle = `rgb(${col[0] + sh},${col[1] + sh},${col[2] + sh})`;
    g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + 31, y); g.lineTo(x + 31, y + 22); g.quadraticCurveTo(x + 16, y + 30, x + 1, y + 22); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke();
  }
  return c;
}

function stone(seed) {
  const c = noiseCanvas(256, seed, 5, [150, 150, 158], 90), g = c.getContext('2d'), r = rnd(seed + 9);
  g.strokeStyle = 'rgba(60,60,70,.7)'; g.lineWidth = 3;
  for (let row = 0; row < 6; row++) { const y = row * 43; g.beginPath(); g.moveTo(0, y); g.lineTo(256, y + (r() - .5) * 6); g.stroke(); for (let i = 0; i < 4; i++) { const x = (i + (row % 2) * .5) * 64 + (r() - .5) * 12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 6, y + 43); g.stroke(); } }
  return c;
}

function fabric(col, stripe) {
  const c = cv(128, 128), g = c.getContext('2d');
  g.fillStyle = `rgb(${col.join(',')})`; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 128; i += 2) { g.fillStyle = `rgba(0,0,0,${i % 4 ? .05 : .1})`; g.fillRect(0, i, 128, 1); g.fillRect(i, 0, 1, 128); }
  if (stripe) { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 128; i += 32) g.fillRect(0, i, 128, 8); }
  return c;
}

export function makeTextures() {
  const snowC = noiseCanvas(512, 7, 6, [236, 242, 250], 26);
  // feine Glitzerpunkte im Schnee
  { const g = snowC.getContext('2d'), r = rnd(3); for (let i = 0; i < 2200; i++) { g.fillStyle = `rgba(255,255,255,${.5 + r() * .5})`; g.fillRect(r() * 512, r() * 512, 1, 1); } }
  const snowN = normalFrom(noiseCanvas(512, 8, 6, [128, 128, 128], 200), 3.2);
  const woodC = planks(11, [128, 80, 46], 50), woodN = normalFrom(woodC, 4);
  const woodRed = planks(12, [150, 42, 38], 40), woodRedN = normalFrom(woodRed, 4);
  const woodBlue = planks(13, [52, 88, 128], 30), woodGreen = planks(14, [58, 104, 70], 30), woodCream = planks(15, [226, 210, 178], 70);
  const brickC = bricks(21, [150, 60, 45]), brickN = normalFrom(brickC, 5);
  const roofRed = shingles(31, [140, 40, 36]), roofDark = shingles(32, [70, 60, 58]), roofGreen = shingles(33, [46, 86, 64]), roofN = normalFrom(roofDark, 5);
  const stoneC = stone(41), stoneN = normalFrom(stoneC, 5);
  const bark = noiseCanvas(128, 51, 4, [92, 62, 40], 70), barkN = normalFrom(bark, 6);
  const ice = noiseCanvas(256, 61, 5, [170, 210, 235], 50);
  const T = {
    snow: tex(snowC, [40, 40]), snowN: tex(snowN, [40, 40], false),
    wood: tex(woodC, [2, 2]), woodN: tex(woodN, [2, 2], false),
    woodRed: tex(woodRed, [2, 2]), woodRedN: tex(woodRedN, [2, 2], false),
    woodBlue: tex(woodBlue, [2, 2]), woodGreen: tex(woodGreen, [2, 2]), woodCream: tex(woodCream, [2, 2]),
    brick: tex(brickC, [2, 2]), brickN: tex(brickN, [2, 2], false),
    roofRed: tex(roofRed, [3, 2]), roofDark: tex(roofDark, [3, 2]), roofGreen: tex(roofGreen, [3, 2]), roofN: tex(roofN, [3, 2], false),
    stone: tex(stoneC, [2, 1]), stoneN: tex(stoneN, [2, 1], false),
    bark: tex(bark, [1, 3]), barkN: tex(barkN, [1, 3], false),
    ice: tex(ice, [6, 6]),
    coatRed: tex(fabric([170, 30, 34]), [3, 3]), coatGreen: tex(fabric([36, 102, 60]), [3, 3]), coatBlue: tex(fabric([40, 74, 140]), [3, 3]),
    knit: tex(fabric([200, 30, 40], true), [2, 4])
  };
  return T;
}

// Schild mit Schrift (für Gebäude)
export function signTexture(text, bg = '#2b1a0e', fg = '#ffd27a') {
  const c = cv(512, 128), g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128);
  g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, 496, 112);
  g.fillStyle = fg; g.font = 'bold 60px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 60; while (g.measureText(text).width > 470 && fs > 20) { fs -= 4; g.font = `bold ${fs}px Georgia, serif`; }
  g.fillText(text, 256, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// Fensterlicht mit Sprossen und warmem Glühen
export function windowTexture(seed) {
  const c = cv(128, 160), g = c.getContext('2d'), r = rnd(seed);
  const gr = g.createRadialGradient(64, 90, 10, 64, 80, 90); gr.addColorStop(0, '#ffe7a6'); gr.addColorStop(1, '#e08a2c');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 160);
  if (r() < .6) { g.fillStyle = 'rgba(120,40,20,.35)'; g.fillRect(10, 10, 30, 140); g.fillRect(88, 10, 30, 140); }
  g.fillStyle = '#3b2412'; g.fillRect(0, 0, 128, 8); g.fillRect(0, 152, 128, 8); g.fillRect(0, 0, 8, 160); g.fillRect(120, 0, 8, 160); g.fillRect(60, 0, 8, 160); g.fillRect(0, 76, 128, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

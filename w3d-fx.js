// Effekte: Partikel (Schnee, Glitzer, Funken), Fussspuren, fliegende Zuckerstangen
import * as THREE from './three.min.js';

function spriteTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  if (kind === 'star') {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,230,150,.9)'); gr.addColorStop(1, 'rgba(255,200,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 2); g.lineTo(32, 62); g.moveTo(2, 32); g.lineTo(62, 32); g.stroke();
  } else {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.5, 'rgba(240,246,255,.55)'); gr.addColorStop(1, 'rgba(230,240,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Particles {
  constructor(scene, n = 400) {
    this.n = n; this.i = 0; this.scene = scene;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.size = new Float32Array(n);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n); this.grav = new Float32Array(n); this.s0 = new Float32Array(n);
    const mk = (tex, blend) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { map: { value: tex }, scale: { value: innerHeight / 2 } }, transparent: true, depthWrite: false, blending: blend, vertexColors: true,
        vertexShader: 'uniform float scale; attribute float size; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
        fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC, 1.0) * t; if(gl_FragColor.a < .02) discard; }'
      });
      const p = new THREE.Points(g, m); p.frustumCulled = false; return p;
    };
    this.soft = mk(spriteTex('soft'), THREE.NormalBlending); this.glow = mk(spriteTex('star'), THREE.AdditiveBlending);
    this.kind = new Uint8Array(n);
    scene.add(this.soft, this.glow);
  }
  move(scene) { scene.add(this.soft, this.glow); this.scene = scene; this.life.fill(0); }
  emit(p, count, o = {}) {
    for (let k = 0; k < count; k++) {
      const i = this.i = (this.i + 1) % this.n, sp = o.speed || 2, up = o.up || 1;
      this.pos[i * 3] = p.x + (Math.random() - .5) * (o.spread || .3); this.pos[i * 3 + 1] = p.y + (Math.random()) * (o.h || .1); this.pos[i * 3 + 2] = p.z + (Math.random() - .5) * (o.spread || .3);
      const a = Math.random() * Math.PI * 2, r = Math.random() * sp;
      this.vel[i * 3] = Math.cos(a) * r + (o.vx || 0); this.vel[i * 3 + 1] = (Math.random() * .7 + .3) * up * sp; this.vel[i * 3 + 2] = Math.sin(a) * r + (o.vz || 0);
      const c = new THREE.Color(o.color || 0xffffff); this.col[i * 3] = c.r; this.col[i * 3 + 1] = c.g; this.col[i * 3 + 2] = c.b;
      this.max[i] = this.life[i] = (o.life || 1) * (.6 + Math.random() * .6); this.grav[i] = o.grav === undefined ? 4 : o.grav; this.s0[i] = (o.size || .35) * (.6 + Math.random() * .8); this.kind[i] = o.glow ? 1 : 0;
    }
  }
  update(dt) {
    const A = [this.soft.geometry, this.glow.geometry];
    const ap = A.map(g => g.attributes.position.array), ac = A.map(g => g.attributes.color.array), as = A.map(g => g.attributes.size.array);
    for (let i = 0; i < this.n; i++) {
      const k = this.kind[i], o = 1 - k;
      if (this.life[i] > 0) {
        this.life[i] -= dt; const t = Math.max(0, this.life[i] / this.max[i]);
        this.vel[i * 3 + 1] -= this.grav[i] * dt; this.vel[i * 3] *= .98; this.vel[i * 3 + 2] *= .98;
        for (let j = 0; j < 3; j++) this.pos[i * 3 + j] += this.vel[i * 3 + j] * dt;
        for (let j = 0; j < 3; j++) { ap[k][i * 3 + j] = this.pos[i * 3 + j]; ac[k][i * 3 + j] = this.col[i * 3 + j] * (k ? t : 1); }
        as[k][i] = this.s0[i] * (k ? (.4 + t) : (1.6 - t * .6)) * (k ? 1 : t * 1.4);
        as[o][i] = 0;
      } else { as[0][i] = 0; as[1][i] = 0; }
    }
    A.forEach(g => { g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; g.attributes.size.needsUpdate = true; });
  }
  resize() { this.soft.material.uniforms.scale.value = innerHeight / 2; this.glow.material.uniforms.scale.value = innerHeight / 2; }
}

// Fussspuren im Schnee (Ringpuffer)
export class Footprints {
  constructor(scene, n = 180) {
    const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 32, 2, 16, 32, 16); gr.addColorStop(0, 'rgba(120,140,175,.55)'); gr.addColorStop(1, 'rgba(120,140,175,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(16, 32, 11, 26, 0, 0, 7); g.fill();
    const t = new THREE.CanvasTexture(c);
    this.m = new THREE.InstancedMesh(new THREE.PlaneGeometry(.22, .38), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), n);
    this.n = n; this.i = 0; this.m.frustumCulled = false; this.m.renderOrder = 1;
    const z = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < n; i++) this.m.setMatrixAt(i, z);
    scene.add(this.m); this.side = 1;
  }
  add(x, y, z, yaw) {
    this.side *= -1; const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, yaw, 'YXZ'));
    const ox = Math.cos(yaw) * .1 * this.side, oz = -Math.sin(yaw) * .1 * this.side;
    m.compose(new THREE.Vector3(x + ox, y + .03, z + oz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))), new THREE.Vector3(1, 1, 1));
    this.m.setMatrixAt(this.i, m); this.m.instanceMatrix.needsUpdate = true; this.i = (this.i + 1) % this.n;
  }
}

// Zuckerstangen fliegen vom Wichtel zum Zähler oben
export function candyFly(camera, world, n, target) {
  const v = world.clone().project(camera); const sx = (v.x * .5 + .5) * innerWidth, sy = (-v.y * .5 + .5) * innerHeight;
  const r = target.getBoundingClientRect(), tx = r.left + r.width / 2, ty = r.top + r.height / 2;
  for (let i = 0; i < Math.min(n, 12); i++) {
    const e = document.createElement('div'); e.className = 'cfly'; document.body.appendChild(e);
    const dx = (Math.random() - .5) * 120, dy = -40 - Math.random() * 80, d = 700 + i * 60;
    e.animate([{ transform: `translate(${sx}px,${sy}px) scale(.6)`, opacity: 0 }, { transform: `translate(${sx + dx}px,${sy + dy}px) scale(1.1)`, opacity: 1, offset: .35 }, { transform: `translate(${tx}px,${ty}px) scale(.5)`, opacity: 1 }], { duration: d, easing: 'cubic-bezier(.5,0,.6,1)', delay: i * 40 });
    setTimeout(() => { e.remove(); target.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 220 }); }, d + i * 40);
  }
}

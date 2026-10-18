// Système de tweens + effets visuels (particules, rayons, éclairs, ondes de choc, textes, secousses).
window.NFL = window.NFL || {};

(function () {
  const Ease = {
    linear: t => t,
    outQuad: t => 1 - (1 - t) * (1 - t),
    inQuad: t => t * t,
    outBack: t => { const s = 1.70158; t -= 1; return t * t * ((s + 1) * t + s) + 1; },
    outBounce: t => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  };

  const Tweens = {
    list: [],
    speed: 1,
    add(obj, to, dur, ease = Ease.outQuad, delay = 0) {
      return new Promise(resolve => {
        const from = {};
        for (const k in to) from[k] = obj[k];
        this.list.push({ obj, from, to, dur: Math.max(1, dur), t: -delay, ease, resolve });
      });
    },
    wait(ms) { return this.add({ v: 0 }, { v: 1 }, ms, Ease.linear); },
    update(dt) {
      const step = dt * this.speed;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const tw = this.list[i];
        tw.t += step;
        if (tw.t < 0) continue;
        const k = Math.min(1, tw.t / tw.dur);
        const e = tw.ease(k);
        for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
        if (k >= 1) { this.list.splice(i, 1); tw.resolve(); }
      }
    },
    clear() { this.list.forEach(t => t.resolve()); this.list = []; },
  };

  const FX = {
    particles: [], beams: [], rings: [], bolts: [], texts: [], dying: [],
    shake: 0, flash: 0,

    burst(x, y, colors, n = 14, power = 1) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = (2 + Math.random() * 5) * power;
        this.particles.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2,
          life: 1, decay: 0.012 + Math.random() * 0.02,
          size: 3 + Math.random() * 5, color: colors[i % colors.length],
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          shape: Math.random() < 0.5 ? 'rect' : 'circle',
        });
      }
    },
    confetti(w, h, n = 120) {
      const cols = ['#FFD54A', '#ffffff', '#E31837', '#1E88E5', '#43A047', '#FB8C00'];
      for (let i = 0; i < n; i++) {
        this.particles.push({
          x: Math.random() * w, y: -20 - Math.random() * h * 0.5,
          vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
          life: 1, decay: 0.003 + Math.random() * 0.004, size: 5 + Math.random() * 6,
          color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3,
          shape: 'rect', gravity: 0.03,
        });
      }
    },
    beam(x1, y1, x2, y2, color = '#fff6c0', width = 18) {
      this.beams.push({ x1, y1, x2, y2, color, width, life: 1 });
    },
    ring(x, y, maxR, color = '#ffb300') {
      this.rings.push({ x, y, r: 4, maxR, color, life: 1 });
    },
    bolt(x1, y1, x2, y2) {
      const pts = [];
      const n = 8;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const j = i === 0 || i === n ? 0 : (Math.random() - 0.5) * 26;
        const nx = -(y2 - y1), ny = x2 - x1, l = Math.hypot(nx, ny) || 1;
        pts.push([x1 + (x2 - x1) * t + nx / l * j, y1 + (y2 - y1) * t + ny / l * j]);
      }
      this.bolts.push({ pts, life: 1 });
    },
    text(x, y, str, color = '#fff', size = 22) {
      this.texts.push({ x, y, str, color, size, life: 1 });
    },
    addShake(v) { this.shake = Math.min(18, this.shake + v); },

    update(dt) {
      const k = dt / 16.7;
      this.particles = this.particles.filter(p => {
        p.vy += (p.gravity != null ? p.gravity : 0.25) * k;
        p.x += p.vx * k; p.y += p.vy * k; p.rot += p.vr * k;
        p.life -= p.decay * k;
        return p.life > 0;
      });
      this.beams = this.beams.filter(b => (b.life -= 0.045 * k) > 0);
      this.rings = this.rings.filter(r => { r.r += (r.maxR - r.r) * 0.18 * k; return (r.life -= 0.04 * k) > 0; });
      this.bolts = this.bolts.filter(b => (b.life -= 0.05 * k) > 0);
      this.texts = this.texts.filter(t => { t.y -= 0.8 * k; return (t.life -= 0.015 * k) > 0; });
      this.dying = this.dying.filter(d => (d.life -= 0.07 * k) > 0);
      this.shake *= Math.pow(0.85, k);
      if (this.shake < 0.2) this.shake = 0;
      this.flash *= Math.pow(0.88, k);
    },
    reset() {
      this.particles = []; this.beams = []; this.rings = []; this.bolts = []; this.texts = []; this.dying = [];
      this.shake = 0; this.flash = 0;
    },
  };

  NFL.Ease = Ease;
  NFL.Tweens = Tweens;
  NFL.FX = FX;
})();

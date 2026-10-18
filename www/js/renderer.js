// Rendu canvas : stade, terrain, cases, pièces, spéciaux, effets et tutoriel.
window.NFL = window.NFL || {};

(function () {
  const TAU = Math.PI * 2;
  const RAINBOW = ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA'];

  function roundRect(ctx, x, y, w, h, r, begin = true) {
    if (begin) ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawFootball(ctx, x, y, w, rot = -0.5) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const h = w * 0.58;
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, '#a0522d'); g.addColorStop(1, '#5d2e12');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, w * 0.05); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-w * 0.2, 0); ctx.lineTo(w * 0.2, 0); ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(i * w * 0.08, -h * 0.13); ctx.lineTo(i * w * 0.08, h * 0.13); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-w * 0.38, -h * 0.3); ctx.lineTo(-w * 0.38, h * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.38, -h * 0.3); ctx.lineTo(w * 0.38, h * 0.3); ctx.stroke();
    ctx.restore();
  }

  function drawHelmet(ctx, x, y, s, team) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = team.c1;
    ctx.strokeStyle = 'rgba(0,0,0,.45)'; ctx.lineWidth = s * 0.03;
    ctx.beginPath();
    ctx.moveTo(-s * 0.42, s * 0.18);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.45, s * 0.35, -s * 0.5, s * 0.42, -s * 0.02);
    ctx.lineTo(s * 0.18, s * 0.05);
    ctx.lineTo(s * 0.12, s * 0.32);
    ctx.lineTo(-s * 0.3, s * 0.32);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = team.c2; ctx.lineWidth = s * 0.07;
    ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.36); ctx.quadraticCurveTo(-s * 0.48, -s * 0.15, -s * 0.38, s * 0.15); ctx.stroke();
    ctx.strokeStyle = '#bfc6cc'; ctx.lineWidth = s * 0.045;
    ctx.beginPath();
    ctx.moveTo(s * 0.18, s * 0.05); ctx.lineTo(s * 0.46, s * 0.06); ctx.lineTo(s * 0.44, s * 0.3); ctx.lineTo(s * 0.12, s * 0.3);
    ctx.moveTo(s * 0.16, s * 0.17); ctx.lineTo(s * 0.45, s * 0.18);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `900 ${s * 0.2}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(team.abbr, -s * 0.12, -s * 0.06);
    ctx.restore();
  }

  const R = {
    canvas: null, ctx: null, dpr: 1, W: 0, H: 0,
    bg: null, cs: 48, bx: 0, by: 0, badges: {}, flashes: [], time: 0,

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.resize();
    },

    resize() {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.W = rect.width; this.H = rect.height;
      this.canvas.width = Math.round(this.W * this.dpr);
      this.canvas.height = Math.round(this.H * this.dpr);
      this.canvas.style.width = this.W + 'px';
      this.canvas.style.height = this.H + 'px';
      this.buildBackground();
      this.badges = {};
    },

    layout(grid, topH, botH) {
      const availW = this.W - 16, availH = this.H - topH - botH - 20;
      this.cs = Math.floor(Math.min(availW / grid.cols, availH / grid.rows, 72));
      this.bx = Math.round((this.W - this.cs * grid.cols) / 2);
      this.by = Math.round(topH + 10 + (availH - this.cs * grid.rows) / 2);
      this.badges = {};
    },

    cellCenter(r, c) { return { x: this.bx + (c + 0.5) * this.cs, y: this.by + (r + 0.5) * this.cs }; },
    cellAt(px, py, grid) {
      const c = Math.floor((px - this.bx) / this.cs), r = Math.floor((py - this.by) / this.cs);
      return grid && grid.active(r, c) ? { r, c } : null;
    },

    buildBackground() {
      const W = this.W, H = this.H, d = this.dpr;
      const cv = document.createElement('canvas');
      cv.width = Math.max(1, W * d); cv.height = Math.max(1, H * d);
      const g = cv.getContext('2d');
      g.scale(d, d);
      let gr = g.createLinearGradient(0, 0, 0, H * 0.3);
      gr.addColorStop(0, '#030716'); gr.addColorStop(1, '#0c1838');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // tribunes
      const standTop = H * 0.04, standBot = H * 0.27;
      const crowd = ['#c62828', '#1565c0', '#f9a825', '#ffffff', '#2e7d32', '#6a1b9a', '#ef6c00', '#37474f'];
      for (let y = standTop; y < standBot; y += 6) {
        const tier = (y - standTop) / (standBot - standTop);
        g.fillStyle = `rgba(255,255,255,${0.03 + tier * 0.03})`;
        g.fillRect(0, y + 4, W, 1);
        for (let x = (y % 12) / 2; x < W; x += 5 + Math.random() * 2) {
          g.globalAlpha = 0.25 + tier * 0.5;
          g.fillStyle = crowd[Math.floor(Math.random() * crowd.length)];
          g.beginPath(); g.arc(x, y + Math.random() * 2, 1.6 + tier * 1.2, 0, TAU); g.fill();
        }
      }
      g.globalAlpha = 1;
      // pylônes d'éclairage
      [[W * 0.1, H * 0.06], [W * 0.9, H * 0.06]].forEach(([x, y]) => {
        g.fillStyle = '#1b2433'; g.fillRect(x - 2, y, 4, H * 0.2);
        const glow = g.createRadialGradient(x, y, 2, x, y, W * 0.45);
        glow.addColorStop(0, 'rgba(255,250,220,.55)'); glow.addColorStop(0.2, 'rgba(255,245,200,.12)'); glow.addColorStop(1, 'rgba(255,245,200,0)');
        g.fillStyle = glow; g.fillRect(0, 0, W, H);
        g.fillStyle = '#fffbe8';
        for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.fillRect(x - 14 + i * 7, y - 8 + j * 6, 5, 4);
      });
      // terrain
      const fieldTop = H * 0.26;
      const bands = 10, bh = (H - fieldTop) / bands;
      for (let i = 0; i < bands; i++) {
        g.fillStyle = i % 2 ? '#2f7d32' : '#358a38';
        g.fillRect(0, fieldTop + i * bh, W, bh + 1);
        g.fillStyle = 'rgba(255,255,255,.55)';
        g.fillRect(0, fieldTop + i * bh, W, 2);
        for (let k = 1; k < 5; k++) {
          g.fillRect(W * 0.32, fieldTop + i * bh + k * bh / 5, 10, 1.5);
          g.fillRect(W * 0.68 - 10, fieldTop + i * bh + k * bh / 5, 10, 1.5);
        }
        const num = [10, 20, 30, 40, 50, 40, 30, 20, 10][i];
        if (num) {
          g.save(); g.fillStyle = 'rgba(255,255,255,.35)';
          g.font = `900 ${bh * 0.45}px "Arial Black", Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.translate(W * 0.08, fieldTop + (i + 1) * bh); g.rotate(Math.PI / 2); g.fillText(num, 0, 0); g.restore();
          g.save(); g.fillStyle = 'rgba(255,255,255,.35)';
          g.font = `900 ${bh * 0.45}px "Arial Black", Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.translate(W * 0.92, fieldTop + (i + 1) * bh); g.rotate(-Math.PI / 2); g.fillText(num, 0, 0); g.restore();
        }
      }
      gr = g.createLinearGradient(0, fieldTop - 20, 0, fieldTop + 30);
      gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, fieldTop - 20, W, 50);
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      this.bg = cv;
    },

    // Pré-rendu d'un badge d'équipe à la taille courante (perf mobile)
    badge(team, size) {
      const key = team.id + ':' + size + ':' + NFL.Save.data.prefs.skin;
      if (this.badges[key]) return this.badges[key];
      const d = this.dpr, s = Math.ceil(size * d);
      const cv = document.createElement('canvas');
      cv.width = cv.height = s;
      const g = cv.getContext('2d');
      g.scale(d, d);
      const c = size / 2, r = size * 0.45;
      const gr = g.createRadialGradient(c - r * 0.3, c - r * 0.35, r * 0.1, c, c, r);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9e0e7');
      g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill();
      g.lineWidth = size * 0.075; g.strokeStyle = team.c1;
      g.beginPath(); g.arc(c, c, r - size * 0.035, 0, TAU); g.stroke();
      g.lineWidth = size * 0.02; g.strokeStyle = team.c2;
      g.beginPath(); g.arc(c, c, r - size * 0.08, 0, TAU); g.stroke();
      const img = NFL.Assets.logo(team.id);
      if (img && NFL.Save.data.prefs.skin === 'logo') {
        const ls = size * 0.64;
        g.drawImage(img, c - ls / 2, c - ls / 2, ls, ls);
      } else {
        drawHelmet(g, c, c + size * 0.02, size * 0.62, team);
      }
      // reflet
      g.fillStyle = 'rgba(255,255,255,.35)';
      g.beginPath(); g.ellipse(c - r * 0.25, c - r * 0.55, r * 0.45, r * 0.18, -0.4, 0, TAU); g.fill();
      this.badges[key] = cv;
      return cv;
    },

    drawPieceAt(ctx, game, p, x, y, scale = 1, alpha = 1) {
      const cs = this.cs, t = this.time;
      ctx.save();
      ctx.globalAlpha = alpha * (p.alpha == null ? 1 : p.alpha);
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      if (p.kind === 'dummy') { this.drawDummy(ctx, p); ctx.restore(); return; }
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.beginPath(); ctx.ellipse(0, cs * 0.36, cs * 0.34, cs * 0.09, 0, 0, TAU); ctx.fill();

      if (p.special === 'rainbow') {
        const r = cs * 0.44;
        ctx.save(); ctx.rotate(t * 0.003);
        RAINBOW.forEach((col, i) => {
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0);
          ctx.arc(0, 0, r, i / 6 * TAU, (i + 1) / 6 * TAU); ctx.closePath(); ctx.fill();
        });
        ctx.restore();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = cs * 0.05;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, 0, TAU); ctx.fill();
        drawFootball(ctx, 0, 0, cs * 0.5, Math.sin(t * 0.004) * 0.4 - 0.5);
        ctx.shadowColor = '#fff'; ctx.shadowBlur = 12 + Math.sin(t * 0.008) * 6;
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, TAU); ctx.stroke();
        ctx.restore();
        return;
      }

      const team = game.teams[p.color];
      if (p.special === 'bomb') {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.01);
        ctx.shadowColor = '#ff6d00'; ctx.shadowBlur = 14 + pulse * 14;
        ctx.fillStyle = `rgba(255,120,0,${0.35 + pulse * 0.3})`;
        ctx.beginPath(); ctx.arc(0, 0, cs * 0.5, 0, TAU); ctx.fill();
        ctx.shadowBlur = 0;
      }
      const b = this.badge(team, cs);
      ctx.drawImage(b, -cs / 2, -cs / 2, cs, cs);
      if (p.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${p.flash})`;
        ctx.beginPath(); ctx.arc(0, 0, cs * 0.45, 0, TAU); ctx.fill();
      }
      if (p.special === 'h' || p.special === 'v') {
        ctx.save();
        if (p.special === 'v') ctx.rotate(Math.PI / 2);
        const sh = (t * 0.004) % 1;
        ctx.shadowColor = '#ffe082'; ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(255,236,150,.95)'; ctx.lineWidth = cs * 0.06;
        for (const yy of [-cs * 0.2, cs * 0.2]) {
          ctx.beginPath(); ctx.moveTo(-cs * 0.46, yy); ctx.lineTo(cs * 0.46, yy); ctx.stroke();
        }
        ctx.fillStyle = '#fff59d';
        [-1, 1].forEach(dir => {
          ctx.beginPath();
          ctx.moveTo(dir * cs * 0.56, 0); ctx.lineTo(dir * cs * 0.4, -cs * 0.12); ctx.lineTo(dir * cs * 0.4, cs * 0.12);
          ctx.closePath(); ctx.fill();
        });
        ctx.fillStyle = 'rgba(255,255,255,.8)';
        ctx.beginPath(); ctx.arc(-cs * 0.46 + sh * cs * 0.92, -cs * 0.2, cs * 0.05, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(cs * 0.46 - sh * cs * 0.92, cs * 0.2, cs * 0.05, 0, TAU); ctx.fill();
        ctx.restore();
      }
      if (p.special === 'bomb') {
        for (let i = 0; i < 4; i++) {
          const a = t * 0.004 + i * TAU / 4;
          ctx.fillStyle = i % 2 ? '#ffeb3b' : '#ff5722';
          ctx.beginPath(); ctx.arc(Math.cos(a) * cs * 0.47, Math.sin(a) * cs * 0.47, cs * 0.06, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    },

    drawDummy(ctx, p) {
      const cs = this.cs;
      ctx.rotate(Math.sin(p.wobble * 20) * p.wobble * 0.4);
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      ctx.beginPath(); ctx.ellipse(0, cs * 0.4, cs * 0.3, cs * 0.07, 0, 0, TAU); ctx.fill();
      const w = cs * 0.56, h = cs * 0.82;
      const gr = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      gr.addColorStop(0, '#8e0000'); gr.addColorStop(0.45, '#e53935'); gr.addColorStop(1, '#7a0000');
      ctx.fillStyle = gr;
      roundRect(ctx, -w / 2, -h / 2, w, h, w * 0.35); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.9)';
      ctx.fillRect(-w / 2, -h * 0.12, w, h * 0.12);
      ctx.fillRect(-w / 2, h * 0.16, w, h * 0.08);
      ctx.fillStyle = '#212121';
      ctx.font = `900 ${cs * 0.16}px "Arial Black", Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('NFS', 0, -h * 0.28);
      if (p.hp > 1) {
        ctx.strokeStyle = '#9e9e9e'; ctx.lineWidth = cs * 0.08;
        ctx.beginPath(); ctx.moveTo(-w * 0.45, -h * 0.4); ctx.lineTo(w * 0.45, h * 0.4);
        ctx.moveTo(w * 0.45, -h * 0.4); ctx.lineTo(-w * 0.45, h * 0.4); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 1.5;
      roundRect(ctx, -w / 2, -h / 2, w, h, w * 0.35); ctx.stroke();
    },

    drawBoard(ctx, game) {
      const grid = game.grid, cs = this.cs;
      // cadre
      ctx.fillStyle = 'rgba(5,15,8,.75)';
      grid.forEach(k => { if (k.active) { roundRect(ctx, this.bx + k.c * cs - 5, this.by + k.r * cs - 5, cs + 10, cs + 10, 8); ctx.fill(); } });
      grid.forEach(k => {
        if (!k.active) return;
        const x = this.bx + k.c * cs, y = this.by + k.r * cs;
        ctx.fillStyle = (k.r + k.c) % 2 ? '#2e6b2f' : '#3a7f3b';
        ctx.fillRect(x, y, cs, cs);
        if (k.tile > 0) {
          const g = ctx.createLinearGradient(x, y, x + cs, y + cs);
          g.addColorStop(0, '#ffe082'); g.addColorStop(0.5, '#ffca28'); g.addColorStop(1, '#c79100');
          ctx.fillStyle = g;
          roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, 5); ctx.fill();
          ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, cs - 4, cs - 4); ctx.clip();
          ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = cs * 0.08;
          for (let i = -1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + i * cs * 0.5, y + cs); ctx.lineTo(x + i * cs * 0.5 + cs, y); ctx.stroke(); }
          ctx.restore();
          ctx.strokeStyle = 'rgba(120,80,0,.6)'; ctx.lineWidth = 1.5;
          roundRect(ctx, x + 2, y + 2, cs - 4, cs - 4, 5); ctx.stroke();
        }
      });
    },

    draw(game, dt) {
      const ctx = this.ctx, FX = NFL.FX;
      this.time += dt;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.drawImage(this.bg, 0, 0, this.W, this.H);
      // flashs d'appareils photo dans les tribunes
      if (Math.random() < 0.15) this.flashes.push({ x: Math.random() * this.W, y: this.H * (0.05 + Math.random() * 0.2), life: 1 });
      this.flashes = this.flashes.filter(f => {
        ctx.fillStyle = `rgba(255,255,255,${f.life})`;
        ctx.beginPath(); ctx.arc(f.x, f.y, 1.5 + f.life * 2, 0, TAU); ctx.fill();
        return (f.life -= 0.12) > 0;
      });
      if (!game || !game.grid) return;

      ctx.save();
      if (FX.shake) ctx.translate((Math.random() - 0.5) * FX.shake, (Math.random() - 0.5) * FX.shake);
      this.drawBoard(ctx, game);

      const cs = this.cs, grid = game.grid, t = this.time;
      // clip aux cases actives pour que les pièces qui tombent n'apparaissent pas hors plateau
      ctx.save();
      ctx.beginPath();
      grid.forEach(k => { if (k.active) ctx.rect(this.bx + k.c * cs - 4, this.by + k.r * cs - 4, cs + 8, cs + 8); });
      ctx.clip();
      const hint = game.hintCells || [];
      grid.forEach(k => {
        const p = k.piece;
        if (!p) return;
        const x = this.bx + (p.x + 0.5) * cs, y = this.by + (p.y + 0.5) * cs;
        let s = p.scale;
        if (hint.some(h => h.r === k.r && h.c === k.c)) s *= 1 + 0.09 * Math.sin(t * 0.012);
        if (game.selected && game.selected.r === k.r && game.selected.c === k.c) {
          ctx.save();
          ctx.shadowColor = '#ffeb3b'; ctx.shadowBlur = 16;
          ctx.strokeStyle = '#fff176'; ctx.lineWidth = 3;
          roundRect(ctx, this.bx + k.c * cs + 2, this.by + k.r * cs + 2, cs - 4, cs - 4, 8); ctx.stroke();
          ctx.restore();
          s *= 1.06 + 0.03 * Math.sin(t * 0.015);
        }
        this.drawPieceAt(ctx, game, p, x, y, s);
      });
      ctx.restore();

      // pièces qui explosent
      FX.dying.forEach(d => {
        const k = 1 - d.life;
        this.drawPieceAt(ctx, game, d.piece, d.x, d.y, 1 + k * 0.5, d.life);
      });
      this.drawFX(ctx);
      ctx.restore();

      if (FX.flash > 0.01) {
        ctx.fillStyle = `rgba(255,255,255,${FX.flash})`;
        ctx.fillRect(0, 0, this.W, this.H);
      }
      if (game.tutorial) this.drawTutorial(ctx, game);
    },

    drawFX(ctx) {
      const FX = NFL.FX;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      FX.beams.forEach(b => {
        ctx.strokeStyle = b.color; ctx.globalAlpha = b.life;
        ctx.lineWidth = b.width * b.life; ctx.lineCap = 'round';
        ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 25;
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = b.width * 0.3 * b.life;
        ctx.beginPath(); ctx.moveTo(b.x1, b.y1); ctx.lineTo(b.x2, b.y2); ctx.stroke();
      });
      ctx.shadowBlur = 0;
      FX.bolts.forEach(b => {
        ctx.globalAlpha = b.life;
        ctx.strokeStyle = '#fff59d'; ctx.lineWidth = 3;
        ctx.shadowColor = '#ffeb3b'; ctx.shadowBlur = 14;
        ctx.beginPath(); b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      });
      ctx.shadowBlur = 0;
      FX.rings.forEach(r => {
        ctx.globalAlpha = r.life; ctx.strokeStyle = r.color; ctx.lineWidth = 6 * r.life + 1;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.stroke();
      });
      ctx.restore();
      FX.particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.shape === 'rect') ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, TAU); ctx.fill(); }
        ctx.restore();
      });
      FX.texts.forEach(tx => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, tx.life * 1.5);
        ctx.font = `900 ${tx.size}px "Arial Black", Impact, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.7)';
        ctx.strokeText(tx.str, tx.x, tx.y);
        ctx.fillStyle = tx.color; ctx.fillText(tx.str, tx.x, tx.y);
        ctx.restore();
      });
    },

    drawTutorial(ctx, game) {
      const [a, b] = game.tutorial.move, cs = this.cs;
      const x1 = this.bx + Math.min(a[1], b[1]) * cs, y1 = this.by + Math.min(a[0], b[0]) * cs;
      const x2 = this.bx + (Math.max(a[1], b[1]) + 1) * cs, y2 = this.by + (Math.max(a[0], b[0]) + 1) * cs;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.62)';
      ctx.beginPath();
      ctx.rect(0, 0, this.W, this.H);
      roundRect(ctx, x1 - 3, y1 - 3, x2 - x1 + 6, y2 - y1 + 6, 10, false);
      ctx.fill('evenodd');
      ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth = 3; ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -this.time * 0.03;
      roundRect(ctx, x1 - 3, y1 - 3, x2 - x1 + 6, y2 - y1 + 6, 10); ctx.stroke();
      ctx.setLineDash([]);
      const pa = this.cellCenter(a[0], a[1]), pb = this.cellCenter(b[0], b[1]);
      const k = (this.time % 1400) / 1400;
      const m = k < 0.2 ? 0 : k > 0.75 ? 1 : NFL.Ease.outQuad((k - 0.2) / 0.55);
      const hx = pa.x + (pb.x - pa.x) * m, hy = pa.y + (pb.y - pa.y) * m;
      ctx.font = `${cs * 0.9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.globalAlpha = k > 0.9 ? (1 - k) * 10 : 1;
      ctx.fillText('👆', hx + cs * 0.1, hy - cs * 0.05);
      ctx.restore();
    },
  };

  NFL.Renderer = R;
  NFL.drawFootball = drawFootball;
})();

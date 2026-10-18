// Contrôleur de niveau : entrées, permutations, destructions, cascades, spéciaux, bonus de fin.
window.NFL = window.NFL || {};

(function () {
  const ABORT = { abort: true };
  const T = () => NFL.Tweens;
  const FX = () => NFL.FX;
  const A = () => NFL.Audio;
  const P = () => NFL.POINTS;
  const COMBO_WORDS = ['', '', 'NICE !', 'FIRST DOWN !', 'BLITZ !', 'UNSTOPPABLE !', 'MVP !'];
  const SPECIAL_WORDS = { h: 'LONG PASS !', v: 'LONG PASS !', bomb: 'BLITZ !', rainbow: 'HAIL MARY !' };

  const G = {
    gen: 0, level: null, grid: null, teams: [], goals: [],
    moves: 0, score: 0, combo: 0, state: 'idle', busy: false, paused: false,
    selected: null, hintCells: null, idle: 0, tutorial: null, flagMode: false, skip: false,
    drag: null,

    // --- utilitaires async annulables (changement de niveau pendant une animation) ---
    async step(promise) {
      const g = this.gen;
      await promise;
      if (g !== this.gen) throw ABORT;
    },
    wait(ms) { return this.step(T().wait(ms)); },
    run(fn) {
      return fn().catch(e => { if (e !== ABORT) console.error(e); });
    },

    start(levelDef) {
      this.gen++;
      T().clear(); T().speed = 1;
      FX().reset();
      this.level = levelDef;
      const prefs = NFL.Save.data.prefs.teams;
      this.teams = prefs.slice(0, levelDef.colors).map(id => NFL.TEAM_BY_ID[id]);
      this.grid = new NFL.Grid(levelDef);
      this.grid.fill(levelDef.preset || []);
      this.goals = levelDef.goals.map(g => {
        let target = g.count;
        if (g.type === 'tile') target = this.grid.count(k => k.tile > 0);
        if (g.type === 'dummy') target = this.grid.count(k => k.piece && k.piece.kind === 'dummy');
        return { type: g.type, slot: g.slot, target, left: target };
      });
      this.moves = levelDef.moves;
      this.score = 0; this.combo = 0;
      this.state = 'intro'; this.busy = false; this.paused = false;
      this.selected = null; this.hintCells = null; this.idle = 0;
      this.flagMode = false; this.skip = false;
      this.tutorial = null;
      this.relayout();
    },

    relayout() {
      if (!this.grid) return;
      const top = document.getElementById('hud-top').offsetHeight || 110;
      const bot = document.getElementById('hud-bottom').offsetHeight || 84;
      NFL.Renderer.layout(this.grid, top, bot);
    },

    begin() {
      this.state = 'play';
      if (this.level.tutorial && !NFL.Save.data['tuto' + this.level.id]) {
        this.tutorial = this.level.tutorial;
        NFL.UI.showTutorial(this.tutorial.text);
      }
    },

    endTutorial() {
      if (this.tutorial) NFL.Save.data['tuto' + this.level.id] = true;
      NFL.Save.save();
      this.tutorial = null;
      NFL.UI.hideTutorial();
    },

    goalsDone() { return this.goals.every(g => g.left <= 0); },

    starsFor(score) { return this.level.stars.filter(s => score >= s).length; },

    addScore(n, x, y) {
      const mult = 1 + Math.max(0, this.combo - 1) * 0.5;
      const v = Math.round(n * mult);
      this.score += v;
      if (x != null) FX().text(x, y, '+' + v, '#fff59d', 20);
      NFL.UI.updateHUD();
    },

    // ------------------ ENTRÉES ------------------
    pointerDown(px, py) {
      if (this.state !== 'play' || this.paused) return;
      this.idle = 0; this.hintCells = null;
      A().unlock();
      const cell = NFL.Renderer.cellAt(px, py, this.grid);
      if (!cell) { this.selected = null; return; }
      if (this.flagMode) { this.run(() => this.useFlag(cell)); return; }
      if (this.busy) return;
      this.drag = { cell, x: px, y: py, moved: false };
    },

    pointerMove(px, py) {
      const d = this.drag;
      if (!d || d.moved || this.busy) return;
      const dx = px - d.x, dy = py - d.y;
      const th = NFL.Renderer.cs * 0.35;
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      d.moved = true;
      const b = Math.abs(dx) > Math.abs(dy)
        ? { r: d.cell.r, c: d.cell.c + Math.sign(dx) }
        : { r: d.cell.r + Math.sign(dy), c: d.cell.c };
      this.selected = null;
      if (this.grid.active(b.r, b.c)) this.run(() => this.trySwap(d.cell, b));
    },

    pointerUp() {
      const d = this.drag;
      this.drag = null;
      if (!d || d.moved || this.busy) return;
      const s = this.selected;
      if (s && Math.abs(s.r - d.cell.r) + Math.abs(s.c - d.cell.c) === 1) {
        this.selected = null;
        this.run(() => this.trySwap(s, d.cell));
      } else if (s && s.r === d.cell.r && s.c === d.cell.c) {
        this.selected = null;
      } else if (NFL.Grid.swappable(this.grid.piece(d.cell.r, d.cell.c))) {
        this.selected = d.cell;
        A().play('tick');
      }
    },

    // ------------------ PERMUTATION ------------------
    async animateSwap(a, b, dur = 150) {
      const g = this.grid;
      g.swapPieces(a, b);
      const pa = g.piece(a.r, a.c), pb = g.piece(b.r, b.c);
      await this.step(Promise.all([
        T().add(pa, { x: a.c, y: a.r }, dur),
        T().add(pb, { x: b.c, y: b.r }, dur),
      ]));
    },

    async trySwap(a, b) {
      if (this.busy || this.state !== 'play' || this.paused) return;
      const g = this.grid;
      const pa = g.piece(a.r, a.c), pb = g.piece(b.r, b.c);
      if (!NFL.Grid.swappable(pa) || !NFL.Grid.swappable(pb)) return;
      if (this.tutorial) {
        const [m1, m2] = this.tutorial.move;
        const same = (p, q) => p.r === q[0] && p.c === q[1];
        if (!((same(a, m1) && same(b, m2)) || (same(a, m2) && same(b, m1)))) return;
      }
      this.busy = true;
      this.hintCells = null;
      const valid = g.isValidSwap(a, b);
      A().play('swap');
      await this.animateSwap(a, b);
      if (!valid) {
        A().play('invalid');
        A().play('flag');
        NFL.UI.flag();
        FX().addShake(6);
        await this.animateSwap(a, b);
        this.busy = false;
        return;
      }
      if (this.tutorial) this.endTutorial();
      this.moves--;
      NFL.UI.updateHUD();
      const p1 = g.piece(b.r, b.c), p2 = g.piece(a.r, a.c);
      if (p1.special === 'rainbow' || p2.special === 'rainbow' || (p1.special && p2.special)) {
        await this.comboSwap(b, a);
      } else {
        await this.resolve([a, b]);
      }
      await this.afterTurn();
      this.busy = false;
    },

    // Combinaisons de deux spéciaux / ballon Hail Mary
    async comboSwap(at, other) {
      const g = this.grid, R = NFL.Renderer;
      const p1 = g.piece(at.r, at.c), p2 = g.piece(other.r, other.c);
      const c0 = R.cellCenter(at.r, at.c);
      this.combo = 1;
      let cells = [];
      const all = [];
      g.forEach(k => { if (k.active) all.push({ r: k.r, c: k.c }); });

      if (p1.special === 'rainbow' && p2.special === 'rainbow') {
        A().play('rainbow'); A().play('roar');
        FX().flash = 0.8; FX().addShake(14);
        all.forEach(k => { if (Math.random() < 0.35) { const q = R.cellCenter(k.r, k.c); FX().bolt(c0.x, c0.y, q.x, q.y); } });
        p1.triggered = p2.triggered = true;
        FX().text(c0.x, c0.y - 30, 'HAIL MARY x2 !', '#ffeb3b', 30);
        await this.wait(350);
        cells = all;
      } else if (p1.special === 'rainbow' || p2.special === 'rainbow') {
        const rb = p1.special === 'rainbow' ? p1 : p2;
        const other2 = rb === p1 ? p2 : p1;
        const rbCell = rb === p1 ? at : other;
        const rc = R.cellCenter(rbCell.r, rbCell.c);
        rb.triggered = true;
        const color = other2.color;
        const targets = [];
        g.forEach(k => { if (NFL.Grid.matchable(k.piece) && k.piece.color === color) targets.push(k); });
        A().play('rainbow');
        FX().text(rc.x, rc.y - 30, 'HAIL MARY !', '#ffeb3b', 30);
        if (other2.special) {
          // transforme toute l'équipe en spéciaux du même type puis les déclenche
          targets.forEach(k => {
            if (!k.piece.special) k.piece.special = other2.special === 'bomb' ? 'bomb' : (Math.random() < 0.5 ? 'h' : 'v');
            const q = R.cellCenter(k.r, k.c); FX().bolt(rc.x, rc.y, q.x, q.y);
            k.piece.flash = 1; T().add(k.piece, { flash: 0 }, 400);
          });
          await this.wait(500);
        } else {
          targets.forEach(k => { const q = R.cellCenter(k.r, k.c); FX().bolt(rc.x, rc.y, q.x, q.y); k.piece.flash = 1; });
          FX().addShake(6);
          await this.wait(380);
        }
        cells = targets.map(k => ({ r: k.r, c: k.c }));
        cells.push(rbCell);
        A().play('roar');
      } else {
        // deux spéciaux classiques
        p1.triggered = p2.triggered = true;
        const bombs = (p1.special === 'bomb') + (p2.special === 'bomb');
        const add = (r, c) => { if (g.active(r, c)) cells.push({ r, c }); };
        if (bombs === 2) {
          for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) add(at.r + dr, at.c + dc);
          FX().ring(c0.x, c0.y, R.cs * 3.5, '#ff6d00'); A().play('boom'); FX().addShake(14);
          FX().text(c0.x, c0.y - 30, 'DOUBLE BLITZ !', '#ffab40', 28);
        } else {
          const span = bombs === 1 ? 1 : 0;
          for (let d = -span; d <= span; d++) {
            for (let c = 0; c < g.cols; c++) add(at.r + d, c);
            for (let r = 0; r < g.rows; r++) add(r, at.c + d);
            const rowY = R.cellCenter(at.r + d, 0).y, colX = R.cellCenter(0, at.c + d).x;
            FX().beam(R.bx, rowY, R.bx + R.cs * g.cols, rowY);
            FX().beam(colX, R.by, colX, R.by + R.cs * g.rows);
          }
          A().play('laser'); FX().addShake(10);
          FX().text(c0.x, c0.y - 30, bombs ? 'BLITZ PASS !' : 'CROSSFIELD !', '#fff59d', 28);
        }
        cells.push(at, other);
      }
      await this.clearCells(cells.map(k => ({ r: k.r, c: k.c, cause: 'blast' })));
      await this.dropPieces();
      await this.resolve([]);
    },

    // ------------------ DESTRUCTION ------------------
    // entries : [{r,c,cause:'match'|'blast'}]
    async clearCells(entries) {
      const g = this.grid, R = NFL.Renderer;
      const queue = entries.slice();
      const cleared = new Set(), hitDummies = new Set();
      const removed = [];
      let sx = 0, sy = 0, pts = 0;

      const damageDummy = k => {
        const key = k.r * 100 + k.c;
        if (hitDummies.has(key) || !k.piece || k.piece.kind !== 'dummy') return;
        hitDummies.add(key);
        const p = k.piece;
        p.hp--;
        p.wobble = 0.5; T().add(p, { wobble: 0 }, 400);
        const q = R.cellCenter(k.r, k.c);
        FX().burst(q.x, q.y, ['#ffffff', '#e53935', '#bdbdbd'], 10, 0.8);
        A().play('hit');
        if (p.hp <= 0) {
          k.piece = null;
          removed.push({ p, r: k.r, c: k.c });
          pts += P().dummy;
          this.progressGoal('dummy');
        }
      };

      while (queue.length) {
        const { r, c, cause } = queue.shift();
        const k = g.cell(r, c);
        if (!k || !k.active) continue;
        const key = r * 100 + c;
        const p = k.piece;
        if (p && p.kind === 'dummy') { if (cause === 'blast') damageDummy(k); continue; }
        if (cleared.has(key)) continue;
        cleared.add(key);
        if (p) {
          k.piece = null;
          removed.push({ p, r, c });
          pts += P().piece;
          if (p.color >= 0) this.progressGoal('team', p.color);
          if (p.special && !p.triggered) { p.triggered = true; this.trigger(p, r, c, queue); }
        }
        if (k.tile > 0) {
          k.tile--;
          pts += P().tile;
          this.progressGoal('tile');
          const q = R.cellCenter(r, c);
          FX().burst(q.x, q.y, ['#ffd54f', '#fff8e1', '#ffb300'], 8, 0.7);
        }
        if (cause === 'match') {
          [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
            const n = g.cell(r + dr, c + dc);
            if (n && n.piece && n.piece.kind === 'dummy') damageDummy(n);
          });
        }
      }

      removed.forEach(({ p, r, c }) => {
        const q = R.cellCenter(r, c);
        sx += q.x; sy += q.y;
        FX().dying.push({ piece: p, x: q.x, y: q.y, life: 1 });
        const team = p.color >= 0 ? this.teams[p.color] : null;
        const cols = team ? [team.c1, team.c2, '#ffffff'] : ['#ffffff', '#e53935'];
        FX().burst(q.x, q.y, cols, 9);
      });
      if (removed.length) {
        A().play('pop', this.combo);
        this.addScore(pts, sx / removed.length, sy / removed.length);
      }
      NFL.UI.updateHUD();
      return removed.length;
    },

    trigger(p, r, c, queue) {
      const g = this.grid, R = NFL.Renderer;
      const q = R.cellCenter(r, c);
      const push = (rr, cc) => queue.push({ r: rr, c: cc, cause: 'blast' });
      if (p.special === 'h') {
        for (let i = 0; i < g.cols; i++) push(r, i);
        FX().beam(R.bx, q.y, R.bx + R.cs * g.cols, q.y);
        A().play('laser'); FX().addShake(4);
      } else if (p.special === 'v') {
        for (let i = 0; i < g.rows; i++) push(i, c);
        FX().beam(q.x, R.by, q.x, R.by + R.cs * g.rows);
        A().play('laser'); FX().addShake(4);
      } else if (p.special === 'bomb') {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) push(r + dr, c + dc);
        FX().ring(q.x, q.y, R.cs * 2, '#ff6d00');
        FX().burst(q.x, q.y, ['#ff6d00', '#ffeb3b', '#ffffff'], 24, 1.4);
        A().play('boom'); FX().addShake(9);
      } else if (p.special === 'rainbow') {
        const counts = {};
        g.forEach(k => { if (NFL.Grid.matchable(k.piece)) counts[k.piece.color] = (counts[k.piece.color] || 0) + 1; });
        const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        if (best != null) {
          g.forEach(k => {
            if (NFL.Grid.matchable(k.piece) && k.piece.color === +best) {
              push(k.r, k.c);
              const t = R.cellCenter(k.r, k.c); FX().bolt(q.x, q.y, t.x, t.y);
            }
          });
        }
        A().play('rainbow');
      }
      if (p.special) this.addScore(P().special[p.special] || 0);
    },

    progressGoal(type, color) {
      this.goals.forEach(goal => {
        if (goal.type !== type || goal.left <= 0) return;
        if (type === 'team' && goal.slot !== color) return;
        goal.left--;
        if (goal.left === 0) A().play('goal');
      });
    },

    // ------------------ GRAVITÉ ------------------
    async dropPieces() {
      const g = this.grid;
      g.applyGravity();
      const tw = [];
      let maxDist = 0;
      g.forEach(k => {
        const p = k.piece;
        if (!p) return;
        p.x = k.c;
        const dist = k.r - p.y;
        if (dist > 0.01) {
          maxDist = Math.max(maxDist, dist);
          tw.push(T().add(p, { y: k.r }, 120 + dist * 60, NFL.Ease.outBounce));
        }
      });
      if (tw.length) {
        await this.step(Promise.all(tw));
        A().play('land');
      }
    },

    // Cascade complète : matchs -> destruction -> spéciaux -> gravité, tant qu'il y a des alignements
    async resolve(swapCells) {
      const g = this.grid, R = NFL.Renderer;
      let first = true;
      if (!swapCells.length && this.combo < 1) this.combo = 1;
      else if (swapCells.length) this.combo = 0;
      for (let guard = 0; guard < 50; guard++) {
        const groups = NFL.Matcher.findGroups(g, first ? swapCells : []);
        first = false;
        if (!groups.length) break;
        this.combo++;
        const entries = [];
        groups.forEach(gr => gr.cells.forEach(k => entries.push({ r: k.r, c: k.c, cause: 'match' })));
        await this.clearCells(entries);
        groups.forEach(gr => {
          if (!gr.special) return;
          const k = g.cell(gr.at.r, gr.at.c);
          if (!k || k.piece) return;
          const p = g.newGem(gr.at.r, gr.at.c, gr.color, gr.special);
          p.scale = 0.2;
          k.piece = p;
          T().add(p, { scale: 1 }, 350, NFL.Ease.outBack);
          const q = R.cellCenter(gr.at.r, gr.at.c);
          FX().text(q.x, q.y - R.cs * 0.6, SPECIAL_WORDS[gr.special], '#ffeb3b', 24);
          FX().ring(q.x, q.y, R.cs, '#fff59d');
          A().play('special');
        });
        if (this.combo >= 2) {
          const word = COMBO_WORDS[Math.min(this.combo, COMBO_WORDS.length - 1)];
          NFL.UI.announce(word);
          if (this.combo >= 3) A().play('cheer');
        }
        await this.wait(140);
        await this.dropPieces();
      }
    },

    async afterTurn() {
      this.selected = null;
      if (this.goalsDone()) { await this.bonusTime(); this.win(); return; }
      if (this.moves <= 0) { this.fail(); return; }
      if (!this.grid.findMove()) {
        NFL.UI.announce('MÉLANGE !');
        await this.wait(500);
        this.grid.shuffle();
        const tw = [];
        this.grid.forEach(k => { if (k.piece && k.piece.kind === 'gem') { k.piece.scale = 0.3; tw.push(T().add(k.piece, { scale: 1 }, 300, NFL.Ease.outBack)); } });
        await this.step(Promise.all(tw));
      }
    },

    // ------------------ BOOSTER DRAPEAU ROUGE ------------------
    toggleFlag() {
      if (this.state !== 'play' || this.busy) return;
      const save = NFL.Save.data;
      if (!this.flagMode && save.flags <= 0) {
        if (save.coins >= 60) { save.coins -= 60; save.flags += 1; NFL.Save.save(); A().play('coin'); }
        else { NFL.UI.toast('Pas assez de pièces (60 🪙)'); return; }
      }
      this.flagMode = !this.flagMode;
      NFL.UI.updateHUD();
    },

    async useFlag(cell) {
      if (this.busy) return;
      const p = this.grid.piece(cell.r, cell.c);
      if (!p) return;
      this.busy = true;
      this.flagMode = false;
      NFL.Save.data.flags--;
      NFL.Save.save();
      A().play('whistle');
      const q = NFL.Renderer.cellCenter(cell.r, cell.c);
      FX().text(q.x, q.y - 30, 'FLAG !', '#ffeb3b', 26);
      FX().addShake(5);
      this.combo = 1;
      await this.clearCells([{ r: cell.r, c: cell.c, cause: 'blast' }]);
      await this.dropPieces();
      await this.resolve([]);
      await this.afterTurn();
      this.busy = false;
      NFL.UI.updateHUD();
    },

    // ------------------ FIN DE NIVEAU ------------------
    async bonusTime() {
      const g = this.grid;
      this.state = 'bonus';
      this.skip = false;
      A().play('whistle');
      NFL.UI.showBonus(true);
      await this.wait(900);
      T().speed = 1.8; // phase bonus accélérée
      // 1) déclenche les spéciaux restants
      for (let i = 0; i < 40 && !this.skip; i++) {
        let found = null;
        g.forEach(k => { if (!found && k.piece && k.piece.kind === 'gem' && k.piece.special) found = k; });
        if (!found) break;
        this.combo = 1;
        await this.clearCells([{ r: found.r, c: found.c, cause: 'blast' }]);
        await this.dropPieces();
        await this.resolve([]);
      }
      // 2) chaque coup restant devient un spécial qui explose
      while (this.moves > 0 && !this.skip) {
        this.moves--;
        NFL.UI.updateHUD();
        const cands = [];
        g.forEach(k => { if (k.piece && k.piece.kind === 'gem' && !k.piece.special) cands.push(k); });
        if (!cands.length) break;
        const k = cands[Math.floor(Math.random() * cands.length)];
        k.piece.special = ['h', 'v', 'bomb'][Math.floor(Math.random() * 3)];
        k.piece.flash = 1; T().add(k.piece, { flash: 0 }, 250);
        const q = NFL.Renderer.cellCenter(k.r, k.c);
        FX().ring(q.x, q.y, NFL.Renderer.cs, '#fff59d');
        A().play('special');
        this.addScore(P().bonusMove, q.x, q.y);
        await this.wait(150);
        this.combo = 1;
        await this.clearCells([{ r: k.r, c: k.c, cause: 'blast' }]);
        await this.dropPieces();
        await this.resolve([]);
      }
      if (this.skip && this.moves > 0) {
        this.score += this.moves * P().bonusMove * 2;
        this.moves = 0;
      }
      T().speed = 1;
      NFL.UI.updateHUD();
      NFL.UI.showBonus(false);
    },

    skipBonus() {
      if (this.state !== 'bonus') return;
      this.skip = true;
      T().speed = 5;
    },

    win() {
      this.state = 'over';
      const stars = this.starsFor(this.score);
      const coins = 20 + stars * 5;
      NFL.Save.data.coins += coins;
      NFL.Save.data.gift = Math.min(3, NFL.Save.data.gift + 1);
      const newBest = NFL.Save.setResult(this.level.id, this.score, Math.max(1, stars));
      NFL.UI.showWin({ score: this.score, stars: Math.max(1, stars), coins, newBest });
    },

    fail() {
      this.state = 'over';
      NFL.UI.showFail();
    },

    buyMoves() {
      const s = NFL.Save.data;
      if (s.coins < 80) return false;
      s.coins -= 80; NFL.Save.save();
      this.moves += 5;
      this.state = 'play';
      NFL.UI.updateHUD();
      return true;
    },

    update(dt) {
      if (this.state === 'play' && !this.busy && !this.paused && !this.tutorial) {
        this.idle += dt;
        if (this.idle > 5000 && !this.hintCells) this.hintCells = this.grid.findMove();
      }
    },
  };

  NFL.Game = G;
})();

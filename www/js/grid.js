// Gestionnaire de grille : cellules, pièces, gravité, remplissage, mélange, recherche de coups.
window.NFL = window.NFL || {};

(function () {
  let nextId = 1;

  function makePiece(kind, color, r, c, special = null) {
    return {
      id: nextId++, kind, color, special, hp: 1,
      x: c, y: r, scale: 1, alpha: 1, rot: 0, flash: 0, wobble: 0,
    };
  }

  class Grid {
    constructor(level) {
      this.level = level;
      this.rows = level.shape.length;
      this.cols = level.shape[0].length;
      this.ncolors = level.colors;
      this.cells = [];
      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          const ch = level.shape[r][c];
          const cell = { r, c, active: ch !== 'x', tile: ch === 't' ? 1 : 0, piece: null };
          if (ch === 'd' || ch === 'D') {
            cell.piece = makePiece('dummy', -1, r, c);
            cell.piece.hp = ch === 'D' ? 2 : 1;
          }
          row.push(cell);
        }
        this.cells.push(row);
      }
    }

    inBounds(r, c) { return r >= 0 && c >= 0 && r < this.rows && c < this.cols; }
    cell(r, c) { return this.inBounds(r, c) ? this.cells[r][c] : null; }
    active(r, c) { const k = this.cell(r, c); return !!(k && k.active); }
    piece(r, c) { const k = this.cell(r, c); return k ? k.piece : null; }

    forEach(fn) {
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) fn(this.cells[r][c], r, c);
    }

    count(pred) { let n = 0; this.forEach(k => { if (pred(k)) n++; }); return n; }

    randomColor() { return Math.floor(Math.random() * this.ncolors); }

    newGem(r, c, color = this.randomColor(), special = null) {
      const p = makePiece('gem', special === 'rainbow' ? -1 : color, r, c, special);
      return p;
    }

    static matchable(p) { return !!(p && p.kind === 'gem' && p.special !== 'rainbow'); }
    static swappable(p) { return !!(p && p.kind === 'gem'); }

    sameColor(r, c, color) {
      const p = this.piece(r, c);
      return Grid.matchable(p) && p.color === color;
    }

    // Longueur max d'alignement passant par (r,c)
    runAt(r, c) {
      const p = this.piece(r, c);
      if (!Grid.matchable(p)) return 0;
      const col = p.color;
      let h = 1, v = 1;
      for (let i = c - 1; this.sameColor(r, i, col); i--) h++;
      for (let i = c + 1; this.sameColor(r, i, col); i++) h++;
      for (let i = r - 1; this.sameColor(i, c, col); i--) v++;
      for (let i = r + 1; this.sameColor(i, c, col); i++) v++;
      return Math.max(h, v);
    }

    hasAnyMatch() {
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          if (this.runAt(r, c) >= 3) return true;
      return false;
    }

    // Remplit la grille sans alignement initial et avec au moins un coup possible.
    fill(preset = []) {
      const locked = new Set();
      for (let attempt = 0; attempt < 200; attempt++) {
        locked.clear();
        this.forEach(k => {
          if (k.active && (!k.piece || k.piece.kind === 'gem')) k.piece = this.newGem(k.r, k.c);
        });
        preset.forEach(([r, c, slot]) => {
          if (this.active(r, c)) { this.cells[r][c].piece = this.newGem(r, c, slot % this.ncolors); locked.add(r * 100 + c); }
        });
        // corrige les alignements en re-tirant les cases non verrouillées
        for (let pass = 0; pass < 60 && this.hasAnyMatch(); pass++) {
          this.forEach(k => {
            if (!locked.has(k.r * 100 + k.c) && this.runAt(k.r, k.c) >= 3) {
              k.piece = this.newGem(k.r, k.c);
            }
          });
        }
        if (!this.hasAnyMatch() && this.findMove()) return;
      }
    }

    // Échange virtuel pour tester un coup
    swapPieces(a, b) {
      const ka = this.cells[a.r][a.c], kb = this.cells[b.r][b.c];
      const t = ka.piece; ka.piece = kb.piece; kb.piece = t;
    }

    isValidSwap(a, b) {
      const pa = this.piece(a.r, a.c), pb = this.piece(b.r, b.c);
      if (!Grid.swappable(pa) || !Grid.swappable(pb)) return false;
      if (pa.special === 'rainbow' || pb.special === 'rainbow') return true;
      if (pa.special && pb.special) return true;
      this.swapPieces(a, b);
      const ok = this.runAt(a.r, a.c) >= 3 || this.runAt(b.r, b.c) >= 3;
      this.swapPieces(a, b);
      return ok;
    }

    findMove() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          for (const [dr, dc] of [[0, 1], [1, 0]]) {
            const a = { r, c }, b = { r: r + dr, c: c + dc };
            if (!this.active(b.r, b.c)) continue;
            if (this.isValidSwap(a, b)) return [a, b];
          }
        }
      }
      return null;
    }

    // Mélange les couleurs des gemmes normales (spéciaux conservés) jusqu'à obtenir un plateau jouable.
    shuffle() {
      const gems = [];
      this.forEach(k => { if (k.piece && k.piece.kind === 'gem' && !k.piece.special) gems.push(k.piece); });
      for (let attempt = 0; attempt < 100; attempt++) {
        gems.forEach(p => { p.color = this.randomColor(); });
        for (let pass = 0; pass < 30 && this.hasAnyMatch(); pass++) {
          this.forEach(k => { if (k.piece && !k.piece.special && this.runAt(k.r, k.c) >= 3) k.piece.color = this.randomColor(); });
        }
        if (!this.hasAnyMatch() && this.findMove()) return true;
      }
      return false;
    }

    // Gravité colonne par colonne (les pièces traversent les trous). Retourne les pièces déplacées et créées.
    applyGravity() {
      const moved = [], spawned = [];
      for (let c = 0; c < this.cols; c++) {
        const list = [];
        for (let r = 0; r < this.rows; r++) if (this.cells[r][c].active) list.push(r);
        if (!list.length) continue;
        let w = list.length - 1;
        for (let i = list.length - 1; i >= 0; i--) {
          const r = list[i];
          const p = this.cells[r][c].piece;
          if (!p) continue;
          const tr = list[w];
          if (tr !== r) {
            this.cells[tr][c].piece = p;
            this.cells[r][c].piece = null;
            moved.push(p);
          }
          w--;
        }
        const top = list[0];
        let k = 1;
        for (let i = w; i >= 0; i--) {
          const r = list[i];
          const p = this.newGem(r, c);
          p.y = top - k; k++;
          this.cells[r][c].piece = p;
          spawned.push(p);
        }
      }
      return { moved, spawned };
    }

    // Position logique (ligne) d'une pièce donnée
    locate(p) {
      for (let r = 0; r < this.rows; r++)
        for (let c = 0; c < this.cols; c++)
          if (this.cells[r][c].piece === p) return { r, c };
      return null;
    }
  }

  NFL.Grid = Grid;
  NFL.makePiece = makePiece;
})();

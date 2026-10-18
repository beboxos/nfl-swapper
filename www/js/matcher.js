// Détecteur de matchs : alignements, regroupement (T/L), choix du joyau spécial à créer.
window.NFL = window.NFL || {};

NFL.Matcher = {
  // swapCells : cases déplacées par le joueur (pour placer le spécial au bon endroit)
  findGroups(grid, swapCells = []) {
    const runs = [];
    const same = (r, c, col) => grid.sameColor(r, c, col);
    for (let r = 0; r < grid.rows; r++) {
      let c = 0;
      while (c < grid.cols) {
        const p = grid.piece(r, c);
        if (!NFL.Grid.matchable(p)) { c++; continue; }
        let e = c + 1;
        while (same(r, e, p.color)) e++;
        if (e - c >= 3) {
          const cells = [];
          for (let i = c; i < e; i++) cells.push({ r, c: i });
          runs.push({ dir: 'h', color: p.color, cells });
        }
        c = e;
      }
    }
    for (let c = 0; c < grid.cols; c++) {
      let r = 0;
      while (r < grid.rows) {
        const p = grid.piece(r, c);
        if (!NFL.Grid.matchable(p)) { r++; continue; }
        let e = r + 1;
        while (same(e, c, p.color)) e++;
        if (e - r >= 3) {
          const cells = [];
          for (let i = r; i < e; i++) cells.push({ r: i, c });
          runs.push({ dir: 'v', color: p.color, cells });
        }
        r = e;
      }
    }
    if (!runs.length) return [];

    // union-find des runs qui partagent une case
    const parent = runs.map((_, i) => i);
    const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const owner = new Map();
    runs.forEach((run, i) => {
      run.cells.forEach(k => {
        const key = k.r * 100 + k.c;
        if (owner.has(key)) parent[find(i)] = find(owner.get(key));
        else owner.set(key, i);
      });
    });
    const byRoot = new Map();
    runs.forEach((run, i) => {
      const root = find(i);
      if (!byRoot.has(root)) byRoot.set(root, []);
      byRoot.get(root).push(run);
    });

    const swapKeys = new Set(swapCells.map(k => k.r * 100 + k.c));
    const groups = [];
    byRoot.forEach(groupRuns => {
      const map = new Map();
      groupRuns.forEach(run => run.cells.forEach(k => map.set(k.r * 100 + k.c, k)));
      const cells = [...map.values()];
      const maxLen = Math.max(...groupRuns.map(r => r.cells.length));
      const hasH = groupRuns.some(r => r.dir === 'h');
      const hasV = groupRuns.some(r => r.dir === 'v');
      const longest = groupRuns.reduce((a, b) => (b.cells.length > a.cells.length ? b : a));

      let special = null;
      if (maxLen >= 5) special = 'rainbow';
      else if (hasH && hasV) special = 'bomb';
      else if (maxLen === 4) special = longest.dir; // 'h' efface la ligne, 'v' la colonne

      let at = cells.find(k => swapKeys.has(k.r * 100 + k.c));
      if (!at && special === 'bomb') {
        // intersection des runs
        const counts = new Map();
        groupRuns.forEach(run => run.cells.forEach(k => {
          const key = k.r * 100 + k.c; counts.set(key, (counts.get(key) || 0) + 1);
        }));
        const key = [...counts.entries()].find(([, n]) => n > 1);
        if (key) at = map.get(key[0]);
      }
      if (!at) at = longest.cells[Math.floor(longest.cells.length / 2)];

      groups.push({ cells, color: groupRuns[0].color, special, at });
    });
    return groups;
  },
};

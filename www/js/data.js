// Données statiques : équipes et niveaux.
window.NFL = window.NFL || {};

NFL.TEAMS = [
  { id: 'ari', city: 'Arizona', name: 'Cardinals', abbr: 'ARI', c1: '#97233F', c2: '#FFB612' },
  { id: 'atl', city: 'Atlanta', name: 'Falcons', abbr: 'ATL', c1: '#A71930', c2: '#101820' },
  { id: 'bal', city: 'Baltimore', name: 'Ravens', abbr: 'BAL', c1: '#241773', c2: '#9E7C0C' },
  { id: 'buf', city: 'Buffalo', name: 'Bills', abbr: 'BUF', c1: '#00338D', c2: '#C60C30' },
  { id: 'car', city: 'Carolina', name: 'Panthers', abbr: 'CAR', c1: '#0085CA', c2: '#101820' },
  { id: 'chi', city: 'Chicago', name: 'Bears', abbr: 'CHI', c1: '#0B162A', c2: '#C83803' },
  { id: 'cin', city: 'Cincinnati', name: 'Bengals', abbr: 'CIN', c1: '#FB4F14', c2: '#101820' },
  { id: 'cle', city: 'Cleveland', name: 'Browns', abbr: 'CLE', c1: '#311D00', c2: '#FF3C00' },
  { id: 'dal', city: 'Dallas', name: 'Cowboys', abbr: 'DAL', c1: '#003594', c2: '#869397' },
  { id: 'den', city: 'Denver', name: 'Broncos', abbr: 'DEN', c1: '#FB4F14', c2: '#002244' },
  { id: 'det', city: 'Detroit', name: 'Lions', abbr: 'DET', c1: '#0076B6', c2: '#B0B7BC' },
  { id: 'gb', city: 'Green Bay', name: 'Packers', abbr: 'GB', c1: '#203731', c2: '#FFB612', bg: '#FFB612' },
  { id: 'hou', city: 'Houston', name: 'Texans', abbr: 'HOU', c1: '#03202F', c2: '#A71930' },
  { id: 'ind', city: 'Indianapolis', name: 'Colts', abbr: 'IND', c1: '#002C5F', c2: '#A2AAAD' },
  { id: 'jax', city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', c1: '#006778', c2: '#D7A22A', bg: '#8FD3F0' },
  { id: 'kc', city: 'Kansas City', name: 'Chiefs', abbr: 'KC', c1: '#E31837', c2: '#FFB81C' },
  { id: 'lv', city: 'Las Vegas', name: 'Raiders', abbr: 'LV', c1: '#000000', c2: '#A5ACAF' },
  { id: 'lac', city: 'Los Angeles', name: 'Chargers', abbr: 'LAC', c1: '#0080C6', c2: '#FFC20E' },
  { id: 'lar', city: 'Los Angeles', name: 'Rams', abbr: 'LAR', c1: '#003594', c2: '#FFA300' },
  { id: 'mia', city: 'Miami', name: 'Dolphins', abbr: 'MIA', c1: '#008E97', c2: '#FC4C02' },
  { id: 'min', city: 'Minnesota', name: 'Vikings', abbr: 'MIN', c1: '#4F2683', c2: '#FFC62F' },
  { id: 'ne', city: 'New England', name: 'Patriots', abbr: 'NE', c1: '#002244', c2: '#C60C30' },
  { id: 'no', city: 'New Orleans', name: 'Saints', abbr: 'NO', c1: '#D3BC8D', c2: '#101820' },
  { id: 'nyg', city: 'New York', name: 'Giants', abbr: 'NYG', c1: '#0B2265', c2: '#A71930' },
  { id: 'nyj', city: 'New York', name: 'Jets', abbr: 'NYJ', c1: '#125740', c2: '#FFFFFF' },
  { id: 'phi', city: 'Philadelphia', name: 'Eagles', abbr: 'PHI', c1: '#004C54', c2: '#A5ACAF' },
  { id: 'pit', city: 'Pittsburgh', name: 'Steelers', abbr: 'PIT', c1: '#FFB612', c2: '#101820' },
  { id: 'sf', city: 'San Francisco', name: '49ers', abbr: 'SF', c1: '#AA0000', c2: '#B3995D' },
  { id: 'sea', city: 'Seattle', name: 'Seahawks', abbr: 'SEA', c1: '#002244', c2: '#69BE28', bg: '#69BE28' },
  { id: 'tb', city: 'Tampa Bay', name: 'Buccaneers', abbr: 'TB', c1: '#D50A0A', c2: '#34302B' },
  { id: 'ten', city: 'Tennessee', name: 'Titans', abbr: 'TEN', c1: '#0C2340', c2: '#4B92DB' },
  { id: 'was', city: 'Washington', name: 'Commanders', abbr: 'WAS', c1: '#5A1414', c2: '#FFB612' },
];
// bg (optionnel) : fond du badge à la place du blanc, pour les logos peu lisibles (retour de joueuse).
NFL.TEAM_BY_ID = {};
NFL.TEAMS.forEach(t => { NFL.TEAM_BY_ID[t.id] = t; });

// 6 équipes visuellement très distinctes par défaut.
NFL.DEFAULT_TEAMS = ['kc', 'mia', 'gb', 'pit', 'min', 'dal'];
NFL.TEAM_SLOTS = 6;

// Légende des formes : '.' case jouable, 'x' trou, 't' gazon doré (à nettoyer),
// 'd' sac de plaquage (1 coup), 'D' sac de plaquage renforcé (2 coups).
// goals : { type: 'team', slot, count } | { type: 'tile' } | { type: 'dummy' } (count auto = total du plateau)
// preset : [ligne, colonne, slot] imposés (tutoriels).
NFL.LEVELS = [
  {
    id: 1, moves: 20, colors: 5,
    shape: ['........', '........', '........', '........', '........', '........', '........', '........'],
    goals: [{ type: 'team', slot: 0, count: 15 }],
    preset: [[4, 2, 0], [4, 3, 0], [3, 4, 0], [4, 4, 1]],
    tutorial: { move: [[3, 4], [4, 4]], text: 'Échange deux logos voisins pour aligner 3 logos identiques !' },
  },
  {
    id: 2, moves: 22, colors: 5,
    shape: ['........', '........', '........', '........', '........', '........', '........', '........'],
    goals: [{ type: 'team', slot: 1, count: 14 }, { type: 'team', slot: 2, count: 14 }],
  },
  {
    id: 3, moves: 24, colors: 5,
    shape: ['........', '...tt...', '..tttt..', '.tttttt.', '.tttttt.', '..tttt..', '...tt...', '........'],
    goals: [{ type: 'tile' }],
  },
  {
    id: 4, moves: 25, colors: 5,
    shape: ['........', '........', '........', '........', '........', '........', 'tttttttt', 'tttttttt'],
    goals: [{ type: 'team', slot: 0, count: 20 }, { type: 'tile' }],
    preset: [[3, 1, 0], [3, 2, 0], [3, 3, 1], [3, 4, 0], [3, 5, 0], [2, 3, 0]],
    tutorial: { move: [[2, 3], [3, 3]], text: 'Aligne 5 logos pour créer le ballon HAIL MARY ! Échange-le avec un logo : toutes les pièces de cette équipe sautent.' },
  },
  {
    id: 5, moves: 22, colors: 5,
    shape: ['........', '........', '..d..d..', '...dd...', '...dd...', '..d..d..', '........', '........'],
    goals: [{ type: 'dummy' }],
    preset: [[3, 0, 0], [3, 1, 1], [3, 2, 0], [4, 1, 0]],
    tutorial: { move: [[3, 1], [4, 1]], text: 'Les sacs de plaquage ne bougent pas avec les logos : fais un alignement juste à côté pour les détruire.' },
  },
  {
    id: 6, moves: 24, colors: 5,
    shape: ['xx....xx', 'xx.tt.xx', '..tttt..', '.tttttt.', '.tttttt.', '..tttt..', 'xx.tt.xx', 'xx....xx'],
    goals: [{ type: 'tile' }, { type: 'team', slot: 3, count: 15 }],
  },
  {
    id: 7, moves: 26, colors: 5,
    shape: ['........', '.d....d.', '..tttt..', '.dttttd.', '.dttttd.', '..tttt..', '.d....d.', '........', '........'],
    goals: [{ type: 'dummy' }, { type: 'tile' }],
  },
  {
    id: 8, moves: 28, colors: 6,
    shape: ['........', 'x......x', 'xx....xx', 'xxx..xxx', 'xxx..xxx', 'xx....xx', 'x......x', '........'],
    goals: [{ type: 'team', slot: 2, count: 22 }, { type: 'team', slot: 4, count: 22 }],
  },
  {
    id: 9, moves: 34, colors: 5,
    shape: ['tttttttt', 'tttxxttt', 'ttDttDtt', 'tttttttt', 'tttttttt', 'ttDttDtt', 'tttxxttt', 'tttttttt'],
    goals: [{ type: 'tile' }, { type: 'dummy' }],
  },
  {
    id: 10, moves: 32, colors: 6,
    shape: ['..tttt..', '.tttttt.', 'td....dt', 't..DD..t', 't......t', 't..DD..t', 'td....dt', '.tttttt.', '..tttt..'],
    goals: [{ type: 'team', slot: 0, count: 30 }, { type: 'tile' }, { type: 'dummy' }],
  },
];

// ---------------------------------------------------------------------------
// Niveaux 11 à 100 : générateur déterministe (même graine => même niveau pour tout le monde).
// La difficulté monte avec l'id ; chaque 10e niveau est un « boss » plus chargé.
// ---------------------------------------------------------------------------
NFL.LEVEL_COUNT = 100;

// Calibrage mesuré par un bot glouton (3 parties par niveau, coups illimités) :
// { id: [variante de graine, coups accordés] }. Les niveaux hors de la fourchette visée (trop courts ou
// interminables) ont été re-tirés avec une autre graine ; coups = médiane × marge (1,6 -> 1,15) + 2.
NFL.LEVEL_CAL = {
  11:[0,12], 12:[0,15], 13:[0,12], 14:[0,23], 15:[0,21], 16:[0,27], 17:[3,21], 18:[0,22], 19:[0,13], 20:[1,31],
  21:[0,36], 22:[0,16], 23:[0,27], 24:[0,14], 25:[0,17], 26:[0,16], 27:[0,31], 28:[0,28], 29:[1,22], 30:[0,18],
  31:[0,33], 32:[3,18], 33:[0,27], 34:[4,27], 35:[0,15], 36:[1,30], 37:[2,21], 38:[1,24], 39:[0,41], 40:[0,24],
  41:[0,19], 42:[0,19], 43:[1,38], 44:[0,31], 45:[0,28], 46:[1,19], 47:[1,29], 48:[0,20], 49:[1,44], 50:[4,45],
  51:[2,29], 52:[1,16], 53:[0,19], 54:[0,17], 55:[0,35], 56:[1,43], 57:[0,16], 58:[0,33], 59:[1,33], 60:[1,40],
  61:[1,28], 62:[0,31], 63:[1,18], 64:[0,27], 65:[0,21], 66:[1,23], 67:[1,18], 68:[0,31], 69:[2,27], 70:[0,37],
  71:[2,43], 72:[0,33], 73:[0,26], 74:[0,30], 75:[3,44], 76:[0,29], 77:[0,36], 78:[0,37], 79:[1,26], 80:[3,36],
  81:[0,33], 82:[0,23], 83:[0,22], 84:[3,45], 85:[0,40], 86:[0,25], 87:[0,40], 88:[0,36], 89:[0,42], 90:[1,45],
  91:[1,29], 92:[1,28], 93:[2,39], 94:[0,29], 95:[1,45], 96:[1,37], 97:[0,45], 98:[0,41], 99:[0,40], 100:[1,44],
};

(function () {
  function rng(seed) {
    return () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Motifs de trous (appliqués sur la moitié gauche puis recopiés en miroir)
  const HOLES = [
    () => false,
    (r, c, R) => (r === 0 || r === R - 1) && c === 0,
    (r, c, R) => (r < 2 || r >= R - 2) && c < 2 && !(r === 1 && c === 1) || ((r === 0 || r === R - 1) && c === 1),
    (r, c, R) => (r === Math.floor(R / 2) || r === Math.floor((R - 1) / 2)) && c === 3,
    (r, c, R) => Math.abs(r - (R - 1) / 2) + c < 2,
    (r, c, R) => (r === 0 || r === R - 1) && c < 3,
    (r, c, R) => (r < 2 || r >= R - 2) && c === 3,
    (r, c, R) => c === 0 && r % 3 === 1,
    (r, c, R) => (r + c) % 4 === 0 && c < 2 && r > 0 && r < R - 1,
  ];
  // Zones de gazon doré
  const TILES = [
    (r, c, R) => true,
    (r, c, R) => Math.abs(r - (R - 1) / 2) + Math.abs(c - 3.5) < 4,
    (r, c, R) => r >= R - 3,
    (r, c, R) => r < 3,
    (r, c, R) => c === 0 || c === 7 || r === 0 || r === R - 1,
    (r, c, R) => c >= 2 && c <= 5,
    (r, c, R) => (r + c) % 2 === 0,
    (r, c, R) => Math.abs(r - (R - 1) / 2) <= 1.5,
  ];

  // Retire les cases qui ne peuvent appartenir à aucun alignement de 3
  function prune(g, R, C) {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        if (g[r][c] === 'x') continue;
        const on = (rr, cc) => rr >= 0 && cc >= 0 && rr < R && cc < C && g[rr][cc] !== 'x';
        let ok = false;
        for (let k = -2; k <= 0 && !ok; k++) {
          if (on(r, c + k) && on(r, c + k + 1) && on(r, c + k + 2)) ok = true;
          if (on(r + k, c) && on(r + k + 1, c) && on(r + k + 2, c)) ok = true;
        }
        if (!ok) { g[r][c] = 'x'; changed = true; }
      }
    }
  }

  NFL.genLevel = function (id, salt = 0) {
    const rnd = rng(id * 7919 + 13 + salt * 104729);
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const boss = id % 10 === 0;
    const d = Math.min(1, (id - 10) / 90);           // 0 -> 1 au fil des niveaux
    const R = rnd() < 0.45 ? 9 : 8, C = 8;
    const g = Array.from({ length: R }, () => Array(C).fill('.'));

    const hole = id < 15 ? HOLES[0] : pick(HOLES);
    for (let r = 0; r < R; r++) for (let c = 0; c < 4; c++) {
      if (hole(r, c, R)) { g[r][c] = 'x'; g[r][C - 1 - c] = 'x'; }
    }
    prune(g, R, C);

    const goals = [];
    const colors = (id > 25 && rnd() < 0.25 + d * 0.5) || (boss && id > 40) ? 6 : 5;

    // gazon doré
    if (rnd() < 0.55 || boss) {
      const zone = pick(TILES);
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (g[r][c] === '.' && zone(r, c, R)) g[r][c] = 't';
      goals.push({ type: 'tile' });
    }
    // sacs de plaquage (symétriques, jamais sur les bords pour rester atteignables)
    if (id >= 13 && (rnd() < 0.35 + d * 0.4 || boss)) {
      const n = Math.min(14, 2 + Math.floor(rnd() * 3) + Math.floor(d * 8) + (boss ? 3 : 0));
      const strong = id > 30 ? 0.2 + d * 0.5 : 0;
      let placed = 0;
      for (let tries = 0; tries < 200 && placed < n; tries++) {
        const r = 1 + Math.floor(rnd() * (R - 2)), c = 1 + Math.floor(rnd() * 3);
        if (g[r][c] === 'x' || g[r][c] === 'd' || g[r][c] === 'D') continue;
        const ch = rnd() < strong ? 'D' : 'd';
        g[r][c] = ch; g[r][C - 1 - c] = ch; placed += 2;
      }
      if (placed) goals.push({ type: 'dummy' });
    }
    // objectifs d'équipe
    const teamGoals = goals.length === 0 ? (rnd() < 0.5 ? 2 : 1) : (rnd() < 0.35 + d * 0.3 ? 1 : 0);
    const slots = [0, 1, 2, 3, 4].sort(() => rnd() - 0.5);
    for (let i = 0; i < teamGoals; i++) {
      goals.push({ type: 'team', slot: slots[i], count: Math.round((14 + d * 22 + (boss ? 6 : 0)) / (teamGoals > 1 ? 1.25 : 1)) });
    }

    // estimation des coups nécessaires
    const shape = g.map(row => row.join(''));
    const tiles = shape.join('').split('t').length - 1;
    const dummiesHp = (shape.join('').split('d').length - 1) + 2 * (shape.join('').split('D').length - 1);
    let need = 6;
    goals.forEach(go => {
      if (go.type === 'tile') need += tiles * 0.42;
      if (go.type === 'dummy') need += dummiesHp * 0.9;
      if (go.type === 'team') need += go.count * (colors === 6 ? 0.62 : 0.5);
    });
    const slack = 1.35 - d * 0.25;                    // marge qui se resserre avec la progression
    const moves = Math.max(16, Math.min(45, Math.round(need * slack * NFL.MOVES_TUNING)));
    return { id, moves, colors, shape, goals, generated: true };
  };

  NFL.MOVES_TUNING = 1;
  for (let id = NFL.LEVELS.length + 1; id <= NFL.LEVEL_COUNT; id++) {
    const cal = NFL.LEVEL_CAL[id];
    const lvl = NFL.genLevel(id, cal ? cal[0] : 0);
    if (cal) lvl.moves = cal[1];
    NFL.LEVELS.push(lvl);
  }
})();

// Paliers d'étoiles calculés à partir du nombre de coups (calibrés par un bot glouton ;
// les niveaux à 6 couleurs produisent moins de cascades, d'où un facteur réduit).
NFL.LEVELS.forEach(l => {
  const k = l.colors === 6 ? 0.55 : 1;
  if (!l.stars) l.stars = [300, 650, 1000].map(f => Math.round(l.moves * f * k / 100) * 100);
});

NFL.POINTS = {
  piece: 30, tile: 50, dummy: 100,
  special: { h: 100, v: 100, bomb: 200, rainbow: 400 },
  bonusMove: 450,
};

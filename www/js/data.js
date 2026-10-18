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
  { id: 'gb', city: 'Green Bay', name: 'Packers', abbr: 'GB', c1: '#203731', c2: '#FFB612' },
  { id: 'hou', city: 'Houston', name: 'Texans', abbr: 'HOU', c1: '#03202F', c2: '#A71930' },
  { id: 'ind', city: 'Indianapolis', name: 'Colts', abbr: 'IND', c1: '#002C5F', c2: '#A2AAAD' },
  { id: 'jax', city: 'Jacksonville', name: 'Jaguars', abbr: 'JAX', c1: '#006778', c2: '#D7A22A' },
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
  { id: 'sea', city: 'Seattle', name: 'Seahawks', abbr: 'SEA', c1: '#002244', c2: '#69BE28' },
  { id: 'tb', city: 'Tampa Bay', name: 'Buccaneers', abbr: 'TB', c1: '#D50A0A', c2: '#34302B' },
  { id: 'ten', city: 'Tennessee', name: 'Titans', abbr: 'TEN', c1: '#0C2340', c2: '#4B92DB' },
  { id: 'was', city: 'Washington', name: 'Commanders', abbr: 'WAS', c1: '#5A1414', c2: '#FFB612' },
];
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

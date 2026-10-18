// Sauvegarde locale : progression, meilleurs scores, pièces, préférences.
window.NFL = window.NFL || {};

NFL.Save = {
  key: 'nflswapper.v1',
  data: null,

  defaults() {
    return {
      unlocked: 1,
      levels: {},           // { [id]: { best, stars } }
      coins: 100,
      flags: 3,             // booster « drapeau rouge »
      gift: 0,              // jauge cadeau (0..3)
      lastDaily: '',
      prefs: { teams: NFL.DEFAULT_TEAMS.slice(), sound: true, music: true, skin: 'logo' },
    };
  },

  load() {
    const d = this.defaults();
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) {
        const s = JSON.parse(raw);
        Object.assign(d, s);
        d.prefs = Object.assign(this.defaults().prefs, s.prefs || {});
      }
    } catch (e) { /* stockage indisponible : on joue sans sauvegarde */ }
    const valid = d.prefs.teams.filter(id => NFL.TEAM_BY_ID[id]);
    d.prefs.teams = valid.length === NFL.TEAM_SLOTS ? valid : NFL.DEFAULT_TEAMS.slice();
    this.data = d;
    return d;
  },

  save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  },

  record(id) { return this.data.levels[id] || { best: 0, stars: 0 }; },

  // Enregistre un résultat ; retourne true si nouveau record
  setResult(id, score, stars) {
    const rec = this.record(id);
    const newBest = score > rec.best;
    this.data.levels[id] = { best: Math.max(rec.best, score), stars: Math.max(rec.stars, stars) };
    if (id >= this.data.unlocked && id < NFL.LEVELS.length) this.data.unlocked = id + 1;
    this.save();
    return newBest;
  },

  totalStars() {
    return Object.values(this.data.levels).reduce((s, l) => s + (l.stars || 0), 0);
  },

  today() { return new Date().toISOString().slice(0, 10); },

  reset() {
    const prefs = this.data.prefs;
    this.data = this.defaults();
    this.data.prefs = prefs;
    this.save();
  },
};

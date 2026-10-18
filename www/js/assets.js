// Chargement des logos (avec repli automatique sur le casque dessiné si une image manque).
window.NFL = window.NFL || {};

NFL.Assets = {
  logos: {},
  load() {
    return Promise.all(NFL.TEAMS.map(t => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.logos[t.id] = img; resolve(); };
      img.onerror = () => resolve();
      img.src = `assets/logos/${t.id}.png`;
    })));
  },
  logo(id) { return this.logos[id] || null; },
  logoSrc(id) { return this.logos[id] ? `assets/logos/${id}.png` : null; },
};

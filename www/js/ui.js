// Gestionnaire d'UI et d'écrans : page de garde, saison, préférences, HUD, popups, transitions.
window.NFL = window.NFL || {};

(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const G = () => NFL.Game;
  const S = () => NFL.Save;

  function teamIcon(team, cls = '') {
    const src = S().data.prefs.skin === 'logo' && NFL.Assets.logoSrc(team.id);
    return src
      ? `<img class="${cls}" src="${src}" alt="${team.name}" draggable="false">`
      : `<span class="tt ${cls}" style="background:${team.c1};color:#fff">${team.abbr}</span>`;
  }

  const UI = {
    current: 'title',
    picked: [],

    init() {
      document.getElementById('app').addEventListener('click', e => {
        const el = e.target.closest('[data-action]');
        if (!el || el.disabled) return;
        NFL.Audio.unlock();
        this.action(el.dataset.action, el);
      });
      $('#opt-sound').addEventListener('change', e => this.setPref('sound', e.target.checked));
      $('#opt-music').addEventListener('change', e => this.setPref('music', e.target.checked));
      $('#opt-skin').addEventListener('change', e => { this.setPref('skin', e.target.checked ? 'helmet' : 'logo'); this.renderPrefs(); });
      $('.opt-sound-p').addEventListener('change', e => this.setPref('sound', e.target.checked));
      $('.opt-music-p').addEventListener('change', e => this.setPref('music', e.target.checked));
      this.show('title');
    },

    setPref(k, v) {
      S().data.prefs[k] = v;
      S().save();
      NFL.Audio.applyPrefs();
      NFL.Renderer.badges = {};
    },

    show(name) {
      this.current = name;
      $$('.screen').forEach(s => s.classList.add('hidden'));
      $$('.popup').forEach(p => p.classList.add('hidden'));
      $('#touchdown').classList.add('hidden');
      $('#screen-' + name).classList.remove('hidden');
      $$('.coins-val').forEach(e => { e.textContent = S().data.coins; });
      if (name === 'title') this.renderTitle();
      if (name === 'levels') this.renderLevels();
      if (name === 'prefs') this.renderPrefs();
    },

    popup(id, on = true) { $('#popup-' + id).classList.toggle('hidden', !on); },

    iris(fn) {
      const iris = $('#iris');
      iris.classList.add('closed');
      setTimeout(() => {
        fn();
        requestAnimationFrame(() => setTimeout(() => iris.classList.remove('closed'), 80));
      }, 580);
    },

    toast(msg) {
      const t = $('#toast');
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => t.classList.add('hidden'), 1800);
    },

    announce(word) {
      const a = $('#announce');
      a.textContent = word;
      a.classList.remove('show');
      void a.offsetWidth;
      a.classList.add('show');
    },

    // Faute : mouchoir jaune lancé + « FLAAAG ! » géant
    flag() {
      const el = $('#flag-call');
      el.classList.remove('show');
      void el.offsetWidth;
      el.classList.add('show');
    },

    // ---------------- actions ----------------
    action(name, el) {
      const game = G();
      if (name !== 'pause' && name !== 'flag') NFL.Audio.play('click');
      switch (name) {
        case 'play': this.startLevel(Math.min(S().data.unlocked, NFL.LEVELS.length)); break;
        case 'levels': this.iris(() => this.show('levels')); break;
        case 'prefs': this.show('prefs'); break;
        case 'home':
          if (this.current === 'prefs' && this.picked.length !== NFL.TEAM_SLOTS) {
            this.toast(`Choisis encore ${NFL.TEAM_SLOTS - this.picked.length} équipe(s)`); return;
          }
          this.show('title'); break;
        case 'random-teams': {
          const ids = NFL.TEAMS.map(t => t.id).sort(() => Math.random() - 0.5);
          this.picked = ids.slice(0, NFL.TEAM_SLOTS); this.savePicked(); this.renderPrefs(); break;
        }
        case 'clear-teams': this.picked = []; this.renderPrefs(); break;
        case 'reset':
          if (confirm('Effacer toute la progression (scores, niveaux, pièces) ?')) { S().reset(); this.toast('Progression réinitialisée'); }
          break;
        case 'timeout':
          game.moves += 3; el.disabled = true;
          $('#intro-moves').textContent = game.moves;
          NFL.Audio.play('whistle'); this.updateHUD(); break;
        case 'go':
          this.popup('intro', false);
          NFL.Audio.play('whistle');
          game.begin(); break;
        case 'skip-tuto': game.endTutorial(); break;
        case 'pause':
          if (game.state !== 'play' && game.state !== 'bonus') return;
          game.paused = true;
          $('.opt-sound-p').checked = S().data.prefs.sound;
          $('.opt-music-p').checked = S().data.prefs.music;
          this.popup('pause'); break;
        case 'resume': game.paused = false; this.popup('pause', false); break;
        case 'restart': this.startLevel(game.level.id); break;
        case 'quit': this.iris(() => { game.state = 'idle'; game.gen++; this.show('levels'); }); break;
        case 'flag': game.toggleFlag(); NFL.Audio.play('tick'); break;
        case 'skip-bonus': game.skipBonus(); break;
        case 'buy-moves':
          if (game.buyMoves()) { this.popup('fail', false); NFL.Audio.play('coin'); }
          else this.toast('Pas assez de pièces'); break;
        case 'next':
          if (game.level.id < NFL.LEVELS.length) this.startLevel(game.level.id + 1);
          else { this.iris(() => this.show('levels')); setTimeout(() => this.toast('Saison terminée ! 🏆 Bravo coach !'), 700); }
          break;
        case 'free10':
          S().data.coins += 10; S().save(); el.disabled = true; NFL.Audio.play('coin'); this.refreshCoins(); break;
        case 'daily':
          if (S().data.lastDaily !== S().today()) {
            S().data.lastDaily = S().today(); S().data.coins += 100; S().save();
            NFL.Audio.play('coin'); this.refreshCoins();
          }
          el.disabled = true; break;
        case 'gift':
          if (S().data.gift >= 3) {
            S().data.gift = 0; S().data.coins += 50; S().data.flags += 1; S().save();
            NFL.Audio.play('coin'); this.toast('Cadeau : +50 🪙 et +1 🚩'); this.refreshCoins();
          } else this.toast(`Encore ${3 - S().data.gift} victoire(s) pour le cadeau`);
          $('#gift-bar').style.width = (S().data.gift / 3 * 100) + '%';
          break;
      }
    },

    refreshCoins() { $$('.coins-val').forEach(e => { e.textContent = S().data.coins; }); },

    startLevel(id) {
      const lvl = NFL.LEVELS.find(l => l.id === id);
      if (!lvl) return;
      this.iris(() => {
        this.show('game');
        G().start(lvl);
        this.updateHUD();
        G().relayout();
        this.showIntro();
      });
    },

    // ---------------- page de garde ----------------
    renderTitle() {
      $('#title-stars').textContent = S().totalStars();
      $('#title-teams').innerHTML = S().data.prefs.teams.map(id => teamIcon(NFL.TEAM_BY_ID[id])).join('');
      $$('#title-teams > *').forEach((e, i) => { e.style.animationDelay = (i * 0.15) + 's'; });
    },

    // ---------------- saison (niveaux débloqués + scores sauvegardés) ----------------
    renderLevels() {
      const unlocked = S().data.unlocked;
      $('#levels-stars').textContent = `${S().totalStars()} / ${NFL.LEVELS.length * 3}`;
      $('#level-grid').innerHTML = NFL.LEVELS.map(l => {
        const rec = S().record(l.id);
        const locked = l.id > unlocked;
        const current = l.id === unlocked && !rec.stars;
        const stars = [1, 2, 3].map(i => (i <= rec.stars ? '<i>★</i>' : '★')).join('');
        const cls = ['lvl', locked && 'locked', current && 'current', l.id === NFL.LEVELS.length && 'final'].filter(Boolean).join(' ');
        return `<button class="${cls}" data-level="${l.id}" ${locked ? 'disabled' : ''}>
          <small>${l.id === NFL.LEVELS.length ? 'FINALE' : 'SEMAINE'}</small><b>${l.id}</b>
          <span class="stars">${stars}</span><span class="best">${rec.best ? 'Record ' + rec.best : '&nbsp;'}</span></button>`;
      }).join('');
      $$('#level-grid .lvl').forEach(b => b.addEventListener('click', () => {
        if (b.disabled) return;
        NFL.Audio.unlock(); NFL.Audio.play('click');
        this.startLevel(+b.dataset.level);
      }));
    },

    // ---------------- préférences ----------------
    renderPrefs() {
      if (this.current !== 'prefs') return;
      if (!this.picked.length && S().data.prefs.teams.length === NFL.TEAM_SLOTS && !this.prefsTouched) this.picked = S().data.prefs.teams.slice();
      this.prefsTouched = true;
      $('#opt-sound').checked = S().data.prefs.sound;
      $('#opt-music').checked = S().data.prefs.music;
      $('#opt-skin').checked = S().data.prefs.skin === 'helmet';
      $('#pref-picked').innerHTML = Array.from({ length: NFL.TEAM_SLOTS }, (_, i) => {
        const id = this.picked[i];
        return `<div class="slot"><i>${i + 1}</i>${id ? teamIcon(NFL.TEAM_BY_ID[id]) : ''}</div>`;
      }).join('');
      $('#team-grid').innerHTML = NFL.TEAMS.map(t => {
        const idx = this.picked.indexOf(t.id);
        const inner = S().data.prefs.skin === 'logo' && NFL.Assets.logoSrc(t.id)
          ? `<img src="${NFL.Assets.logoSrc(t.id)}" alt="${t.name}" draggable="false">`
          : `<span class="ab" style="color:${t.c1}">${t.abbr}</span>`;
        return `<button class="team ${idx >= 0 ? 'on' : ''}" data-team="${t.id}" title="${t.city} ${t.name}">${inner}${idx >= 0 ? `<span class="num">${idx + 1}</span>` : ''}</button>`;
      }).join('');
      $$('#team-grid .team').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.team;
        const i = this.picked.indexOf(id);
        if (i >= 0) this.picked.splice(i, 1);
        else if (this.picked.length < NFL.TEAM_SLOTS) this.picked.push(id);
        else { this.toast('6 équipes max — retire-en une'); return; }
        NFL.Audio.unlock(); NFL.Audio.play('tick');
        this.savePicked();
        this.renderPrefs();
      }));
    },

    savePicked() {
      if (this.picked.length === NFL.TEAM_SLOTS) {
        S().data.prefs.teams = this.picked.slice();
        S().save();
        NFL.Renderer.badges = {};
      }
    },

    // ---------------- HUD ----------------
    goalHTML(goal, big) {
      let icon, label;
      if (goal.type === 'team') {
        const t = G().teams[goal.slot];
        icon = `<span class="gi">${teamIcon(t)}</span>`; label = t.name;
      } else if (goal.type === 'tile') {
        icon = '<span class="gi tile"></span>'; label = 'Gazon doré';
      } else {
        icon = '<span class="gi dummy"></span>'; label = 'Sacs de plaquage';
      }
      const val = goal.left <= 0 ? '<span class="done">✅</span>' : `<span>${big ? goal.target : goal.left}</span>`;
      return `<div class="goal" data-type="${goal.type}" data-slot="${goal.slot}">${icon}${val}${big ? `<small>${label}</small>` : ''}</div>`;
    },

    updateHUD() {
      const game = G();
      if (!game.level) return;
      $('#hud-moves').textContent = game.moves;
      $('#hud-stage').textContent = game.level.id;
      const html = game.goals.map(g => this.goalHTML(g, false)).join('');
      const box = $('#hud-goals');
      if (box.dataset.html !== html) {
        const prev = box.dataset.html;
        box.innerHTML = html; box.dataset.html = html;
        if (prev) $$('#hud-goals .goal').forEach(e => { e.classList.add('bump'); });
      }
      $('#hud-score').textContent = game.score;
      const top = game.level.stars[2];
      $('#hud-bar').style.width = Math.min(100, game.score / top * 100) + '%';
      $$('.score-bar .bs').forEach((s, i) => {
        s.style.left = (game.level.stars[i] / top * 100 - (i === 2 ? 4 : 0)) + '%';
        s.classList.toggle('on', game.score >= game.level.stars[i]);
      });
      $('#flag-count').textContent = S().data.flags > 0 ? S().data.flags : '60🪙';
      $('#booster-flag').classList.toggle('active', !!game.flagMode);
    },

    showIntro() {
      const game = G();
      $('#intro-title').textContent = game.level.id === NFL.LEVELS.length ? 'LA FINALE' : 'SEMAINE ' + game.level.id;
      $('#intro-goals').innerHTML = game.goals.map(g => this.goalHTML(g, true)).join('');
      $('#intro-moves').textContent = game.moves;
      $('[data-action="timeout"]').disabled = false;
      this.popup('intro');
    },

    showTutorial(text) {
      $('#tutorial-text').textContent = text;
      $('#tutorial-box').classList.remove('hidden');
    },
    hideTutorial() { $('#tutorial-box').classList.add('hidden'); },

    showBonus(on) { $('#bonus-banner').classList.toggle('hidden', !on); },

    showWin(res) {
      const td = $('#touchdown');
      td.classList.remove('hidden');
      NFL.Audio.play('touchdown');
      NFL.FX.confetti(NFL.Renderer.W, NFL.Renderer.H, 160);
      setTimeout(() => {
        td.classList.add('hidden');
        if (this.current !== 'game' || G().state !== 'over') return;
        $('#win-level').textContent = G().level.id;
        $('#win-score').textContent = res.score;
        $('#win-coins').textContent = res.coins;
        $('#win-best').classList.toggle('hidden', !res.newBest);
        $('#gift-bar').style.width = (S().data.gift / 3 * 100) + '%';
        $('[data-action="free10"]').disabled = false;
        $('[data-action="daily"]').disabled = S().data.lastDaily === S().today();
        $('[data-action="next"]').textContent = G().level.id < NFL.LEVELS.length ? 'SUIVANT ›' : 'FIN DE SAISON 🏆';
        const stars = $$('#popup-win .ws');
        stars.forEach(s => s.classList.remove('on'));
        this.popup('win');
        for (let i = 0; i < res.stars; i++) {
          setTimeout(() => { stars[i].classList.add('on'); NFL.Audio.play('star', i); }, 350 + i * 380);
        }
        setTimeout(() => NFL.Audio.play('coin'), 350 + res.stars * 380);
        this.refreshCoins();
      }, 2300);
    },

    showFail() {
      NFL.Audio.play('fail');
      $('#fail-goals').innerHTML = G().goals.map(g => this.goalHTML(g, false)).join('');
      $('[data-action="buy-moves"]').disabled = S().data.coins < 80;
      setTimeout(() => this.popup('fail'), 500);
    },
  };

  NFL.UI = UI;
})();

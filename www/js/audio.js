// Audio 100 % procédural (Web Audio) : musique façon fanfare de stade + bruitages NFL originaux.
window.NFL = window.NFL || {};

(function () {
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  const Audio = {
    ctx: null, master: null, sfx: null, music: null, crowdGain: null, noise: null,
    musicOn: false, timer: null, step: 0, nextTime: 0,

    unlock() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.8;
        const comp = this.ctx.createDynamicsCompressor();
        this.master.connect(comp); comp.connect(this.ctx.destination);
        this.sfx = this.ctx.createGain(); this.sfx.connect(this.master);
        this.music = this.ctx.createGain(); this.music.gain.value = 0.32; this.music.connect(this.master);
        const len = this.ctx.sampleRate * 2;
        this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noise.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        this.applyPrefs();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },

    applyPrefs() {
      if (!this.ctx) return;
      const p = NFL.Save.data.prefs;
      this.sfx.gain.value = p.sound ? 1 : 0;
      if (p.music) this.startMusic(); else this.stopMusic();
    },

    // ---------- briques ----------
    env(g, t, a, peak, d) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    },
    osc(type, freq, t, dur, vol, dest = this.sfx, a = 0.005) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      this.env(g, t, a, vol, dur);
      o.connect(g); g.connect(dest);
      o.start(t); o.stop(t + a + dur + 0.05);
      return o;
    },
    noiseHit(t, dur, vol, type = 'bandpass', freq = 1000, q = 1, dest = this.sfx, a = 0.003) {
      const s = this.ctx.createBufferSource(); s.buffer = this.noise;
      s.playbackRate.value = 0.8 + Math.random() * 0.4;
      const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
      const g = this.ctx.createGain();
      this.env(g, t, a, vol, dur);
      s.connect(f); f.connect(g); g.connect(dest);
      s.start(t, Math.random()); s.stop(t + a + dur + 0.05);
      return f;
    },

    whistle(t, dur = 0.35, vol = 0.18) {
      [2900, 3150].forEach((f, i) => {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        lfo.frequency.value = 38; lg.gain.value = 120;
        lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(vol / (i + 1), t + 0.02);
        g.gain.setValueAtTime(vol / (i + 1), t + dur - 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(this.sfx);
        o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
      });
    },

    crowd(t, dur, vol, freq = 900) {
      const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const f1 = this.ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = freq; f1.Q.value = 0.7;
      const f2 = this.ctx.createBiquadFilter(); f2.type = 'peaking'; f2.frequency.value = freq * 2.6; f2.gain.value = 8;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.25);
      g.gain.exponentialRampToValueAtTime(vol * 0.6, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      // « voix » : léger trémolo
      const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      lfo.frequency.value = 5 + Math.random() * 3; lg.gain.value = vol * 0.25;
      lfo.connect(lg); lg.connect(g.gain);
      s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(this.sfx);
      s.start(t); lfo.start(t); s.stop(t + dur + 0.1); lfo.stop(t + dur + 0.1);
    },

    airhorn(t, dur = 1.1) {
      const out = this.ctx.createBiquadFilter(); out.type = 'lowpass'; out.frequency.value = 2600;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.04);
      g.gain.setValueAtTime(0.16, t + dur - 0.15);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      out.connect(g); g.connect(this.sfx);
      [233, 277, 349, 466].forEach(f => {
        [-6, 6].forEach(det => {
          const o = this.ctx.createOscillator(); o.type = 'sawtooth';
          o.frequency.setValueAtTime(f * 0.96, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08);
          o.detune.value = det; o.connect(out); o.start(t); o.stop(t + dur + 0.05);
        });
      });
    },

    brass(t, note, dur, vol, dest) {
      const f = midi(note);
      const flt = this.ctx.createBiquadFilter(); flt.type = 'lowpass'; flt.Q.value = 2;
      flt.frequency.setValueAtTime(f * 1.5, t);
      flt.frequency.exponentialRampToValueAtTime(f * 6, t + 0.05);
      flt.frequency.exponentialRampToValueAtTime(f * 2.5, t + dur);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
      g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.04, dur - 0.06));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      flt.connect(g); g.connect(dest);
      [-7, 7].forEach(det => {
        const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        o.connect(flt); o.start(t); o.stop(t + dur + 0.05);
      });
    },

    kick(t, dest, vol = 0.9) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      this.env(g, t, 0.002, vol, 0.25);
      o.connect(g); g.connect(dest); o.start(t); o.stop(t + 0.3);
    },
    snare(t, dest, vol = 0.35) {
      this.noiseHit(t, 0.12, vol, 'highpass', 1800, 0.7, dest);
      this.osc('triangle', 210, t, 0.06, vol * 0.5, dest);
    },

    // ---------- bruitages ----------
    play(name, arg = 0) {
      if (!this.ctx || !NFL.Save.data.prefs.sound) return;
      const t = this.ctx.currentTime + 0.01;
      switch (name) {
        case 'tick': this.osc('square', 1400, t, 0.03, 0.05); break;
        case 'click': this.osc('triangle', 900, t, 0.05, 0.12); this.osc('triangle', 1350, t + 0.03, 0.05, 0.08); break;
        case 'swap': {
          const f = this.noiseHit(t, 0.16, 0.22, 'bandpass', 500, 2);
          f.frequency.exponentialRampToValueAtTime(2400, t + 0.15);
          break;
        }
        case 'invalid':
          this.osc('square', 190, t, 0.09, 0.09); this.osc('square', 150, t + 0.11, 0.12, 0.09); break;
        case 'pop': {
          const base = 420 * Math.pow(2, Math.min(arg, 8) * 2 / 12);
          this.osc('triangle', base, t, 0.12, 0.22);
          this.osc('sine', base * 1.5, t + 0.02, 0.1, 0.12);
          // choc de casques
          this.osc('sine', 120, t, 0.12, 0.25);
          this.noiseHit(t, 0.05, 0.15, 'highpass', 2500, 1);
          break;
        }
        case 'land': this.noiseHit(t, 0.06, 0.06, 'lowpass', 400, 1); break;
        case 'hit':
          this.osc('sine', 90, t, 0.18, 0.4); this.noiseHit(t, 0.1, 0.25, 'bandpass', 700, 1.2); break;
        case 'special':
          this.whistle(t, 0.12, 0.1);
          [0, 4, 7, 12].forEach((n, i) => this.osc('square', midi(72 + n), t + i * 0.05, 0.08, 0.06));
          break;
        case 'laser': {
          const o = this.osc('sawtooth', 1600, t, 0.3, 0.13);
          o.frequency.exponentialRampToValueAtTime(180, t + 0.3);
          const f = this.noiseHit(t, 0.3, 0.18, 'bandpass', 3000, 1);
          f.frequency.exponentialRampToValueAtTime(400, t + 0.3);
          break;
        }
        case 'boom': {
          const o = this.osc('sine', 110, t, 0.6, 0.7);
          o.frequency.exponentialRampToValueAtTime(35, t + 0.5);
          this.noiseHit(t, 0.6, 0.6, 'lowpass', 600, 0.8);
          this.crowd(t + 0.1, 1.2, 0.12, 700);
          break;
        }
        case 'rainbow':
          for (let i = 0; i < 10; i++) this.osc('square', 900 + Math.random() * 1800, t + i * 0.035, 0.05, 0.05);
          this.noiseHit(t, 0.5, 0.2, 'highpass', 4000, 1);
          break;
        case 'roar': this.crowd(t, 2.6, 0.3, 850); this.crowd(t + 0.05, 2.4, 0.18, 1400); break;
        case 'cheer': this.crowd(t, 1.4, 0.16, 1000); break;
        case 'goal':
          [76, 79, 84].forEach((n, i) => this.osc('triangle', midi(n), t + i * 0.08, 0.15, 0.14)); break;
        case 'whistle': this.whistle(t, 0.22); this.whistle(t + 0.3, 0.55); break;
        case 'touchdown':
          this.airhorn(t, 1.2);
          this.crowd(t, 4, 0.35, 850); this.crowd(t + 0.1, 3.6, 0.2, 1500);
          [70, 74, 77, 82, 82, 77, 82].forEach((n, i) => this.brass(t + 1.1 + i * 0.16, n, i === 6 ? 0.7 : 0.15, 0.12, this.sfx));
          break;
        case 'fail': {
          [67, 66, 65, 64].forEach((n, i) => {
            const d = i === 3 ? 0.9 : 0.35;
            this.brass(t + i * 0.4, n - 12, d, 0.14, this.sfx);
          });
          this.crowd(t, 1.8, 0.1, 500);
          break;
        }
        case 'coin': this.osc('square', 988, t, 0.06, 0.08); this.osc('square', 1319, t + 0.07, 0.2, 0.08); break;
        case 'star': [84, 88, 91].forEach((n, i) => this.osc('sine', midi(n + arg * 2), t + i * 0.04, 0.4, 0.12)); break;
      }
    },

    // ---------- musique : fanfare de stade originale (Bb majeur, 128 bpm) ----------
    // mélodie : [note MIDI | null, durée en croches]
    melody: [
      [65, 1], [70, 1], [74, 2], [77, 3], [74, 1],
      [75, 2], [74, 1], [72, 1], [74, 4],
      [65, 1], [70, 1], [74, 2], [77, 2], [79, 2],
      [77, 2], [75, 2], [74, 2], [72, 2],
      [67, 1], [72, 1], [75, 2], [79, 3], [75, 1],
      [77, 2], [75, 1], [74, 1], [72, 4],
      [74, 1], [74, 1], [75, 1], [77, 1], [79, 2], [81, 2],
      [82, 2], [77, 1], [74, 1], [70, 4],
    ],
    chords: [[46, 58, 62, 65], [41, 57, 60, 65], [46, 58, 62, 65], [41, 57, 60, 63], [48, 60, 63, 67], [41, 57, 60, 65], [39, 58, 63, 67], [46, 58, 62, 65]],

    startMusic() {
      if (!this.ctx || this.musicOn) return;
      this.musicOn = true;
      this.step = 0;
      this.nextTime = this.ctx.currentTime + 0.1;
      // index des notes de mélodie par croche
      this.melMap = {};
      let pos = 0;
      this.melody.forEach(([n, d]) => { this.melMap[pos] = [n, d]; pos += d; });
      this.timer = setInterval(() => this.schedule(), 25);
      // ambiance foule continue
      const s = this.ctx.createBufferSource(); s.buffer = this.noise; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 0.5;
      this.crowdGain = this.ctx.createGain(); this.crowdGain.gain.value = 0.05;
      s.connect(f); f.connect(this.crowdGain); this.crowdGain.connect(this.music);
      s.start(); this.crowdSrc = s;
    },

    stopMusic() {
      this.musicOn = false;
      clearInterval(this.timer); this.timer = null;
      if (this.crowdSrc) { try { this.crowdSrc.stop(); } catch (e) { /* déjà arrêté */ } this.crowdSrc = null; }
    },

    schedule() {
      const spb16 = 60 / 128 / 4; // durée d'une double croche
      while (this.nextTime < this.ctx.currentTime + 0.12) {
        const s = this.step % 128;          // 8 mesures de 16 doubles croches
        const bar = Math.floor(s / 16), pos = s % 16, t = this.nextTime, M = this.music;
        // batterie (drumline)
        if (pos === 0 || pos === 8 || (pos === 10 && bar % 2)) this.kick(t, M);
        if (pos === 4 || pos === 12) this.snare(t, M, 0.4);
        else if (pos % 2 === 1) this.noiseHit(t, 0.03, 0.06, 'highpass', 5000, 1, M);
        if (bar % 4 === 3 && pos >= 12) { this.snare(t, M, 0.22); this.snare(t + spb16 / 2, M, 0.18); }
        if (pos === 0 && bar % 4 === 0) this.noiseHit(t, 0.9, 0.12, 'highpass', 6000, 0.5, M);
        // basse : fondamentale / quinte en noires
        const ch = this.chords[bar];
        if (pos % 4 === 0) this.osc('triangle', midi(ch[0] - (pos === 8 ? -7 : 0)), t, 0.22, 0.32, M);
        // accords de cuivres sur les temps 2 et 4 (contretemps)
        if (pos === 6 || pos === 14) ch.slice(1).forEach(n => this.brass(t, n, 0.16, 0.035, M));
        // mélodie (en croches = 2 doubles croches)
        if (pos % 2 === 0) {
          const e = this.melMap[(bar * 8) + pos / 2];
          if (e && e[0]) this.brass(t, e[0], e[1] * spb16 * 2 * 0.92, 0.07, M);
        }
        this.nextTime += spb16;
        this.step++;
      }
    },
  };

  NFL.Audio = Audio;
})();

"""Compositeur paramétré : un thème musical original par saison (10 packs de niveaux).

Chaque profil fixe tonalité, mode, tempo, groove, instruments et grilles d'accords ;
les mélodies sont construites en phrases (motif / réponse / contraste / cadence) calées
sur les accords, avec une graine fixe pour que le résultat soit reproductible.
La saison 2 reprend le thème écrit à la main (tools/compose_theme.py).

Sorties : music/saisons/NN-nom.mid, music/saisons/themes.json et www/js/songs.js (NFL.SONGS, joué en jeu).
"""
import json
import random
from pathlib import Path

import compose_theme as base

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'music' / 'saisons'
SPB = 16  # doubles croches par mesure

PC = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
MAJOR = [0, 2, 4, 5, 7, 9, 11]
MINOR = [0, 2, 3, 5, 7, 8, 10]

# Accords exprimés en degrés (0 = tonique) ; 'V' en mineur est majeur (sensible)
DEG = {'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6}

PROGS = {
    'minor': {
        'intro': [['i', 'i', 'vi', 'V']],
        'A': [['i', 'i', 'vi', 'vii', 'i', 'i', 'iv', 'V'], ['i', 'vii', 'vi', 'vii', 'i', 'iv', 'vi', 'V'],
              ['i', 'vi', 'iii', 'vii', 'i', 'vi', 'iv', 'V']],
        'B': [['vi', 'vii', 'i', 'i', 'vi', 'vii', 'V', 'V'], ['iv', 'vi', 'iii', 'vii', 'iv', 'vi', 'V', 'V']],
        'break': [['i', 'i', 'vi', 'V']],
        'outro': [['vi', 'vii', 'i', 'i']],
    },
    'major': {
        'intro': [['i', 'i', 'iv', 'v']],
        'A': [['i', 'i', 'iv', 'v', 'i', 'vi', 'iv', 'v'], ['i', 'v', 'vi', 'iv', 'i', 'v', 'iv', 'v'],
              ['i', 'iii', 'iv', 'v', 'vi', 'iv', 'ii', 'v']],
        'B': [['iv', 'v', 'vi', 'iii', 'iv', 'v', 'i', 'v'], ['vi', 'iv', 'i', 'v', 'vi', 'iv', 'ii', 'v']],
        'break': [['i', 'i', 'iv', 'v']],
        'outro': [['iv', 'v', 'i', 'i']],
    },
}

RHYTHMS = {
    'heroic': [[4, 2, 2, 6, 2], [8, 4, 2, 2], [4, 4, 4, 4], [2, 2, 2, 2, 8], [6, 2, 4, 4], [3, 1, 3, 1, 8]],
    'funky': [[3, 3, 2, 3, 3, 2], [2, 1, 1, 4, 2, 2, 4], [3, 3, 4, 2, 4], [1, 1, 2, 4, 3, 3, 2]],
    'drive': [[2, 2, 2, 2, 2, 2, 4], [4, 2, 2, 4, 4], [2, 2, 4, 2, 2, 4], [3, 3, 2, 8]],
    'anthem': [[8, 4, 4], [4, 4, 8], [6, 2, 8], [4, 2, 2, 8], [12, 4]],
}

# Profils des 10 saisons (noms alignés sur l'écran saison du jeu)
SEASONS = [
    dict(n=1, slug='presaison', name='Présaison', key='Bb', mode='major', bpm=108, feel='funky', drums='funk',
         lead=56, ost=[0, 12, 0, 12], ost_rate=2, seed=101),
    dict(n=2, slug='saison-reguliere', name='Saison régulière', handmade=True),
    dict(n=3, slug='derby-de-division', name='Derby de division', key='D', mode='minor', bpm=124, feel='drive',
         drums='rock', lead=30, ost=[0, 0, 7, 12], ost_rate=1, seed=303),
    dict(n=4, slug='match-du-jeudi-soir', name='Match du jeudi soir', key='F', mode='major', bpm=104, feel='funky',
         drums='funk', lead=61, ost=[0, 7, 12, 7], ost_rate=2, seed=404),
    dict(n=5, slug='monday-night', name='Monday Night', key='E', mode='minor', bpm=118, feel='heroic',
         drums='halftime', lead=60, ost=[0, 0, 0, 12], ost_rate=1, seed=505),
    dict(n=6, slug='course-aux-playoffs', name='Course aux playoffs', key='G', mode='minor', bpm=128, feel='drive',
         drums='march', lead=61, ost=[0, 0, 7, 12], ost_rate=1, seed=606),
    dict(n=7, slug='wild-card', name='Wild Card', key='A', mode='minor', bpm=132, feel='drive',
         drums='electro', lead=81, ost=[0, 12, 7, 12], ost_rate=1, seed=707),
    dict(n=8, slug='divisional-round', name='Divisional Round', key='Eb', mode='major', bpm=116, feel='heroic',
         drums='rock', lead=60, ost=[0, 7, 12, 7], ost_rate=1, seed=808),
    dict(n=9, slug='finale-de-conference', name='Finale de conférence', key='B', mode='minor', bpm=136,
         feel='drive', drums='march', lead=56, ost=[0, 0, 7, 12], ost_rate=1, seed=909),
    dict(n=10, slug='le-grand-match', name='Le Grand Match', key='C', mode='major', bpm=120, feel='anthem',
         drums='rock', lead=61, ost=[0, 7, 12, 16], ost_rate=1, seed=1010),
]

FORM = [('intro', 4), ('A', 8), ('B', 8), ('break', 4), ('A2', 8), ('outro', 4)]


class Theme:
    def __init__(self, p):
        self.p = p
        self.rnd = random.Random(p['seed'])
        self.tonic = PC[p['key']]
        self.scale = MAJOR if p['mode'] == 'major' else MINOR

    # --- harmonie ---
    def chord_pcs(self, sym):
        d = DEG[sym.lower()]
        pcs = [(self.tonic + self.scale[(d + k) % 7]) % 12 for k in (0, 2, 4)]
        if self.p['mode'] == 'minor' and sym == 'V':      # dominante majeure
            pcs[1] = (pcs[1] + 1) % 12
        return pcs

    def scale_pcs(self, sym=None):
        pcs = [(self.tonic + s) % 12 for s in self.scale]
        if self.p['mode'] == 'minor' and sym == 'V':      # mineur harmonique sur V
            pcs[6] = (pcs[6] + 1) % 12
        return pcs

    @staticmethod
    def nearest(target, pcs, lo, hi):
        best = None
        for m in range(lo, hi + 1):
            if m % 12 in pcs and (best is None or abs(m - target) < abs(best - target)):
                best = m
        return best

    # --- mélodie ---
    def motif(self, length_bars=2):
        """Rythme + contour (en pas de gamme) d'un motif de 2 mesures."""
        bars = []
        for _ in range(length_bars):
            bars.append(list(self.rnd.choice(RHYTHMS[self.p['feel']])))
        contour, pos = [], 0
        for bar in bars:
            for _ in bar:
                pos += self.rnd.choice([-2, -1, -1, 0, 1, 1, 2, 3])
                pos = max(-3, min(6, pos))
                contour.append(pos)
        return bars, contour

    def realize(self, bars, contour, chords, center, shift=0, cadence=None):
        """Place un motif sur des accords : temps forts = notes de l'accord, temps faibles = gamme."""
        notes, i = [], 0
        lo, hi = center - 7, center + 12
        for b, bar in enumerate(bars):
            sym = chords[b]
            step = 0
            for k, dur in enumerate(bar):
                deg = contour[i] + shift
                i += 1
                target = center + int(deg * 1.75)
                strong = step % 4 == 0 or dur >= 4
                pcs = self.chord_pcs(sym) if strong else self.scale_pcs(sym)
                last = b == len(bars) - 1 and k == len(bar) - 1
                if last and cadence is not None:
                    pcs = [self.chord_pcs(sym)[cadence]]
                notes.append((self.nearest(target, pcs, lo, hi), dur))
                step += dur
        return notes

    def phrase(self, chords8, center, lift=0):
        """8 mesures : motif (1-2), réponse transposée (3-4), contraste (5-6), cadence (7-8)."""
        m_bars, m_cont = self.motif()
        c_bars, c_cont = self.motif()
        out = []
        out += self.realize(m_bars, m_cont, chords8[0:2], center + lift)
        out += self.realize(m_bars, m_cont, chords8[2:4], center + lift, shift=self.rnd.choice([-1, 1, 2]))
        out += self.realize(c_bars, c_cont, chords8[4:6], center + lift + 2)
        cad_bars = [list(self.rnd.choice(RHYTHMS[self.p['feel']])), [8, 4, 4] if self.p['feel'] != 'anthem' else [12, 4]]
        cad_cont = [self.rnd.choice([0, 1, 2]) for _ in cad_bars[0]] + [1, 0, -1][:len(cad_bars[1])]
        out += self.realize(cad_bars, cad_cont, chords8[6:8], center + lift, cadence=0)
        return out

    # --- construction complète ---
    def build(self):
        p, prog = self.p, PROGS[self.p['mode']]
        pick = {s: self.rnd.choice(prog[s]) for s in prog}
        chords, sections = [], []
        for sec, bars in FORM:
            key = 'A' if sec == 'A2' else sec
            chords += pick[key][:bars]
            sections += [sec] * bars

        center = 60 + self.tonic + (12 if self.tonic < 5 else 0)   # registre du thème (~do4-sol5)
        lead = []
        a_phrase = self.phrase(pick['A'], center)
        b_phrase = self.phrase(pick['B'], center, lift=5)
        intro = self.realize([[2, 2, 2, 2, 4, 4], [2, 2, 2, 2, 4, 4], [2, 2, 2, 2, 4, 4], [4, 4, 4, 4]],
                             [0, 0, 0, 2, 4, 7, 0, 0, 0, 2, 4, 8, 0, 0, 2, 4, 5, 7, 2, 4, 6, 7],
                             pick['intro'], center)
        outro_c = pick['outro']
        outro = self.realize([[4, 4, 8], [4, 4, 8], [16], [4, 12]], [0, 2, 4, 1, 3, 5, 7, 4, 0],
                             outro_c, center + 5, cadence=0)
        melody_plan = {'intro': intro, 'A': a_phrase, 'B': b_phrase, 'A2': a_phrase, 'outro': outro}

        tracks = {k: [] for k in ('lead', 'bass', 'ostinato', 'pad', 'timp')}
        drums = []
        start = {}
        for i, s in enumerate(sections):
            start.setdefault(s, i)
        for sec, notes in melody_plan.items():
            s = start[sec] * SPB
            vel = {'intro': 100, 'A': 104, 'B': 110, 'A2': 112, 'outro': 116}[sec]
            for note, dur in notes:
                if note is not None:
                    tracks['lead'].append([s, dur, note, vel])
                s += dur
        # dernière note de l'outro : tenue courte puis silence
        total = len(chords)
        for bar, (sec, sym) in enumerate(zip(sections, chords)):
            s0 = bar * SPB
            pcs = self.chord_pcs(sym)
            root = 36 + pcs[0]
            if root < 40:
                root += 12
            last = bar == total - 1
            # basse
            if sec in ('A', 'B', 'A2') and not last:
                pattern = {'funk': [(0, 3, 0), (3, 3, 0), (6, 2, 12), (10, 2, 0), (12, 2, 7), (14, 2, 12)],
                           'electro': [(k, 2, 0 if k % 4 == 0 else 12) for k in range(0, 16, 2)],
                           'halftime': [(0, 6, 0), (6, 2, 0), (8, 8, 7)]}.get(p['drums'],
                           [(k, 2, 12 if k in (12, 14) else 0) for k in range(0, 16, 2)])
                for st, du, iv in pattern:
                    tracks['bass'].append([s0 + st, du, root + iv, 96])
            elif sec in ('intro', 'break'):
                tracks['bass'].append([s0, 8, root, 90])
            elif sec == 'outro' and not last:
                for k in range(0, 16, 4):
                    tracks['bass'].append([s0 + k, 4, root, 100])
            if last:
                tracks['bass'].append([s0, 8, 36 + self.tonic + (12 if self.tonic < 4 else 0), 120])
            # ostinato
            if sec in ('A', 'B', 'break', 'A2') or (sec == 'intro' and bar >= 2):
                rate = p['ost_rate']
                for k in range(0, 16, rate):
                    iv = p['ost'][(k // rate) % len(p['ost'])]
                    tracks['ostinato'].append([s0 + k, rate, root + 12 + iv, 90 if k % 4 == 0 else 68])
            # pad
            if sec in ('B', 'A2', 'outro'):
                for pc in pcs:
                    note = 55 + ((pc - 7) % 12)
                    tracks['pad'].append([s0, 8 if last else 16, note, 70 if sec != 'outro' else 88])
            # timbales
            if bar == start.get(sec) and sec in ('intro', 'A', 'B', 'A2'):
                tracks['timp'].append([s0, 8, root + 12 - (12 if root + 12 > 55 else 0), 118])
            if sec == 'intro' and bar == start['intro'] + 3:
                for k in range(8, 16):
                    tracks['timp'].append([s0 + k, 1, root + 12 - (12 if root + 12 > 55 else 0), 60 + k * 4])
            if last:
                tracks['timp'].append([s0, 8, 48 + self.tonic - (12 if self.tonic > 7 else 0), 127])
            # batterie
            drums += self.drum_bar(sec, bar, start, s0, last, total)
        return tracks, sorted(drums), chords, sections

    def drum_bar(self, sec, bar, start, s0, last, total):
        style, d = self.p['drums'], []
        if bar == start.get(sec) or last:
            d.append([s0, 'crash'])
        if last:
            return d + [[s0, 'kick']]
        if sec in ('A', 'B', 'A2'):
            if style == 'rock':
                d += [[s0 + k, 'kick'] for k in (0, 6, 8)] + [[s0 + k, 'snare'] for k in (4, 12)]
                d += [[s0 + k, 'hat'] for k in range(0, 16, 2)]
            elif style == 'funk':
                d += [[s0 + k, 'kick'] for k in (0, 3, 10)] + [[s0 + k, 'snare'] for k in (4, 12)]
                d += [[s0 + k, 'ghost'] for k in (7, 9, 15)] + [[s0 + k, 'hat'] for k in range(16)]
            elif style == 'electro':
                d += [[s0 + k, 'kick'] for k in (0, 4, 8, 12)] + [[s0 + k, 'snare'] for k in (4, 12)]
                d += [[s0 + k, 'hat'] for k in range(2, 16, 4)]
            elif style == 'halftime':
                d += [[s0 + k, 'kick'] for k in (0, 10)] + [[s0 + 8, 'snare']]
                d += [[s0 + k, 'hat'] for k in range(0, 16, 2)]
            elif style == 'march':
                d += [[s0 + k, 'kick'] for k in (0, 8)] + [[s0 + k, 'snare'] for k in (4, 12)]
                d += [[s0 + k, 'ghost'] for k in range(16) if k % 4]
            if bar % 4 == 3:
                d += [[s0 + k, 'snare'] for k in (12, 13, 14, 15)] + [[s0 + 14, 'tom'], [s0 + 15, 'tom']]
        elif sec == 'break':
            d.append([s0, 'kick'])
            d += [[s0 + k, 'snare' if k % 4 == 0 else 'ghost'] for k in range(16)]
        elif sec == 'intro' and bar >= start['intro'] + 2:
            d += [[s0, 'kick'], [s0 + 8, 'kick']] + [[s0 + k, 'snare'] for k in range(8, 16, 2)]
        elif sec == 'outro':
            d += [[s0 + k, 'kick'] for k in (0, 4, 8, 12)] + [[s0 + 4, 'snare'], [s0 + 12, 'snare']]
            if bar == total - 2:
                d += [[s0 + k, 'snare'] for k in range(8, 16)]
        return d


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    index = []
    for p in SEASONS:
        path = OUT / f"{p['n']:02d}-{p['slug']}.mid"
        if p.get('handmade'):
            tracks, drums = base.build()
            bpm, info = base.BPM, 'do mineur, écrit à la main'
            base.GM['lead'] = (0, 61)
            base.write_midi(tracks, drums, path)
        else:
            th = Theme(p)
            tracks, drums, chords, sections = th.build()
            bpm = p['bpm']
            info = f"{p['key']} {'majeur' if p['mode'] == 'major' else 'mineur'}, {p['feel']}, batterie {p['drums']}"
            saved_bpm, saved_lead = base.BPM, base.GM['lead']
            base.BPM, base.GM['lead'] = bpm, (0, p['lead'])
            base.write_midi(tracks, drums, path)
            base.BPM, base.GM['lead'] = saved_bpm, saved_lead
        bars = max(s + d for s, d, *_ in tracks['lead']) // SPB + 1
        index.append({'season': p['n'], 'name': p['name'], 'file': path.name, 'bpm': bpm, 'info': info,
                      'seconds': round(36 * 4 * 60 / bpm, 1), 'steps': 36 * SPB,
                      'tracks': tracks, 'drums': drums, 'lead_program': p.get('lead', 61)})
        print(f"{path.name:32s} {bpm} BPM  {index[-1]['seconds']:5.1f} s  {info}  ({bars} mesures)")
    (OUT / 'themes.json').write_text(json.dumps(index, separators=(',', ':')), encoding='utf-8')
    # Données jouées par le jeu ; timbre de la mélodie d'après le programme General MIDI
    voice = {30: 'guitar', 81: 'saw'}
    songs = [{'season': t['season'], 'name': t['name'], 'bpm': t['bpm'], 'steps': t['steps'],
              'lead': voice.get(t['lead_program'], 'brass'), 'tracks': t['tracks'], 'drums': t['drums']}
             for t in index]
    js = ('// Généré par tools/compose_season_themes.py — ne pas modifier à la main.\n'
          'window.NFL = window.NFL || {};\nNFL.SONGS = ' + json.dumps(songs, separators=(',', ':')) + ';\n')
    (ROOT / 'www' / 'js' / 'songs.js').write_text(js, encoding='utf-8')


if __name__ == '__main__':
    main()

"""Thème original de NFL Swapper (do mineur, 115 BPM).

Une seule source pour deux sorties :
  - music/nfl-swapper-theme.mid : MIDI multipiste General MIDI (à écouter / retravailler dans un DAW)
  (les notes jouées par le jeu sont exportées par tools/compose_season_themes.py : saison 2)

Unité de temps : la double croche (16 pas par mesure de 4/4).
"""
import json
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BPM = 115
STEPS_PER_BAR = 16

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}


def n(name):
    """'Eb5' -> numéro MIDI."""
    letter, rest = name[0], name[1:]
    acc = 0
    while rest and rest[0] in 'b#':
        acc += -1 if rest[0] == 'b' else 1
        rest = rest[1:]
    return 12 * (int(rest) + 1) + NOTE[letter] + acc


# Accords : fondamentale (octave 2) + triade
CHORDS = {
    'Cm': ['C', 'Eb', 'G'], 'Fm': ['F', 'Ab', 'C'], 'Ab': ['Ab', 'C', 'Eb'],
    'Bb': ['Bb', 'D', 'F'], 'G': ['G', 'B', 'D'], 'Eb': ['Eb', 'G', 'Bb'],
}

# Structure (une entrée par mesure) : (section, accord)
FORM = (
    [('intro', c) for c in ['Cm', 'Cm', 'Ab', 'G']] +
    [('A', c) for c in ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Fm', 'G']] +
    [('B', c) for c in ['Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'Bb', 'G', 'G']] +
    [('break', c) for c in ['Cm', 'Cm', 'Ab', 'G']] +
    [('A2', c) for c in ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Fm', 'G']] +
    [('outro', c) for c in ['Ab', 'Bb', 'Cm', 'Cm']]
)

# Mélodies : listes (note | None, durée en doubles croches), 16 par mesure
INTRO_LEAD = [
    [('C5', 2), (None, 2), ('C5', 2), (None, 2), ('C5', 2), ('Eb5', 2), ('G5', 4)],
    [('C5', 2), (None, 2), ('C5', 2), (None, 2), ('C5', 2), ('Eb5', 2), ('Bb5', 4)],
    [('Ab4', 2), (None, 2), ('Ab4', 2), (None, 2), ('C5', 2), ('Eb5', 2), ('Ab5', 4)],
    [('G4', 4), ('B4', 4), ('D5', 4), ('G5', 4)],
]
A_LEAD = [
    [('G4', 4), ('C5', 2), ('D5', 2), ('Eb5', 6), ('D5', 2)],
    [('C5', 8), (None, 4), ('G4', 2), ('C5', 2)],
    [('Ab4', 4), ('C5', 2), ('Eb5', 2), ('F5', 6), ('Eb5', 2)],
    [('D5', 4), ('Bb4', 4), ('F5', 8)],
    [('G5', 4), ('F5', 2), ('Eb5', 2), ('D5', 4), ('Eb5', 4)],
    [('C5', 8), ('G4', 4), ('C5', 4)],
    [('F5', 4), ('Ab5', 4), ('G5', 4), ('F5', 4)],
    [('G5', 8), ('B4', 4), ('D5', 4)],
]
B_LEAD = [
    [('C6', 8), ('Bb5', 4), ('Ab5', 4)],
    [('Bb5', 8), ('F5', 4), ('D5', 4)],
    [('Eb5', 4), ('G5', 4), ('C6', 8)],
    [('C6', 4), ('D6', 4), ('Eb6', 8)],
    [('Eb6', 6), ('D6', 2), ('C6', 4), ('Ab5', 4)],
    [('D6', 6), ('C6', 2), ('Bb5', 4), ('F5', 4)],
    [('G5', 4), ('B5', 4), ('D6', 4), ('F6', 4)],
    [('D6', 8), ('B5', 4), ('G5', 4)],
]
OUTRO_LEAD = [
    [('Ab5', 4), ('C6', 4), ('Eb6', 8)],
    [('Bb5', 4), ('D6', 4), ('F6', 8)],
    [('G6', 16)],
    [('C6', 4), (None, 12)],
]


def build():
    tracks = {k: [] for k in ('lead', 'bass', 'ostinato', 'pad', 'timp')}
    drums = []  # (pas, instrument)

    def add(track, step, dur, note, vel=100):
        tracks[track].append([step, dur, note, vel])

    def melody(bars, start_bar, octave_shift=0, vel=104):
        for i, bar in enumerate(bars):
            s = (start_bar + i) * STEPS_PER_BAR
            for name, d in bar:
                if name:
                    add('lead', s, d, n(name) + octave_shift, vel)
                s += d

    sec_start = {}
    for i, (sec, _) in enumerate(FORM):
        sec_start.setdefault(sec, i)
    melody(INTRO_LEAD, sec_start['intro'])
    melody(A_LEAD, sec_start['A'])
    melody(B_LEAD, sec_start['B'], vel=110)
    melody(A_LEAD, sec_start['A2'], vel=112)
    melody(OUTRO_LEAD, sec_start['outro'], vel=116)

    for bar, (sec, ch) in enumerate(FORM):
        s0 = bar * STEPS_PER_BAR
        tones = CHORDS[ch]
        root2 = n(tones[0] + '2')
        if root2 < n('E2'):
            root2 += 12
        fifth = root2 + 7
        last = bar == len(FORM) - 1

        # --- basse : croches sur la fondamentale, octave sur le 4e temps ---
        if sec in ('A', 'B', 'A2', 'outro') and not last:
            for k in range(8):
                note = root2 + (12 if k in (6, 7) else 0) if sec != 'outro' else root2
                add('bass', s0 + k * 2, 2, note, 96)
        elif sec == 'break':
            add('bass', s0, 4, root2, 100)
            add('bass', s0 + 10, 2, root2, 90)
        elif sec == 'intro':
            add('bass', s0, 16, root2, 90)
        if last:
            add('bass', s0, 8, n('C2'), 120)

        # --- ostinato pulsé (doubles croches) : fondamentale, fondamentale, quinte, octave ---
        if sec in ('A', 'B', 'break', 'A2') or (sec == 'intro' and bar >= 2):
            pattern = [0, 0, 7, 12]
            base = root2 + 12
            for k in range(16):
                vel = 92 if k % 4 == 0 else 70
                add('ostinato', s0 + k, 1, base + pattern[k % 4], vel)

        # --- pad chœur : accords tenus ---
        if sec in ('B', 'A2', 'outro'):
            for t in tones:
                note = n(t + '4')
                if note > n('G4'):
                    note -= 12
                add('pad', s0, 8 if last else 16, note, 70 if sec != 'outro' else 90)

        # --- timbales ---
        if sec == 'intro':
            add('timp', s0, 4, root2 + 12, 110)
            if bar == 3:
                for k in range(8, 16):
                    add('timp', s0 + k, 1, root2 + 12, 60 + k * 4)
        if sec in ('A', 'A2', 'B') and bar == sec_start[sec]:
            add('timp', s0, 8, root2 + 12, 120)
        if last:
            add('timp', s0, 8, n('C3'), 127)

        # --- batterie ---
        if bar == sec_start.get(sec) or last:
            drums.append([s0, 'crash'])
        if sec in ('A', 'B', 'A2'):
            for k in (0, 6, 8):
                drums.append([s0 + k, 'kick'])
            for k in (4, 12):
                drums.append([s0 + k, 'snare'])
            for k in range(0, 16, 2):
                drums.append([s0 + k, 'hat'])
            if bar % 4 == 3:  # roulement de fin de phrase
                for k in (12, 13, 14, 15):
                    drums.append([s0 + k, 'snare'])
                drums.extend([[s0 + 14, 'tom'], [s0 + 15, 'tom']])
        elif sec == 'break':
            drums.append([s0, 'kick'])
            for k in range(16):
                drums.append([s0 + k, 'snare' if k % 4 == 0 else 'ghost'])
            if bar == sec_start['break'] + 3:
                drums.extend([[s0 + 12, 'tom'], [s0 + 13, 'tom'], [s0 + 14, 'tom'], [s0 + 15, 'tom']])
        elif sec == 'intro' and bar >= 2:
            for k in (0, 8):
                drums.append([s0 + k, 'kick'])
            for k in range(8, 16, 2 if bar == 2 else 1):
                drums.append([s0 + k, 'snare'])
        elif sec == 'outro' and not last:
            for k in (0, 4, 8, 12):
                drums.append([s0 + k, 'kick'])
            drums.extend([[s0 + 4, 'snare'], [s0 + 12, 'snare']])
            if bar == len(FORM) - 2:
                for k in range(8, 16):
                    drums.append([s0 + k, 'snare'])
        if last:
            drums.append([s0, 'kick'])

    return tracks, sorted(drums)


# ---------------- export MIDI (format 1) ----------------
GM = {'lead': (0, 61), 'ostinato': (1, 48), 'bass': (2, 33), 'pad': (3, 52), 'timp': (4, 47)}
DRUM_KEYS = {'kick': 36, 'snare': 38, 'ghost': 38, 'hat': 42, 'crash': 49, 'tom': 45}
TPQ = 480
TICKS = TPQ // 4  # ticks par double croche


def vlq(v):
    out = [v & 0x7F]
    v >>= 7
    while v:
        out.insert(0, (v & 0x7F) | 0x80)
        v >>= 7
    return bytes(out)


def track_chunk(events):
    events.sort(key=lambda e: (e[0], e[1]))  # note-off (0) avant note-on (1) au même tick
    data, last = b'', 0
    for tick, _, msg in events:
        data += vlq(tick - last) + msg
        last = tick
    data += b'\x00\xFF\x2F\x00'
    return b'MTrk' + struct.pack('>I', len(data)) + data


def write_midi(tracks, drums, path):
    chunks = []
    tempo = int(60_000_000 / BPM)
    meta = [(0, 0, b'\xFF\x51\x03' + tempo.to_bytes(3, 'big')),
            (0, 0, b'\xFF\x58\x04\x04\x02\x18\x08'),
            (0, 0, b'\xFF\x59\x02\xFD\x01'),  # do mineur (3 bémols)
            (0, 0, b'\xFF\x03' + vlq(len(b'NFL Swapper Theme')) + b'NFL Swapper Theme')]
    chunks.append(track_chunk(meta))
    for name, notes in tracks.items():
        ch, prog = GM[name]
        title = name.encode()
        ev = [(0, 0, b'\xFF\x03' + vlq(len(title)) + title), (0, 0, bytes([0xC0 | ch, prog]))]
        for step, dur, note, vel in notes:
            ev.append((step * TICKS, 1, bytes([0x90 | ch, note, min(127, vel)])))
            ev.append(((step + dur) * TICKS - 1, 0, bytes([0x80 | ch, note, 0])))
        chunks.append(track_chunk(ev))
    ev = [(0, 0, b'\xFF\x03\x05drums')]
    for step, kind in drums:
        key = DRUM_KEYS[kind]
        vel = 50 if kind == 'ghost' else 110 if kind in ('crash', 'kick') else 95
        ev.append((step * TICKS, 1, bytes([0x99, key, vel])))
        ev.append((step * TICKS + TICKS - 1, 0, bytes([0x89, key, 0])))
    chunks.append(track_chunk(ev))
    header = b'MThd' + struct.pack('>IHHH', 6, 1, len(chunks), TPQ)
    path.write_bytes(header + b''.join(chunks))


def main():
    tracks, drums = build()
    bars = len(FORM)
    mid = ROOT / 'music' / 'nfl-swapper-theme.mid'
    mid.parent.mkdir(exist_ok=True)
    write_midi(tracks, drums, mid)
    secs = bars * 4 * 60 / BPM
    print(f'{bars} mesures, {secs:.1f} s, ' + ', '.join(f'{k}={len(v)}' for k, v in tracks.items()) + f', drums={len(drums)}')


if __name__ == '__main__':
    main()

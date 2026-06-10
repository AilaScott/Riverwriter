const KEYS = {
  C:   ['C',  'D',  'E',  'F',  'G',  'A',  'B'],
  Db:  ['Db', 'Eb', 'F',  'Gb', 'Ab', 'Bb', 'C'],
  D:   ['D',  'E',  'F#', 'G',  'A',  'B',  'C#'],
  Eb:  ['Eb', 'F',  'G',  'Ab', 'Bb', 'C',  'D'],
  E:   ['E',  'F#', 'G#', 'A',  'B',  'C#', 'D#'],
  F:   ['F',  'G',  'A',  'Bb', 'C',  'D',  'E'],
  'F#':['F#', 'G#', 'A#', 'B',  'C#', 'D#', 'E#'],
  G:   ['G',  'A',  'B',  'C',  'D',  'E',  'F#'],
  Ab:  ['Ab', 'Bb', 'C',  'Db', 'Eb', 'F',  'G'],
  A:   ['A',  'B',  'C#', 'D',  'E',  'F#', 'G#'],
  Bb:  ['Bb', 'C',  'D',  'Eb', 'F',  'G',  'A'],
  B:   ['B',  'C#', 'D#', 'E',  'F#', 'G#', 'A#'],
  Cm:  ['C',  'D',  'Eb', 'F',  'G',  'Ab', 'Bb'],
  Dbm: ['Db', 'Eb', 'E',  'F#', 'G#', 'A',  'B'],
  Dm:  ['D',  'E',  'F',  'G',  'A',  'Bb', 'C'],
  Ebm: ['Eb', 'F',  'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
  Em:  ['E',  'F#', 'G',  'A',  'B',  'C',  'D'],
  Fm:  ['F',  'G',  'Ab', 'Bb', 'C',  'Db', 'Eb'],
  'F#m':['F#','G#', 'A',  'B',  'C#', 'D',  'E'],
  Gm:  ['G',  'A',  'Bb', 'C',  'D',  'Eb', 'F'],
  Abm: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
  Am:  ['A',  'B',  'C',  'D',  'E',  'F',  'G'],
  Bbm: ['Bb', 'C',  'Db', 'Eb', 'F',  'Gb', 'Ab'],
  Bm:  ['B',  'C#', 'D',  'E',  'F#', 'G',  'A'],
};

const MAJOR_POOLS = {
  triads: [
    { degree: 0, suffix: '' },
    { degree: 1, suffix: 'm' },
    { degree: 2, suffix: 'm' },
    { degree: 3, suffix: '' },
    { degree: 4, suffix: '' },
    { degree: 5, suffix: 'm' },
    { degree: 6, suffix: 'dim' },
  ],
  sevenths: [
    { degree: 0, suffix: 'maj7' },
    { degree: 1, suffix: 'm7' },
    { degree: 2, suffix: 'm7' },
    { degree: 3, suffix: 'maj7' },
    { degree: 4, suffix: '7' },
    { degree: 5, suffix: 'm7' },
    { degree: 6, suffix: 'm7b5' },
  ],
  ninths: [
    { degree: 0, suffix: 'maj9' },
    { degree: 1, suffix: 'm9' },
    { degree: 2, suffix: 'm9' },
    { degree: 3, suffix: 'maj9' },
    { degree: 4, suffix: '9' },
    { degree: 5, suffix: 'm9' },
  ],
  add9: [
    { degree: 0, suffix: 'add9' },
    { degree: 1, suffix: 'madd9' },
    { degree: 3, suffix: 'add9' },
    { degree: 4, suffix: 'add9' },
    { degree: 5, suffix: 'madd9' },
  ],
};

const MINOR_POOLS = {
  triads: [
    { degree: 0, suffix: 'm' },
    { degree: 1, suffix: 'dim' },
    { degree: 2, suffix: '' },
    { degree: 3, suffix: 'm' },
    { degree: 4, suffix: 'm' },
    { degree: 5, suffix: '' },
    { degree: 6, suffix: '' },
  ],
  sevenths: [
    { degree: 0, suffix: 'm7' },
    { degree: 1, suffix: 'm7b5' },
    { degree: 2, suffix: 'maj7' },
    { degree: 3, suffix: 'm7' },
    { degree: 4, suffix: 'm7' },
    { degree: 5, suffix: 'maj7' },
    { degree: 6, suffix: '7' },
  ],
  ninths: [
    { degree: 0, suffix: 'm9' },
    { degree: 2, suffix: 'maj9' },
    { degree: 3, suffix: 'm9' },
    { degree: 5, suffix: 'maj9' },
    { degree: 6, suffix: '9' },
  ],
  add9: [
    { degree: 0, suffix: 'madd9' },
    { degree: 2, suffix: 'add9' },
    { degree: 3, suffix: 'madd9' },
    { degree: 5, suffix: 'add9' },
    { degree: 6, suffix: 'add9' },
  ],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPool(pools) {
  return [
    ...pools.triads,
    ...pools.triads,
    ...pools.sevenths,
    ...pools.sevenths,
    ...pools.ninths,
    ...pools.add9,
  ];
}

export function generateProgression(key, barCount) {
  const scale = KEYS[key];
  if (!scale) return { chords: [], barLayout: [] };

  const isMinor = key.endsWith('m');
  const pools = isMinor ? MINOR_POOLS : MAJOR_POOLS;
  const pool = weightedPool(pools);
  const chords = [];
  const barLayout = [];

  for (let i = 0; i < barCount; i++) {
    let chord;
    if (i === 0) {
      chord = isMinor ? { degree: 0, suffix: 'm' } : { degree: 0, suffix: '' };
    } else if (i === barCount - 1) {
      const lastOpts = isMinor
        ? [
            { degree: 6, suffix: '7' },
            { degree: 0, suffix: 'm' },
            { degree: 5, suffix: '' },
            { degree: 0, suffix: 'm7' },
          ]
        : [
            { degree: 4, suffix: '7' },
            { degree: 0, suffix: '' },
            { degree: 4, suffix: '' },
            { degree: 0, suffix: 'maj7' },
          ];
      chord = pick(lastOpts);
    } else {
      chord = pick(pool);
    }
    chords.push(scale[chord.degree] + chord.suffix);
    barLayout.push(1);

    if (i > 0 && i < barCount - 1 && Math.random() < 0.3) {
      const extra = pick(pool);
      chords.push(scale[extra.degree] + extra.suffix);
      barLayout[barLayout.length - 1]++;
    }
  }

  return { chords, barLayout };
}

export function formatProgression(chords) {
  return chords.join('  ');
}

export { KEYS };

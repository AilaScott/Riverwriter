import { generateProgression, formatProgression } from '../lib/music-theory.js';

export function createChordGen(container) {
  const state = {
    history: [],
    historyIndex: -1,
  };

  const rootSelect = container.querySelector('#chord-root');
  const qualitySelect = container.querySelector('#chord-quality');
  const display = container.querySelector('#chord-display');
  const refreshBtn = container.querySelector('#chord-refresh');
  const backBtn = container.querySelector('#chord-back');

  function getKey() {
    return rootSelect.value + (qualitySelect.value === 'minor' ? 'm' : '');
  }

  function setKey(key) {
    const isMinor = key.endsWith('m');
    rootSelect.value = isMinor ? key.slice(0, -1) : key;
    qualitySelect.value = isMinor ? 'minor' : 'major';
  }

  function generate() {
    const key = getKey();

    const { chords } = generateProgression(key, 4);
    const formatted = formatProgression(chords);

    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    state.history.push({ key, chords, formatted });
    state.historyIndex = state.history.length - 1;

    display.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'fade-in';
    span.textContent = formatted;
    display.appendChild(span);

    backBtn.disabled = state.historyIndex <= 0;
  }

  function goBack() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;

    const entry = state.history[state.historyIndex];
    setKey(entry.key);

    display.innerHTML = '';
    const span = document.createElement('span');
    span.className = 'fade-in';
    span.textContent = entry.formatted;
    display.appendChild(span);

    backBtn.disabled = state.historyIndex <= 0;
  }

  refreshBtn.addEventListener('click', generate);
  backBtn.addEventListener('click', goBack);

  return {
    generate,
    getState() {
      return {
        history: state.history,
        historyIndex: state.historyIndex,
        lastKey: getKey(),
        lastRoot: rootSelect.value,
        lastQuality: qualitySelect.value,
      };
    },
    setState(saved) {
      if (!saved) return;
      if (saved.lastKey) {
        setKey(saved.lastKey);
      } else {
        rootSelect.value = saved.lastRoot || 'C';
        qualitySelect.value = saved.lastQuality || 'major';
      }
      state.history = saved.history || [];
      state.historyIndex = saved.historyIndex ?? -1;
      backBtn.disabled = state.historyIndex <= 0;

      if (state.history.length > 0 && state.historyIndex >= 0) {
        const entry = state.history[state.historyIndex];
        display.innerHTML = '';
        const span = document.createElement('span');
        span.textContent = entry.formatted;
        display.appendChild(span);
      }
    },
  };
}

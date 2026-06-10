const SOUND_PATH = 'sounds/alarm.mp3';

export function createPomodoro(container) {
  const state = {
    mode: 'focus',
    running: false,
    interval: null,
  };

  const label = container.querySelector('.pomo-label');
  const timeDisplay = container.querySelector('#pomo-time');
  const startBtn = container.querySelector('#pomo-start');
  const resetBtn = container.querySelector('#pomo-reset');
  const progressCircle = container.querySelector('.pomo-progress');
  const tardigradeContainer = container.querySelector('#pomo-tardigrade');
  const focusSelect = container.querySelector('#pomo-focus');
  const breakSelect = container.querySelector('#pomo-break');

  const circumference = 2 * Math.PI * 50;

  const img = document.createElement('img');
  img.src = 'tardigrade.png';
  img.alt = 'Tardigrade';
  img.style.cssText = 'width:66px;height:66px;object-fit:contain;display:block';
  tardigradeContainer.appendChild(img);

  const soundPath = SOUND_PATH;

  function getFocusTime() {
    return parseInt(focusSelect.value) * 60;
  }

  function getBreakTime() {
    return parseInt(breakSelect.value) * 60;
  }

  function setTimeLeft(secs) {
    state.timeLeft = secs;
    state.totalTime = secs;
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function setInputsEnabled(enabled) {
    focusSelect.disabled = !enabled;
    breakSelect.disabled = !enabled;
  }

  function updateUI() {
    timeDisplay.textContent = formatTime(state.timeLeft);
    const progress = state.totalTime > 0 ? state.timeLeft / state.totalTime : 0;
    progressCircle.style.strokeDashoffset = circumference * progress;

    if (state.mode === 'break') {
      label.textContent = 'BREAK';
      label.style.color = 'var(--teal)';
      progressCircle.style.stroke = 'var(--teal)';
    } else {
      label.textContent = 'FOCUS';
      label.style.color = 'var(--orange-dark)';
      progressCircle.style.stroke = 'var(--orange-dark)';
    }
  }

  function playSound() {
    const audio = new Audio(soundPath);
    audio.play().catch(() => {});
  }

  function switchMode() {
    if (state.mode === 'focus') {
      state.mode = 'break';
      setTimeLeft(getBreakTime());
    } else {
      state.mode = 'focus';
      setTimeLeft(getFocusTime());
    }
    playSound();
    updateUI();
  }

  function tick() {
    state.timeLeft--;
    updateUI();

    if (state.timeLeft <= 0) {
      clearInterval(state.interval);
      state.interval = null;
      state.running = false;
      startBtn.textContent = '▶';
      switchMode();
    }
  }

  function toggleTimer() {
    if (state.running) {
      clearInterval(state.interval);
      state.interval = null;
      state.running = false;
      startBtn.textContent = '▶';
      setInputsEnabled(true);
    } else {
      setTimeLeft(state.mode === 'focus' ? getFocusTime() : getBreakTime());
      state.interval = setInterval(tick, 1000);
      state.running = true;
      startBtn.textContent = '⏸';
      setInputsEnabled(false);
    }
  }

  function resetTimer() {
    if (state.interval) {
      clearInterval(state.interval);
      state.interval = null;
    }
    state.running = false;
    state.mode = 'focus';
    setTimeLeft(getFocusTime());
    startBtn.textContent = '▶';
    setInputsEnabled(true);
    updateUI();
  }

  progressCircle.style.strokeDasharray = circumference;
  setTimeLeft(getFocusTime());
  updateUI();

  startBtn.addEventListener('click', toggleTimer);
  resetBtn.addEventListener('click', resetTimer);

  return {
    reset: resetTimer,
    getState: () => ({ running: state.running, mode: state.mode }),
  };
}

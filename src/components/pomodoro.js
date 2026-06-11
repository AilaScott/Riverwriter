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

  let popupOverlay = null;
  let popupProgressCircle = null;
  let popupEscapeHandler = null;

  const img = document.createElement('img');
  img.src = 'tardigrade.png';
  img.alt = 'Tardigrade';
  img.style.cssText = 'width:66px;height:66px;object-fit:contain;display:block';
  tardigradeContainer.appendChild(img);

  const soundPath = SOUND_PATH;

  function closeBreakPopup() {
    if (!popupOverlay) return;
    if (popupEscapeHandler) {
      document.removeEventListener('keydown', popupEscapeHandler);
      popupEscapeHandler = null;
    }
    popupOverlay.remove();
    popupOverlay = null;
    popupProgressCircle = null;
  }

  function showBreakPopup() {
    closeBreakPopup();

    const overlay = document.createElement('div');
    overlay.className = 'break-popup-overlay';

    const tardImg = document.createElement('img');
    tardImg.src = 'tardigrade.png';
    tardImg.alt = 'Tardigrade';
    tardImg.style.cssText = 'width:80px;height:80px;object-fit:contain;display:block';

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.style.cssText = 'width:160px;height:160px;display:block';

    const track = document.createElementNS(svgNs, 'circle');
    track.setAttribute('cx', '60');
    track.setAttribute('cy', '60');
    track.setAttribute('r', '50');
    track.setAttribute('fill', 'none');
    track.setAttribute('stroke', '#E8E0D8');
    track.setAttribute('stroke-width', '8');

    const prog = document.createElementNS(svgNs, 'circle');
    prog.setAttribute('cx', '60');
    prog.setAttribute('cy', '60');
    prog.setAttribute('r', '50');
    prog.setAttribute('fill', 'none');
    prog.setAttribute('stroke', 'var(--orange-dark)');
    prog.setAttribute('stroke-width', '8');
    prog.setAttribute('stroke-linecap', 'round');
    prog.setAttribute('stroke-dasharray', circumference);
    prog.setAttribute('transform', 'rotate(-90 60 60)');
    const progress = state.totalTime > 0 ? state.timeLeft / state.totalTime : 0;
    prog.setAttribute('stroke-dashoffset', circumference * progress);

    const fo = document.createElementNS(svgNs, 'foreignObject');
    fo.setAttribute('x', '10');
    fo.setAttribute('y', '10');
    fo.setAttribute('width', '100');
    fo.setAttribute('height', '100');

    const tardDiv = document.createElement('div');
    tardDiv.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center';
    tardDiv.appendChild(tardImg);
    fo.appendChild(tardDiv);

    svg.append(track, prog, fo);

    const circleWrap = document.createElement('div');
    circleWrap.style.cssText = 'display:flex;align-items:center;justify-content:center';
    circleWrap.appendChild(svg);

    const msg = document.createElement('div');
    msg.className = 'break-popup-msg';
    msg.textContent = 'Doing great! Time for a break :)';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'break-popup-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', closeBreakPopup);

    const card = document.createElement('div');
    card.className = 'break-popup';
    card.append(circleWrap, msg, closeBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeBreakPopup();
    });

    const escHandler = (e) => {
      if (e.key === 'Escape') closeBreakPopup();
    };
    document.addEventListener('keydown', escHandler);
    popupEscapeHandler = escHandler;

    popupOverlay = overlay;
    popupProgressCircle = prog;

    requestAnimationFrame(() => {
      overlay.classList.add('visible');
    });
  }

  function getFocusTime() {
    return parseFloat(focusSelect.value) * 60;
  }

  function getBreakTime() {
    return parseFloat(breakSelect.value) * 60;
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

    if (popupProgressCircle) {
      popupProgressCircle.style.strokeDashoffset = circumference * progress;
    }

    label.textContent = state.mode === 'break' ? 'BREAK' : 'FOCUS';
    label.style.color = 'var(--orange-dark)';
    progressCircle.style.stroke = 'var(--orange-dark)';
  }

  function playSound() {
    const audio = new Audio(soundPath);
    audio.play().catch(() => {});
  }

  function switchMode() {
    if (state.mode === 'focus') {
      state.mode = 'break';
      state.running = true;
      setTimeLeft(getBreakTime());
      showBreakPopup();
      state.interval = setInterval(tick, 1000);
      startBtn.textContent = '⏸';
      setInputsEnabled(false);
    } else {
      state.mode = 'focus';
      setTimeLeft(getFocusTime());
      closeBreakPopup();
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
    closeBreakPopup();
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

export function createRecorder(container) {
  const recBtn = container.querySelector('#rec-btn');
  const playBtn = container.querySelector('#play-btn');
  const playback = container.querySelector('#record-playback');
  const waveform = container.querySelector('#record-waveform');
  const bars = waveform.querySelectorAll('span');
  const playbackBar = container.querySelector('#playback-bar');
  const playbackTime = container.querySelector('#playback-time');
  const playbackFill = container.querySelector('#playback-fill');

  let mediaRecorder = null;
  let stream = null;
  let chunks = [];
  let recording = false;
  let currentBlob = null;
  let audioContext = null;
  let analyser = null;
  let animFrameId = null;
  let dataArray = null;

  function draw() {
    analyser.getByteFrequencyData(dataArray);
    const binSize = dataArray.length / bars.length;
    for (let i = 0; i < bars.length; i++) {
      let sum = 0;
      for (let j = 0; j < binSize; j++) {
        sum += dataArray[i * binSize + j];
      }
      const avg = sum / binSize;
      const height = Math.max(4, (avg / 255) * 40);
      bars[i].style.height = height + 'px';
    }
    animFrameId = requestAnimationFrame(draw);
  }

  function resetWaveform() {
    for (const bar of bars) {
      bar.style.height = '4px';
    }
  }

  function formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updatePlaybackUI() {
    if (!playback.duration) return;
    const cur = playback.currentTime;
    const dur = playback.duration;
    playbackTime.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
    playbackFill.style.width = `${(cur / dur) * 100}%`;
  }

  async function startRecording() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      chunks = [];

      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
      source.connect(analyser);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        currentBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(currentBlob);
        playback.src = url;
        playBtn.disabled = false;
        playBtn.classList.add('enabled');
        playbackBar.style.display = 'flex';
        playbackTime.textContent = '0:00 / 0:00';
        playbackFill.style.width = '0%';
        playback.addEventListener('loadedmetadata', updatePlaybackUI);
        playback.addEventListener('timeupdate', updatePlaybackUI);
        playback.addEventListener('ended', () => {
          playback.currentTime = 0;
          updatePlaybackUI();
        });

        stream.getTracks().forEach(t => t.stop());
        stream = null;
      };

      mediaRecorder.start();
      recording = true;
      recBtn.textContent = '■';
      recBtn.classList.add('active');
      playBtn.disabled = true;
      playbackBar.style.display = 'none';
      draw();
    } catch (err) {
      console.warn('Recording error:', err);
    }
  }

  function stopRecording() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (audioContext) {
      audioContext.close();
      audioContext = null;
    }
    analyser = null;
    dataArray = null;
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    recording = false;
    recBtn.textContent = '●';
    recBtn.classList.remove('active');
    resetWaveform();
  }

  function toggleRecording() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function playRecording() {
    if (playback.src) {
      playback.currentTime = 0;
      playback.play().catch(() => {});
    }
  }

  recBtn.addEventListener('click', toggleRecording);
  playBtn.addEventListener('click', playRecording);

  return {
    isRecording: () => recording,
    getBlob: () => currentBlob,
  };
}

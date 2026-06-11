import { createPomodoro } from './components/pomodoro.js';
import { createEditor } from './components/editor.js';
import { createChordGen } from './components/chord-gen.js';
import { createRecorder } from './components/recorder.js';
import { saveRecording, loadRecording, deleteRecording } from './lib/audio-storage.js';
import { createSettings } from './components/settings.js';
import {
  getIndex, getActiveSong, setActiveSong, updateActiveSong,
  createSong, deleteSong, exportSong, importSongFromFile,
  migrateOldSave, updateStreak,
} from './lib/storage.js';

let saveTimeout = null;
let currentSongId = null;
let editor, chordGen, recorder;

function debounceAutoSave(fn, ms = 500) {
  return (...args) => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => fn(...args), ms);
  };
}

function doAutoSave() {
  if (!currentSongId) return;
  const sections = editor.getSections();
  const chordState = chordGen.getState();
  updateActiveSong({ editorSections: sections, chordGen: chordState });
}

function populateSongSelect(select, songs, activeId) {
  select.innerHTML = '';
  songs.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
  select.value = activeId || '';
}

async function loadSong(song) {
  if (!song) return;
  currentSongId = song.id;

  if (song.editorSections && song.editorSections.length > 0) {
    editor.loadSections(song.editorSections);
  } else {
    editor.clear();
    editor.addSection({ header: 'Verse 1' });
  }

  if (song.chordGen) {
    chordGen.setState(song.chordGen);
  } else {
    chordGen.setState(null);
  }

  if (recorder) {
    const blob = await loadRecording(song.id);
    recorder.loadBlob(blob);
  }
}

async function init() {
  const pomoBox = document.getElementById('pomo-box');
  const editorBox = document.getElementById('editor-box');
  const chordBox = document.getElementById('chord-box');
  const recordBox = document.getElementById('record-box');

  const pomodoro = createPomodoro(pomoBox);
  editor = createEditor(editorBox, debounceAutoSave(doAutoSave));
  chordGen = createChordGen(chordBox);
  recorder = createRecorder(recordBox, (blob) => {
    if (currentSongId) {
      saveRecording(currentSongId, blob);
    }
  });

  const streakEl = document.getElementById('pomo-streak');
  const streakCount = updateStreak();
  const emotes = [':3', '<3', ':)', ':))', '>:)'];
  const emoteIdx = (streakCount - 1) % emotes.length;
  const emote = emotes[emoteIdx];
  streakEl.textContent = streakCount > 0
    ? `${emote} ${streakCount}-day streak`
    : `${emote} Start your streak!`;

  migrateOldSave();

  let idx = getIndex();
  let activeSong = getActiveSong();
  if (!idx || !activeSong) {
    activeSong = createSong('Untitled Song');
    idx = getIndex();
  }

  const songSelect = document.getElementById('song-select');
  populateSongSelect(songSelect, idx.songs, activeSong.id);
  await loadSong(activeSong);

  songSelect.addEventListener('change', async () => {
    doAutoSave();
    if (currentSongId && recorder.getBlob()) {
      await saveRecording(currentSongId, recorder.getBlob());
    }
    const ix = getIndex();
    const song = ix.songs.find(s => s.id === songSelect.value);
    if (song) {
      setActiveSong(song.id);
      await loadSong(song);
    }
  });

  document.getElementById('song-new').addEventListener('click', async () => {
    const name = prompt('Song name:');
    if (name === null) return;
    const cleaned = name.trim() || 'Untitled Song';
    if (currentSongId && recorder.getBlob()) {
      await saveRecording(currentSongId, recorder.getBlob());
    }
    doAutoSave();
    createSong(cleaned);
    const ix = getIndex();
    populateSongSelect(songSelect, ix.songs, ix.activeSongId);
    await loadSong(getActiveSong());
  });

  document.getElementById('song-del').addEventListener('click', async () => {
    const ix = getIndex();
    if (!ix || ix.songs.length <= 1) return;
    if (!confirm('Delete this song?')) return;
    doAutoSave();
    await deleteRecording(currentSongId);
    deleteSong(currentSongId);
    const ix2 = getIndex();
    populateSongSelect(songSelect, ix2.songs, ix2.activeSongId);
    await loadSong(getActiveSong());
  });

  const importInput = document.getElementById('import-input');
  document.getElementById('import-btn').addEventListener('click', () => {
    importInput.click();
  });
  importInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const song = await importSongFromFile(data, file.name);
        const ix = getIndex();
        populateSongSelect(songSelect, ix.songs, song.id);
        await loadSong(song);
      } catch (err) {
        console.warn('Import error:', err);
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });

  document.getElementById('export-btn').addEventListener('click', async () => {
    doAutoSave();
    const ix = getIndex();
    const song = ix.songs.find(s => s.id === currentSongId);
    if (song) {
      const blob = recorder.getBlob();
      exportSong(song, blob);
    }
  });

  const saveBtn = document.getElementById('save-btn');
  const SAVE_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 4L6 12l-3-3"/></svg>';
  saveBtn.addEventListener('click', () => {
    doAutoSave();
    saveBtn.innerHTML = '✓ Saved';
    setTimeout(() => { saveBtn.innerHTML = SAVE_ICON + ' Save'; }, 1500);
  });

  createSettings();
}

document.addEventListener('DOMContentLoaded', init);

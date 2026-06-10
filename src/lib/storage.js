const SONGS_KEY = 'riverwriter-songs';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function emptySong(name) {
  return {
    id: uid(),
    name: name || 'Untitled Song',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editorSections: [{ header: 'Verse 1', chordLine: '', lyricLine: '' }],
    chordGen: {
      history: [], historyIndex: -1,
      lastKey: 'C',
    },
  };
}

export function getIndex() {
  try {
    const raw = localStorage.getItem(SONGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveIndex(idx) {
  try { localStorage.setItem(SONGS_KEY, JSON.stringify(idx)); }
  catch (e) { console.warn('save failed:', e); }
}

export function getActiveSong() {
  const idx = getIndex();
  if (!idx || !idx.songs || idx.songs.length === 0) return null;
  return idx.songs.find(s => s.id === idx.activeSongId) || idx.songs[0];
}

export function setActiveSong(id) {
  const idx = getIndex();
  if (!idx) return;
  idx.activeSongId = id;
  saveIndex(idx);
}

export function updateActiveSong(data) {
  const idx = getIndex();
  if (!idx) return;
  const song = idx.songs.find(s => s.id === idx.activeSongId);
  if (!song) return;
  song.editorSections = data.editorSections;
  song.chordGen = data.chordGen;
  song.updatedAt = new Date().toISOString();
  saveIndex(idx);
}

export function createSong(name) {
  const idx = getIndex() || { activeSongId: null, songs: [] };
  const song = emptySong(name);
  idx.songs.push(song);
  idx.activeSongId = song.id;
  saveIndex(idx);
  return song;
}

export function deleteSong(id) {
  const idx = getIndex();
  if (!idx) return;
  idx.songs = idx.songs.filter(s => s.id !== id);
  if (idx.songs.length === 0) {
    const song = emptySong('Untitled Song');
    idx.songs.push(song);
    idx.activeSongId = song.id;
  } else if (idx.activeSongId === id) {
    idx.activeSongId = idx.songs[0].id;
  }
  saveIndex(idx);
}

export function exportSong(song) {
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    name: song.name,
    sections: song.editorSections,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${song.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importSongFromFile(data, fileName) {
  let sections = [];
  let name = fileName.replace(/\.json$/i, '').replace(/[_-]/g, ' ') || 'Imported Song';

  if (Array.isArray(data)) {
    sections = data;
  } else if (data && Array.isArray(data.sections)) {
    sections = data.sections;
    if (data.name) name = data.name;
  } else {
    throw new Error('Invalid import format');
  }

  const sanitized = sections.map(s => ({
    header: s.header || '',
    chordLine: s.chordLine || '',
    lyricLine: s.lyricLine || '',
  }));
  if (sanitized.length === 0) sanitized.push({ header: 'Verse 1', chordLine: '', lyricLine: '' });

  const idx = getIndex() || { activeSongId: null, songs: [] };
  const song = emptySong(name);
  song.editorSections = sanitized;
  song.chordGen = { history: [], historyIndex: -1, lastKey: 'C' };
  idx.songs.push(song);
  idx.activeSongId = song.id;
  saveIndex(idx);
  return song;
}

export function migrateOldSave() {
  try {
    const old = localStorage.getItem('riverwriter-save');
    if (!old) return;
    const data = JSON.parse(old);
    const sections = (data.editorSections || []).map(s => ({
      header: s.header || '',
      chordLine: s.chordLine || '',
      lyricLine: s.lyricLine || '',
    }));
    if (sections.length === 0) sections.push({ header: 'Verse 1', chordLine: '', lyricLine: '' });

    const idx = getIndex();
    if (idx && idx.songs && idx.songs.length > 0) {
      idx.songs.push(emptySong('Imported Song'));
      const song = idx.songs[idx.songs.length - 1];
      song.editorSections = sections;
      song.chordGen = data.chordGen || song.chordGen;
      idx.activeSongId = song.id;
      saveIndex(idx);
    } else {
      const song = emptySong('Imported Song');
      song.editorSections = sections;
      song.chordGen = data.chordGen || song.chordGen;
      saveIndex({ activeSongId: song.id, songs: [song] });
    }
    localStorage.removeItem('riverwriter-save');
  } catch { /* ignore migration failures */ }
}

const STREAK_KEY = 'riverwriter-streak';

export function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  let streak;
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    streak = raw ? JSON.parse(raw) : null;
  } catch { streak = null; }

  if (!streak) {
    streak = { lastDate: today, count: 1 };
  } else if (streak.lastDate !== today) {
    const last = new Date(streak.lastDate + 'T00:00:00');
    const now = new Date(today + 'T00:00:00');
    const diff = Math.round((now - last) / (1000 * 60 * 60 * 24));
    streak.count = diff === 1 ? streak.count + 1 : 1;
    streak.lastDate = today;
  }

  try { localStorage.setItem(STREAK_KEY, JSON.stringify(streak)); }
  catch {}
  return streak.count;
}

const SETTINGS_KEY = 'riverwriter-settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { theme: 'default', customBg: null };
  } catch {
    return { theme: 'default', customBg: null };
  }
}

export function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  catch (e) { console.warn('settings save failed:', e); }
}

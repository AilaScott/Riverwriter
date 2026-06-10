# RiverWriter — Agent Guide

## Overview
A single-page songwriting drafting tool for Linux (Electron) with a tardigrade mascot, orange gradient theme, and four panels in a CSS Grid layout (pomodoro, editor, right column with record + chord).

## Tech Stack
- **Bundler**: Vite 6 (vanilla JS, no framework)
- **Font**: Inter (Google Fonts)
- **Timer**: SVG circle with stroke-dasharray
- **Audio**: Web Audio API / MediaRecorder + AnalyserNode (real-time waveform)
- **Persistence**: localStorage (three keys)
- **Desktop**: Electron 35 + electron-builder (targets: .deb, Flatpak)
- **Sound**: MP3 file at `public/sounds/alarm.mp3` (user-provided)

## Architecture

### Layout (3-column CSS Grid)
```
┌─────────┬──────────────────────┬────────────────┐
│ Pomodoro│                      │  Right Column  │
│ Timer   │   Song Editor        │ ┌────────────┐ │
│         │   (sections with     │ │ Record Box │ │
│         │    headers, chords,  │ │ (waveform) │ │
│         │    lyrics)           │ ├────────────┤ │
├─────────┤                      │ │ Chord Ideas│ │
│ Streak  │                      │ │ (root+qual)│ │
└─────────┴──────────────────────┴ └────────────┘ │
                                          └────────────────┘
```

### Data flow
```
main.js (init)
  ├── createPomodoro(pomoBox)         → independent timer loop
  ├── createEditor(editorBox, onChange)→ reads/writes DOM, calls onChange
  ├── createChordGen(chordBox)        → generates + stores history in memory
  ├── createRecorder(recordBox)       → Web Audio API, waveform + playback bar
  ├── createSettings()                → gear button, theme swatches, custom bg
  ├── migrateOldSave()                → one-time: converts old localStorage key
  ├── getIndex() / getActiveSong()    → loads song list from localStorage
  ├── populateSongSelect()            → fills <select> with song names
  ├── loadSong()                      → pushes data into editor + chordGen
  └── event listeners wire buttons    → create/delete/switch/import/export songs
```

### localStorage keys
| Key | Format | Purpose |
|---|---|---|
| `riverwriter-songs` | `{ activeSongId, songs: [...] }` | All song data (editor + chordGen per song) |
| `riverwriter-streak` | `{ lastDate, count }` | Daily usage streak (timer-agnostic) |
| `riverwriter-settings` | `{ theme, customBg }` | Theme preset + custom background URL |

### Song data model (inside `riverwriter-songs.songs[]`)
```js
{
  id: "k8f3m2a9x1b",
  name: "My Song",
  createdAt: "2026-...",
  updatedAt: "2026-...",
  editorSections: [
    { header: "Verse 1", chordLine: "C  G  Am  F", lyricLine: "Lyrics here..." }
  ],
  chordGen: {
    history: [{ key, chords, formatted }],
    historyIndex: 2,
    lastKey: "G"
  }
}
```

### Export/Import JSON format
```json
{ "version": 2, "exportedAt": "2026-...", "name": "My Song", "sections": [...] }
```

## File-by-file breakdown

### Root
- **`index.html`** — Entry point. Defines the 4-panel grid layout, all elements by ID. Right column wraps record + chord in a `.right-col` div. Don't add new UI elements here without also adding their CSS and JS bindings.
- **`package.json`** — Scripts (dev/build/electron), electron-builder config for .deb + Flatpak, Vite devDep only.
- **`vite.config.js`** — Sets `base: './'` (needed for Electron file:// loading), dev server on port 3000.

### `src/`
- **`main.js`** — Orchestrator. Creates all 4 components + settings, wires song management, handles auto-save via debounce. The only file that imports from both components/ and lib/.
- **`styles.css`** — All styling. CSS custom properties for theming. Responsive breakpoint at 960px. `.fade-in` animation class used by editor and chord-gen.

### `src/lib/`
- **`storage.js`** — All localStorage persistence. 12 exported functions. Song CRUD, import/export helpers, streak tracking, old-save migration, settings load/save. `uid()` generates IDs from timestamp + random. `emptySong()` creates a default song object. No UI logic.
- **`music-theory.js`** — Chord generation engine. All 12 major + 12 minor keys. Weighted pool favors triads and 7ths (duplicated), with lighter weight on 9ths and add9s. First chord always I, last chord tends toward V7 or I. Output formatted as `Cmaj7  Dm7  G7  Cmaj7` (space-separated, no bars).
- **`themes.js`** — Theme definitions (7 presets: default/forest/ocean/sunset/mono/red/black). `applyTheme()` sets `--orange-dark`/`--orange-light` CSS vars on `:root`. `applyCustomBg()` sets body background with dark overlay.

### `src/components/`
- **`pomodoro.js`** — 30min focus / 10min break timer (adjustable via dropdown selects). SVG circle countdown using stroke-dashoffset. Tardigrade image loaded from `public/tardigrade.png`. Sound plays on mode switch. FOCUS label uses `--orange-dark` inline style. The `SOUND_PATH` constant is the single place to change the sound file.
- **`editor.js`** — Structured sections with 3 contenteditable divs (header bold, chord line monospace, lyrics regular). Add/remove sections. `onChange` callback fires on any input for auto-save. `getSections()` serializes DOM to array.
- **`chord-gen.js`** — Dropdowns for root + quality (no bars/time-sig). Refresh/Back buttons. History stack stored in memory (not in DOM). Label reads "CHORD IDEAS". `getState()`/`setState()` for serialization.
- **`recorder.js`** — MediaRecorder API with real-time waveform (AnalyserNode, 5 orange bars). Record/Stop. Custom orange playback bar with progress fill. Orange pulse animation while recording. Blob stored in memory only.
- **`settings.js`** — Fixed gear button (bottom-left). Popup overlay with 7 theme swatches and custom background URL input. Closes on click-outside or Escape. Theme + background persisted to `riverwriter-settings`.

### `electron/`
- **`main.js`** — Creates a BrowserWindow, loads Vite dev server or dist/index.html. Placeholder for future native file dialog IPC.
- **`preload.js`** — contextBridge with placeholder `saveFile`/`loadFile` IPC. Currently unused.

### `scripts/`
- **`generate-sound.js`** — Deprecated (previously generated placeholder WAV). `alarm.mp3` is now user-provided.

### `public/`
- **`tardigrade.png`** — The tardigrade mascot. Loaded by pomodoro.js as an `<img>`.
- **`sounds/alarm.mp3`** — Timer alarm sound. Replace the file at this path to customize.

## Component APIs (for wiring)

### `createPomodoro(container)` → `{ reset, getState }`
- `reset()`: Stops timer, resets to focus 30:00.
- `getState()`: `{ running: bool, mode: 'focus'|'break' }`

### `createEditor(container, onChange)` → `{ addSection, getSections, loadSections, clear }`
- `addSection(data?)`: Appends a section with optional `{ header, chordLine, lyricLine }`.
- `getSections()`: Returns `[{ header, chordLine, lyricLine }]` from DOM.
- `loadSections(arr)`: Clears and rebuilds from data array.
- `clear()`: Removes all sections.

### `createChordGen(container)` → `{ generate, getState, setState }`
- `generate()`: Creates new progression from current dropdown values.
- `getState()`: Returns `{ history, historyIndex, lastKey, lastRoot, lastQuality }`.
- `setState(saved)`: Restores from saved state object.

### `createRecorder(container)` → `{ isRecording, getBlob }`
- `isRecording()`: Bool.
- `getBlob()`: The current recording as a Blob, or null.

## DO conventions
- Use `querySelector('#id')` for known elements (performance)
- Use CSS custom properties from `:root` for colors/spacing
- Add `.fade-in` class to new dynamically inserted content
- Wrap localStorage reads in try/catch
- Keep components self-contained (no cross-component imports)
- Use `debounceAutoSave` (500ms) for auto-save triggers
- Add new public assets to `public/` folder (served as root)
- Use inline SVGs with `currentColor` for themable icons

## DO NOT conventions
- Do NOT add frameworks (React, Vue, etc.) — this is intentionally vanilla
- Do NOT save timer state to localStorage
- Do NOT import components into each other (they communicate through main.js)
- Do NOT use server-side logic
- Do NOT modify `prompt()` / `confirm()` dialogs — they're used for song name and delete confirmation
- Do NOT remove the `base: './'` in vite.config.js (Electron needs relative paths)
- Do NOT use `localStorage` keys other than `riverwriter-songs`, `riverwriter-streak`, and `riverwriter-settings`
- Do NOT use emoji in buttons (use SVGs with `currentColor` for theme compatibility)
- Do NOT remove `.right-col` wrapper — record + chord depend on it for desktop layout

## Common commands
```bash
npm run dev           # Dev server at localhost:3000
npm run build         # Production build to dist/
npm run electron:dev  # Build + launch Electron
npm run electron:build:deb     # Package as .deb
npm run electron:build:flatpak # Package as Flatpak
npm run deploy        # Build + push dist/ to Neocities (requires `neocities login` first)
```

## First-time agent setup
1. Read this file first.
2. Run `npm run dev` to preview changes live.
3. After making changes, run `npm run build` to verify.
4. For UI changes, check both desktop (>960px) and mobile (<960px) layouts.
5. New themes go in `src/lib/themes.js` — add entry to `THEMES` object with `{ name, dark, light }`.

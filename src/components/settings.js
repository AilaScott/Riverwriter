import { THEMES, applyTheme, applyCustomBg } from '../lib/themes.js';
import { loadSettings, saveSettings } from '../lib/storage.js';

export function createSettings() {
  const btn = document.getElementById('settings-icon');

  const overlay = document.createElement('div');
  overlay.className = 'settings-overlay';
  overlay.id = 'settings-overlay';

  const popup = document.createElement('div');
  popup.className = 'settings-popup';

  popup.innerHTML = `
    <div class="settings-title">Settings</div>

    <div class="settings-section">
      <div class="settings-label">Change Theme</div>
      <div class="theme-swatches" id="theme-swatches"></div>
    </div>

    <div class="settings-section">
      <div class="settings-label">Custom Background</div>
      <div class="settings-bg-row">
        <input type="url" class="settings-input" id="settings-bg-input" placeholder="https://example.com/image.jpg">
        <button class="tb-btn" id="settings-bg-apply">Apply</button>
        <button class="tb-btn" id="settings-bg-clear">Clear</button>
      </div>
    </div>

    <div class="settings-footer">Made by Aila Scott — <a href="http://aila.dance" target="_blank" rel="noopener">aila.dance</a></div>
  `;

  overlay.appendChild(popup);
  document.body.appendChild(overlay);

  const swatches = popup.querySelector('#theme-swatches');
  const bgInput = popup.querySelector('#settings-bg-input');
  const bgApply = popup.querySelector('#settings-bg-apply');
  const bgClear = popup.querySelector('#settings-bg-clear');

  const settings = loadSettings();
  let currentTheme = settings.theme;

  function renderSwatches() {
    swatches.innerHTML = '';
    Object.entries(THEMES).forEach(([id, theme]) => {
      const swatch = document.createElement('button');
      swatch.className = 'theme-swatch' + (id === currentTheme ? ' active' : '');
      swatch.style.background = theme.dark;
      swatch.setAttribute('data-theme', id);
      swatch.title = theme.name;
      swatch.addEventListener('click', () => {
        currentTheme = id;
        applyTheme(id);
        saveSettings({ theme: id, customBg: bgInput.value || null });
        renderSwatches();
      });
      swatches.appendChild(swatch);
    });
  }

  function open() {
    const s = loadSettings();
    bgInput.value = s.customBg || '';
    renderSwatches();
    overlay.style.display = 'flex';
  }

  function close() {
    overlay.style.display = 'none';
  }

  btn.addEventListener('click', open);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display === 'flex') close();
  });

  bgApply.addEventListener('click', () => {
    const url = bgInput.value.trim();
    if (!url) return;
    applyCustomBg(url);
    saveSettings({ theme: currentTheme, customBg: url });
  });

  bgClear.addEventListener('click', () => {
    bgInput.value = '';
    applyCustomBg(null);
    saveSettings({ theme: currentTheme, customBg: null });
  });

  if (settings.customBg) {
    bgInput.value = settings.customBg;
    applyCustomBg(settings.customBg);
  }

  applyTheme(currentTheme);
  overlay.style.display = 'none';
}

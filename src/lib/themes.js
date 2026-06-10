export const THEMES = {
  default: { name: 'Default', dark: '#FF6B35', light: '#FFB347' },
  forest:  { name: 'Forest',  dark: '#2D6A4F', light: '#52B788' },
  ocean:   { name: 'Ocean',   dark: '#0077B6', light: '#48CAE4' },
  sunset:  { name: 'Sunset',  dark: '#9B5DE5', light: '#F15BB5' },
  mono:    { name: 'Mono',    dark: '#555555', light: '#999999' },
  red:     { name: 'Red',     dark: '#D32F2F', light: '#FF8A80' },
  black:   { name: 'Black',   dark: '#1A1A1A', light: '#666666' },
};

export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.default;
  document.documentElement.style.setProperty('--orange-dark', theme.dark);
  document.documentElement.style.setProperty('--orange-light', theme.light);
}

export function applyCustomBg(url) {
  if (!url) {
    document.body.style.background = '';
    document.body.style.backgroundAttachment = 'fixed';
    return;
  }
  document.body.style.background =
    `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url("${url}") center / cover fixed`;
}

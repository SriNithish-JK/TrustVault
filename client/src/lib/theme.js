// Dark (default) / light, remembered per browser. The class lives on <html>.
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode: fine */ } },
};
export { store };

export const currentTheme = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');
export const initialTheme = () => store.get('tv-aurora-theme') || 'dark';
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  store.set('tv-aurora-theme', theme);
  window.dispatchEvent(new Event('tv-theme'));
}

import store from 'store2';

const systemDarkModeEnabled = window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = store('theme') || (systemDarkModeEnabled ? 'dark' : 'light');
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
}

export function createSettingStore() {
  return {
    theme,
    
    setTheme(theme: 'dark' | 'light') {
      this.theme = theme;
      store('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },

    get isDarkMode() {
      return this.theme === 'dark';
    }
  };
}

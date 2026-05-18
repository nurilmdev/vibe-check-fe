import { ref, onMounted, watch } from 'vue';

const THEME_KEY = 'vue-theme';

export function useTheme() {
  const isDark = ref(false);

  onMounted(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      isDark.value = savedTheme === 'dark';
    } else {
      // Check system preference
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    applyTheme(isDark.value);
  });

  watch(isDark, (newVal) => {
    localStorage.setItem(THEME_KEY, newVal ? 'dark' : 'light');
    applyTheme(newVal);
  });

  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    isDark.value = !isDark.value;
  };

  return {
    isDark,
    toggleTheme,
  };
}

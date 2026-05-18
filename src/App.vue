<template>
  <RouterView v-slot="{ Component }">
    <KeepAlive include="HomeView">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>

<script setup>
import { RouterView } from 'vue-router';
import { provide } from 'vue';
import { useTheme } from '@/composables/useTheme';

const { isDark, toggleTheme } = useTheme();

provide('theme', { isDark, toggleTheme });
</script>

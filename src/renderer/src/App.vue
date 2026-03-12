<script setup>
import { ref, onMounted } from 'vue'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import Home from './components/Home.vue'

const theme = ref('light')
const currentView = ref('home') // Default view is home

const handleThemeChange = (newTheme) => {
  theme.value = newTheme
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else {
    document.documentElement.classList.remove('dark-theme')
  }
}

onMounted(() => {
  // Initialize theme if needed
})
</script>

<template>
  <div class="app-container">
    <TitleBar @theme-change="handleThemeChange" />
    <div class="main-layout">
      <Sidebar @navigate="view => currentView = view" />
      <main class="content">
        <Home v-if="currentView === 'home'" />
        <div v-else class="placeholder-view">
          <h1>{{ currentView.toUpperCase() }} 页面</h1>
          <p>正在开发中...</p>
        </div>
      </main>
    </div>
  </div>
</template>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--color-background);
  color: var(--color-text);
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden; /* 确保内容区也不出现滚动条 */
  background-color: var(--color-background);
}

.placeholder-view {
  text-align: center;
}
</style>

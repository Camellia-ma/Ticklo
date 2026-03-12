<script setup>
import { ref, onMounted } from 'vue'
import TitleBar from './components/TitleBar.vue'
import Sidebar from './components/Sidebar.vue'
import Home from './components/Home.vue'
import Settings from './components/Settings.vue'
import TodoList from './components/TodoList.vue'

const theme = ref('light')
const currentView = ref('home') // Default view is home

const handleThemeChange = (newTheme) => {
  theme.value = newTheme
  // 移除所有可能的主题类
  document.documentElement.classList.remove('dark-theme', 'glass-theme')
  
  // 根据新主题添加对应的类
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark-theme')
  } else if (newTheme === 'glass') {
    document.documentElement.classList.add('glass-theme')
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
        <TodoList v-else-if="currentView === 'todos'" />
        <Settings 
          v-else-if="currentView === 'settings'" 
          :current-theme="theme"
          @update:theme="handleThemeChange"
        />
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
  background-color: transparent; /* 改为透明，允许 body 的渐变透出来 */
  color: var(--color-text);
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  background-color: transparent; /* 改为透明 */
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column; /* 确保子元素占满 */
  /* align-items: center; */
  /* justify-content: center; */
  overflow-y: auto; /* 允许垂直滚动 */
  overflow-x: hidden; /* 禁止水平滚动 */
  background-color: transparent; /* 改为透明 */
}

/* 隐藏滚动条但保留滚动功能 */
.content::-webkit-scrollbar {
  display: none;
}

.placeholder-view {
  text-align: center;
}
</style>

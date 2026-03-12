<script setup>
import { ref, onMounted } from 'vue'
import ThemeSwitch from './ThemeSwitch.vue'

const emit = defineEmits(['theme-change'])
const isMaximized = ref(false)

const handleThemeChange = (theme) => {
  emit('theme-change', theme)
}

const handleMinimize = () => {
  window.api.minimize()
}

const handleMaximize = () => {
  window.api.maximize()
}

const handleClose = () => {
  window.api.close()
}

onMounted(() => {
  window.api.onMaximizedStatus((status) => {
    isMaximized.value = status
  })
})
</script>

<template>
  <div class="title-bar">
    <div class="drag-region"></div>
    <div class="left-controls">
      <ThemeSwitch @update:theme="handleThemeChange" />
    </div>
    <div class="title">天工开物</div>
    <div class="controls">
      <div class="control-button minimize" @click="handleMinimize">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="0" y1="5" x2="10" y2="5" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </div>
      <div class="control-button maximize" @click="handleMaximize">
        <svg v-if="!isMaximized" width="10" height="10" viewBox="0 0 10 10">
          <rect x="0.75" y="0.75" width="8.5" height="8.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <svg v-else width="10" height="10" viewBox="0 0 10 10">
          <rect x="2.75" y="0.75" width="6.5" height="6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
          <path d="M0.75,2.75 v6.5 h6.5 v-6.5 h-6.5" fill="none" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </div>
      <div class="control-button close" @click="handleClose">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M0,0 L10,10 M0,10 L10,0" stroke="currentColor" stroke-width="1.5" />
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.title-bar {
  height: 32px;
  background: var(--color-background);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  user-select: none;
  color: var(--color-text);
  font-family: "Segoe UI", "Microsoft YaHei", sans-serif;
  font-size: 12px;
  border-bottom: 1px solid var(--color-border);
}

.drag-region {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
  z-index: -1;
}

.left-controls {
  position: absolute;
  left: 12px; /* 增加一点边距 */
  top: 0;
  height: 100%;
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.title {
  pointer-events: none;
  font-weight: 600;
}

.controls {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  display: flex;
  -webkit-app-region: no-drag;
}

.control-button {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  cursor: default;
  color: var(--color-text);
}

.control-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.control-button.close:hover {
  background-color: #e81123;
  color: white;
}

.control-button.close:active {
  background-color: #f1707a;
  color: white;
}

.control-button:active {
  background-color: rgba(0, 0, 0, 0.1);
}
</style>

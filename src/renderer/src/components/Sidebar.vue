<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isCollapsed = ref(false)
const currentTime = ref('')
const currentDate = ref('')
let timer = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  currentDate.value = `${month}/${day}`
}

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const menuItems = [
  { id: 'home', label: '首页', icon: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' },
  { id: 'search', label: '搜索', icon: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' },
  { id: 'settings', label: '设置', icon: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z' }
]

const emit = defineEmits(['navigate'])
const activeId = ref('home')

const selectItem = (id) => {
  activeId.value = id
  emit('navigate', id)
}
</script>

<template>
  <aside :class="['sidebar', { collapsed: isCollapsed }]">
    <div class="sidebar-header">
      <button class="toggle-btn" @click="toggleSidebar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
    
    <nav class="sidebar-menu">
      <div 
        v-for="item in menuItems" 
        :key="item.id"
        :class="['menu-item', { active: activeId === item.id }]"
        @click="selectItem(item.id)"
      >
        <div class="icon-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path :d="item.icon" />
          </svg>
        </div>
        <span class="label" v-show="!isCollapsed">{{ item.label }}</span>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="system-time">
        <div class="time-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="time-info" v-show="!isCollapsed">
          <span class="date-text">{{ currentDate }}</span>
          <span class="time-text">{{ currentTime }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 200px;
  height: 100%;
  background-color: var(--color-background-soft);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-right: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 15px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.sidebar-menu {
  flex: 1;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  height: 40px;
  margin: 0 8px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-text);
  opacity: 0.7;
  white-space: nowrap;
}

.menu-item:hover {
  background-color: rgba(128, 128, 128, 0.1);
  color: var(--color-text);
  opacity: 1;
}

.menu-item.active {
  background-color: rgba(128, 128, 128, 0.15);
  color: var(--color-text);
  opacity: 1;
  font-weight: 600;
}

.icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.sidebar.collapsed .icon-wrapper {
  margin-right: 0;
}

.label {
  font-size: 14px;
  opacity: 1;
  transition: opacity 0.2s;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid var(--color-border);
}

.system-time {
  height: auto;
  min-height: 48px;
  display: flex;
  align-items: center;
  padding: 8px;
  color: var(--color-text);
  opacity: 0.9;
}

.sidebar.collapsed .system-time {
  justify-content: center;
  padding: 8px 0;
}

.time-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.sidebar.collapsed .time-icon {
  margin-right: 0;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Segoe UI', 'Consolas', monospace;
}

.date-text {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.time-text {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}
</style>

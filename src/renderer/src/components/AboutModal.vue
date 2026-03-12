<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const appInfo = ref({
  name: 'Ticklo',
  version: '1.0.0'
})

onMounted(async () => {
  if (window.api && window.api.getAppInfo) {
    const info = await window.api.getAppInfo()
    appInfo.value = info
  }
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content macos-card">
      <div class="card-header">
        <div class="card-title">关于 Ticklo</div>
        <button class="close-btn" @click="handleClose">&times;</button>
      </div>
      
      <div class="about-body">
        <div class="logo-section">
          <!-- 简单的 Logo 占位 -->
          <div class="app-logo">T</div>
          <h2 class="app-name">{{ appInfo.name }}</h2>
          <p class="app-version">Version {{ appInfo.version }}</p>
        </div>
        
        <div class="info-section">
          <p>Ticklo 是一个极简风格的打卡与待办事项管理应用，助你专注于重要之事。</p>
          <p class="copyright">© 2024 Ticklo Team. All rights reserved.</p>
        </div>
        
        <div class="links-section">
          <a href="#" class="link-btn">检查更新</a>
          <a href="https://github.com/your-repo/ticklo" target="_blank" class="link-btn secondary">GitHub</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 弹窗基础样式 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 360px;
  background-color: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:global(.glass-theme) .modal-content {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  backdrop-filter: none;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.card-header {
  height: 36px;
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.7;
}

.close-btn {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.5;
  color: var(--color-text);
}

.about-body {
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.app-logo {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #00a6ff, #0072ff);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  color: white;
  box-shadow: 0 8px 20px rgba(0, 166, 255, 0.3);
}

.app-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.app-version {
  margin: 0;
  font-size: 12px;
  opacity: 0.5;
}

.info-section {
  font-size: 13px;
  line-height: 1.5;
  opacity: 0.8;
}

.copyright {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 8px;
}

.links-section {
  display: flex;
  gap: 12px;
  width: 100%;
}

.link-btn {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  background-color: var(--color-background-soft);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.link-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.link-btn.secondary {
  opacity: 0.7;
}
</style>

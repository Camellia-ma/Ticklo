<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const motto = ref('加载中...')
let mottoTimer = null

const fetchMotto = async () => {
  try {
    if (!window.api || !window.api.getMotto) {
      motto.value = 'API 接口未就绪'
      return
    }
    const data = await window.api.getMotto()
    if (data && data.text) {
      motto.value = data.text
    } else {
      motto.value = '凡是过往，皆为序章。'
    }
  } catch (e) {
    console.error('Fetch motto failed:', e)
    motto.value = '山有扶苏，隰有荷华。'
  }
}

onMounted(() => {
  fetchMotto()
  mottoTimer = setInterval(fetchMotto, 3 * 60 * 1000) // 3 minutes
})

onUnmounted(() => {
  if (mottoTimer) clearInterval(mottoTimer)
})
</script>

<template>
  <div class="macos-card">
    <div class="card-header">
      <div class="traffic-lights">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="card-title">温柔语录</div>
    </div>
    <div class="card-content">
      <p class="motto-text">{{ motto }}</p>
    </div>
  </div>
</template>

<style scoped>
/* macOS 风格卡片 */
.macos-card {
  width: 450px; /* 固定宽度 */
  background-color: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  text-align: left;
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
}

.macos-card:hover {
  transform: translateY(-4px);
}

.card-header {
  height: 36px;
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
}

.traffic-lights {
  display: flex;
  gap: 8px;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red { background-color: #ff5f56; border: 0.5px solid #e0443e; }
.dot.yellow { background-color: #ffbd2e; border: 0.5px solid #dea123; }
.dot.green { background-color: #27c93f; border: 0.5px solid #1aab29; }

.card-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--color-text);
  opacity: 0.5;
  font-weight: 600;
}

.card-content {
  padding: 24px;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center; /* 确保多行文本也居中 */
  flex: 1; /* 占据剩余高度 */
}

.motto-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--color-text);
  opacity: 0.9;
  white-space: pre-wrap;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  text-align: center;
}

/* 深色模式适配 */
:global(.dark-theme) .macos-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  background-color: #252525;
}

:global(.dark-theme) .card-header {
  background-color: rgba(255, 255, 255, 0.03);
}
</style>

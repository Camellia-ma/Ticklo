<script setup>
import { computed } from 'vue'

const props = defineProps({
  checkInDates: {
    type: Array,
    default: () => []
  },
  pendingCount: {
    type: Number,
    default: 0
  },
  completedCount: {
    type: Number,
    default: 0
  },
  maxStreak: {
    type: Number,
    default: 0
  }
})

// 计算统计数据
const stats = computed(() => {
  // 计算完成率：已完成 / (已完成 + 待办)
  const total = props.completedCount + props.pendingCount
  const completionRate = total > 0 ? Math.round((props.completedCount / total) * 100) : 0
  
  return {
    pending: props.pendingCount,
    completed: props.completedCount,
    rate: completionRate,
    maxStreak: props.maxStreak
  }
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
      <div class="card-title">概览</div>
    </div>
    <div class="card-content">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">待办事件</span>
          <span class="stat-value">{{ stats.pending }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">已完成</span>
          <span class="stat-value">{{ stats.completed }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">完成率</span>
          <span class="stat-value">{{ stats.rate }}%</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最大连续打卡</span>
          <span class="stat-value">{{ stats.maxStreak }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 复用 macOS 风格卡片样式 */
.macos-card {
  width: 100%; /* 宽度由父容器控制 */
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
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  width: 100%;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--ev-c-text-2);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

/* 深色模式适配 */
:global(.dark-theme) .macos-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  background-color: #252525;
}

:global(.dark-theme) .card-header {
  background-color: rgba(255, 255, 255, 0.03);
}

/* 适配毛玻璃主题 */
:global(.glass-theme) .macos-card {
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}
</style>

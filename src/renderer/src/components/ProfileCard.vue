<script setup>
import { computed } from 'vue'
import defaultAvatar from '../../../../resources/head.jpg?asset'

const props = defineProps({
  userProfile: {
    type: Object,
    default: () => ({
      username: '',
      avatar_base64: null,
      motto: '',
      hobbies: ''
    })
  }
})

const displayMotto = computed(() => {
  return props.userProfile.motto || '凡是过往，皆为序章。'
})

const displayHobbies = computed(() => {
  if (!props.userProfile.hobbies) return []
  return props.userProfile.hobbies.split(/[,，]/).filter(h => h.trim())
})
</script>

<template>
  <div class="macos-card profile-card">
    <div class="card-header">
      <div class="traffic-lights">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
      <div class="card-title">个人信息</div>
    </div>
    
    <div class="card-content">
      <div class="profile-layout">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="props.userProfile.avatar_base64 || defaultAvatar" class="avatar" alt="Avatar" />
          </div>
        </div>
        
        <div class="info-section">
          <h2 class="user-name">{{ props.userProfile.username || '未命名用户' }}</h2>
          <p class="motto-text">{{ displayMotto }}</p>
          
          <div class="hobbies-container" v-if="displayHobbies.length > 0">
            <span v-for="(hobby, index) in displayHobbies" :key="index" class="hobby-tag">
              {{ hobby }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.macos-card {
  width: 100%;
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
}

.profile-layout {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: var(--color-background);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
}

.motto-text {
  font-size: 14px;
  color: var(--ev-c-text-2);
  opacity: 0.8;
  font-style: italic;
  margin: 0;
  line-height: 1.4;
}

.hobbies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.hobby-tag {
  font-size: 12px;
  padding: 2px 10px;
  background-color: rgba(0, 166, 255, 0.1);
  color: #00a6ff;
  border-radius: 12px;
  font-weight: 500;
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

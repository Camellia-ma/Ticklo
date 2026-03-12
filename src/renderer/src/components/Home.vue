<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import defaultAvatar from '../../../../resources/head.jpg?asset'
import CheckInGraph from './CheckInGraph.vue'
import MottoCard from './MottoCard.vue'

const checkInDates = ref([])

const consecutiveDays = computed(() => {
  if (checkInDates.value.length === 0) return 0
  
  // 对日期进行排序 (从新到旧)
  const sortedDates = [...checkInDates.value].sort((a, b) => new Date(b) - new Date(a))
  
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  // 如果今天和昨天都没打卡，则连胜中断
  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0
  }
  
  let count = 1
  let currentDate = new Date(sortedDates[0])
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(currentDate)
    prevDate.setDate(prevDate.getDate() - 1)
    const prevDateStr = prevDate.toISOString().split('T')[0]
    
    if (sortedDates[i] === prevDateStr) {
      count++
      currentDate = prevDate
    } else {
      break
    }
  }
  
  return count
})

const isCheckedInToday = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return checkInDates.value.includes(today)
})

const fetchCheckInData = async () => {
  try {
    if (window.api && window.api.getCheckInData) {
      const data = await window.api.getCheckInData()
      if (data && data.dates) {
        checkInDates.value = data.dates
      }
    }
  } catch (e) {
    console.error('Fetch check-in data failed:', e)
  }
}

const handleCheckIn = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    if (window.api && window.api.toggleCheckIn) {
      const result = await window.api.toggleCheckIn(today)
      if (result && result.success) {
        checkInDates.value = result.dates
      }
    }
  } catch (e) {
    console.error('Check-in failed:', e)
  }
}

onMounted(() => {
  fetchCheckInData()
})
</script>

<template>
  <div class="home-container">
    <div class="profile-section">
      <!-- ... (Avatar and Name section remains same) ... -->
      <div class="avatar-wrapper">
        <img :src="defaultAvatar" class="avatar" alt="Avatar" />
      </div>
      
      <h2 class="user-name">柳贯一</h2>
      
      <MottoCard />

      <div class="check-in-section">
        <div class="check-in-header">
          <div class="consecutive-days">
            <span class="label">连续打卡</span>
            <span class="count">{{ consecutiveDays }}</span>
            <span class="unit">天</span>
          </div>
          <button 
            class="check-in-btn" 
            :class="{ 'checked': isCheckedInToday }"
            @click="handleCheckIn"
          >
            {{ isCheckedInToday ? '已打卡' : '打卡' }}
          </button>
        </div>
        <CheckInGraph :check-in-dates="checkInDates" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ... (Existing styles remain same) ... */

.check-in-section {
  width: 450px;
  margin-top: 24px;
  background-color: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.check-in-section:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

/* 深色模式适配 */
.dark-theme .check-in-section {
  background-color: #252525;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.dark-theme .check-in-section:hover {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.check-in-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.consecutive-days {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.consecutive-days .label {
  font-size: 14px;
  color: var(--ev-c-text-2);
}

.consecutive-days .count {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.consecutive-days .unit {
  font-size: 12px;
  color: var(--ev-c-text-2);
}

.check-in-btn {
  padding: 6px 16px;
  border-radius: 20px;
  border: none;
  background-color: #00a6ff;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.check-in-btn:hover {
  background-color: #0095e6;
  transform: translateY(-1px);
}

.check-in-btn:active {
  transform: translateY(0);
}

.check-in-btn.checked {
  background-color: var(--color-border);
  color: var(--ev-c-text-2);
  cursor: default;
}

.check-in-btn.checked:hover {
  background-color: var(--color-border);
  transform: none;
}
</style>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background-color: var(--color-background);
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 500px;
}

.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--color-background-soft);
  border: 3px solid var(--color-border);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 32px;
  color: var(--color-text);
  letter-spacing: 1px;
}

/* macOS 风格卡片样式已迁移至 MottoCard.vue */
</style>

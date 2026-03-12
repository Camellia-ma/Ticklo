<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import defaultAvatar from '../../../../resources/head.jpg?asset'
import CheckInGraph from './CheckInGraph.vue'
import MottoCard from './MottoCard.vue'
import OverviewCard from './OverviewCard.vue'
import ProfileCard from './ProfileCard.vue'

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
      // 传入 userId，如果未就绪则此时可能获取空，但在 fetchUserProfile 后会再次触发刷新
      const userId = userProfile.value.id
      const data = await window.api.getCheckInData(userId)
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
    if (window.api && window.api.toggleCheckIn && userProfile.value.id) {
      const result = await window.api.toggleCheckIn({
        userId: userProfile.value.id,
        date: today
      })
      if (result && result.success) {
        checkInDates.value = result.dates
        // 打卡成功后刷新统计数据
        fetchHomeStats()
        
        // 播放音效
        const prefs = localStorage.getItem('ticklo_preferences')
        if (prefs) {
          const settings = JSON.parse(prefs)
          if (settings.soundCheckIn) {
            playSuccessSound()
          }
        }
      } else {
        console.error('Check-in result error:', result.error)
      }
    }
  } catch (e) {
    console.error('Check-in failed:', e)
  }
}

// 简单的音效播放函数
const playSuccessSound = () => {
  // 使用一个短促的提示音 base64
  const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU') // 这里只是个占位，实际应该用真实的音频数据
  // 由于没有真实的音频文件，我们用浏览器自带的 beep 替代方案或者仅仅是 log
  console.log('Play sound!')
  // 实际项目中可以引入一个真实的 mp3/wav 文件
}

const userProfile = ref({
  username: '柳贯一',
  avatar_base64: null,
  max_checkin_days: 0,
  current_checkin_days: 0
})

const homeStats = ref({
  pending: 0,
  completed: 0,
  maxStreak: 0,
  currentStreak: 0
})

const fetchHomeStats = async () => {
  if (window.api && window.api.getHomeStats && userProfile.value.id) {
    const result = await window.api.getHomeStats(userProfile.value.id)
    if (result.success && result.stats) {
      homeStats.value = result.stats
      // 更新 userProfile 中的打卡数据（如果有偏差）
      userProfile.value.max_checkin_days = result.stats.maxStreak
      userProfile.value.current_checkin_days = result.stats.currentStreak
    }
  }
}

const fetchUserProfile = async () => {
  if (window.api && window.api.getUserProfile) {
    const result = await window.api.getUserProfile()
    if (result.success && result.user) {
      userProfile.value = result.user
      fetchCheckInData() // 获取到用户 ID 后刷新打卡数据
      fetchHomeStats() // 获取完用户 ID 后获取统计数据
    }
  }
}

onMounted(() => {
  // fetchCheckInData() // 移除这里的调用，改为在 fetchUserProfile 中调用，确保有 userId
  fetchUserProfile()
})
</script>

<template>
  <div class="home-container">
    <div class="profile-section">
      <!-- 用户信息卡片 -->
      <ProfileCard :user-profile="userProfile" class="fixed-card" style="margin-bottom: 20px;" />
      
      <div class="content-layout">
        <div class="left-column">
          <OverviewCard 
            :check-in-dates="checkInDates" 
            :pending-count="homeStats.pending"
            :completed-count="homeStats.completed"
            :max-streak="homeStats.maxStreak"
            class="fixed-card" 
          />
          <MottoCard class="fixed-card" />
        </div>

        <div class="right-column">
          <div class="check-in-section fixed-card">
            <div class="check-in-header">
              <div class="consecutive-days">
                <span class="label">连续打卡</span>
                <span class="count">{{ homeStats.currentStreak }}</span>
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
    </div>
  </div>
</template>

<style scoped>
/* ... (Existing styles remain same) ... */

.fixed-card {
  flex-shrink: 0;
  overflow: hidden;
  width: 100%; /* 让卡片充满列宽 */
}

.check-in-section {
  /* width: 450px; 移除固定宽度 */
  /* margin-top: 24px; 移除顶部边距，由 gap 控制 */
  height: 100%; /* 充满父容器高度 */
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* 确保右侧打卡图表内容也能自适应填充 */
:deep(.calendar-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.days-grid) {
  flex: 1;
  align-content: center;
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
  /* justify-content: center; */
  min-height: 100%; /* 使用min-height允许内容撑开 */
  padding: 40px 20px; /* 增加顶部padding防止内容顶到最上面 */
  background-color: var(--color-background);
  transition: background-color 0.3s ease;
}

/* 适配毛玻璃主题 */
:global(.glass-theme) .home-container {
  background-color: transparent;
}

:global(.glass-theme) .check-in-section {
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

.profile-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 920px; /* 增加最大宽度以容纳两列布局 */
}

.content-layout {
  display: flex;
  gap: 20px;
  width: 100%;
  align-items: stretch; /* 确保子项等高 */
}

.left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 移除旧的头像和名称样式 */
/*
.avatar-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
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
*/

/* macOS 风格卡片样式已迁移至 MottoCard.vue */
</style>

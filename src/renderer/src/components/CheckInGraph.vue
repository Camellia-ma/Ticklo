<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  checkInDates: {
    type: Array,
    default: () => []
  }
})

const currentDate = ref(new Date())

const currentMonthLabel = computed(() => {
  return currentDate.value.toLocaleString('zh-CN', { year: 'numeric', month: 'long' })
})

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // 获取当月第一天是周几 (0-6)
  const firstDay = new Date(year, month, 1)
  const startDayOfWeek = firstDay.getDay()
  
  // 获取当月总天数
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  
  // 获取上个月总天数
  const daysInPrevMonth = new Date(year, month, 0).getDate()
  
  const days = []
  
  // 填充上个月的剩余天数
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({
      day: daysInPrevMonth - i,
      type: 'prev',
      date: new Date(year, month - 1, daysInPrevMonth - i).toISOString().split('T')[0]
    })
  }
  
  // 填充当月天数
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = new Date(year, month, i).toISOString().split('T')[0]
    days.push({
      day: i,
      type: 'current',
      date: dateStr,
      checked: props.checkInDates.includes(dateStr),
      isToday: dateStr === new Date().toISOString().split('T')[0]
    })
  }
  
  // 填充下个月的天数以补全 6 行 (42格)
  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    days.push({
      day: i,
      type: 'next',
      date: new Date(year, month + 1, i).toISOString().split('T')[0]
    })
  }
  
  return days
})

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}
</script>

<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <button class="nav-btn" @click="prevMonth">&lt;</button>
      <span class="month-label">{{ currentMonthLabel }}</span>
      <button class="nav-btn" @click="nextMonth">&gt;</button>
    </div>
    
    <div class="weekdays">
      <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
    </div>
    
    <div class="days-grid">
      <div 
        v-for="(item, index) in calendarDays" 
        :key="index"
        class="day-cell"
        :class="[
          item.type,
          { 'checked': item.checked, 'today': item.isToday }
        ]"
      >
        {{ item.day }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-container {
  width: 100%;
  padding: 8px 0;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 0 4px;
}

.month-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
}

.nav-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ev-c-text-2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--color-text);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 12px;
  color: var(--ev-c-text-2);
  margin-bottom: 8px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px; /* 减小间距 */
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-radius: 50%;
  cursor: default;
  color: var(--color-text);
  transition: all 0.2s;
}

.day-cell.prev,
.day-cell.next {
  color: var(--ev-c-text-2);
  opacity: 0.3;
}

.day-cell.today {
  border: 1px solid #00a6ff;
  color: #00a6ff;
  font-weight: 600;
}

.day-cell.checked {
  background-color: #27c93f;
  color: white;
  border: none; /* 移除可能的边框 */
  box-shadow: 0 2px 6px rgba(39, 201, 63, 0.3);
}

/* 深色模式适配 */
:global(.dark-theme) .nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: 'light'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const currentTheme = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

const themes = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'glass', label: '毛玻璃', icon: '🔮' }
]

const selectTheme = (value) => {
  currentTheme.value = value
}
</script>

<template>
  <div class="theme-switcher">
    <div 
      v-for="theme in themes" 
      :key="theme.value"
      class="theme-option"
      :class="{ active: currentTheme === theme.value }"
      @click="selectTheme(theme.value)"
    >
      <span class="theme-icon">{{ theme.icon }}</span>
      <span class="theme-label">{{ theme.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  display: flex;
  background-color: var(--color-background-soft);
  border-radius: 8px;
  padding: 4px;
  border: 1px solid var(--color-border);
  gap: 4px;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  color: var(--color-text);
  opacity: 0.7;
}

.theme-option:hover {
  background-color: rgba(128, 128, 128, 0.1);
  opacity: 1;
}

.theme-option.active {
  background-color: var(--color-background);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  opacity: 1;
  font-weight: 600;
}

/* 适配毛玻璃主题 */
:global(.glass-theme) .theme-option.active {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
}
</style>

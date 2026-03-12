<script setup>
import { ref, onMounted } from 'vue'

const todos = ref([])
const newTodoTitle = ref('')
const isLoading = ref(false)
const userProfile = ref(null)

const fetchUserProfile = async () => {
  if (window.api && window.api.getUserProfile) {
    const result = await window.api.getUserProfile()
    if (result.success && result.user) {
      userProfile.value = result.user
      fetchTodos()
    }
  }
}

const fetchTodos = async () => {
  if (!userProfile.value) return
  
  isLoading.value = true
  try {
    if (window.api && window.api.getTodos) {
      const result = await window.api.getTodos(userProfile.value.id)
      if (result.success) {
        todos.value = result.todos
      }
    }
  } catch (e) {
    console.error('Fetch todos failed:', e)
  } finally {
    isLoading.value = false
  }
}

const handleAddTodo = async () => {
  console.log('handleAddTodo called', newTodoTitle.value)
  if (!newTodoTitle.value.trim()) {
    console.log('Title is empty')
    return
  }
  
  if (!userProfile.value) {
    console.error('User profile not loaded yet')
    // 尝试重新获取
    await fetchUserProfile()
    if (!userProfile.value) {
      alert('无法获取用户信息，请刷新页面重试')
      return
    }
  }
  
  try {
    if (window.api && window.api.addTodo) {
      console.log('Calling addTodo API')
      const result = await window.api.addTodo({
        userId: userProfile.value.id,
        title: newTodoTitle.value.trim()
      })
      console.log('addTodo result:', result)
      
      if (result.success) {
        todos.value.unshift(result.todo)
        newTodoTitle.value = ''
      } else {
        console.error('Add todo failed:', result.error)
      }
    } else {
      console.error('addTodo API missing')
    }
  } catch (e) {
    console.error('Add todo exception:', e)
  }
}

const showConfirmModal = ref(false)
const todoToComplete = ref(null)

const handleComplete = (todo) => {
  todoToComplete.value = todo
  showConfirmModal.value = true
}

const confirmComplete = async () => {
  if (!todoToComplete.value) return
  
  const todo = todoToComplete.value
  showConfirmModal.value = false
  todoToComplete.value = null

  try {
    if (window.api && window.api.completeTodo) {
      // 乐观更新：先从 UI 移除
      const index = todos.value.findIndex(t => t.id === todo.id)
      if (index > -1) {
        todos.value.splice(index, 1)
      }
      
      const result = await window.api.completeTodo(todo.id)
      if (!result.success) {
        // 如果失败，回滚操作（这里简化处理，重新拉取）
        fetchTodos()
        alert('操作失败: ' + result.error)
      } else {
        // 播放音效
        const prefs = localStorage.getItem('ticklo_preferences')
        if (prefs) {
          const settings = JSON.parse(prefs)
          if (settings.soundTaskComplete) {
            playSuccessSound()
          }
        }
      }
    }
  } catch (e) {
    console.error('Complete todo failed:', e)
  }
}

// 简单的音效播放函数
const playSuccessSound = () => {
  // 使用一个短促的提示音 base64
  const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU') 
  console.log('Play sound!')
}

const cancelComplete = () => {
  if (todoToComplete.value) {
    // 重置 checkbox 的选中状态
    const checkbox = document.getElementById(`todo-checkbox-${todoToComplete.value.id}`)
    if (checkbox) checkbox.checked = false
  }
  showConfirmModal.value = false
  todoToComplete.value = null
}

onMounted(() => {
  fetchUserProfile()
})
</script>

<template>
  <div class="todo-container">
    <div class="todo-card macos-card">
      <div class="card-header">
        <div class="traffic-lights">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="card-title">待办事项</div>
      </div>
      
      <div class="card-content">
        <!-- 输入区域 -->
        <div class="input-section">
          <input 
            v-model="newTodoTitle" 
            @keyup.enter="handleAddTodo"
            type="text" 
            placeholder="添加新的待办事项..." 
            class="todo-input"
          />
          <button @click="handleAddTodo" class="add-btn" :disabled="!newTodoTitle.trim()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>

        <!-- 列表区域 -->
        <div class="todo-list" v-if="todos.length > 0">
          <div v-for="todo in todos" :key="todo.id" class="todo-item">
            <label class="checkbox-wrapper">
              <input 
                :id="`todo-checkbox-${todo.id}`"
                type="checkbox" 
                @change="handleComplete(todo)" 
              />
              <span class="checkmark"></span>
            </label>
            <span class="todo-text">{{ todo.title }}</span>
          </div>
        </div>
        
        <div class="empty-state" v-else>
          <div class="empty-icon">📝</div>
          <p>暂无待办事项，享受生活吧！</p>
        </div>
      </div>
    </div>

    <!-- 自定义确认弹窗 -->
    <div v-if="showConfirmModal" class="modal-overlay" @click.self="cancelComplete">
      <div class="modal-content macos-card">
        <div class="card-header">
          <div class="card-title">确认归档</div>
          <button class="close-btn" @click="cancelComplete">&times;</button>
        </div>
        
        <div class="modal-body">
          <p>确定将该事项标记为已完成并归档吗？</p>
          <div class="modal-actions">
            <button class="cancel-btn" @click="cancelComplete">取消</button>
            <button class="confirm-btn" @click="confirmComplete">确认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 320px;
  background-color: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

/* 适配毛玻璃主题下的弹窗 */
:global(.glass-theme) .modal-content {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  backdrop-filter: none;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  opacity: 0.5;
  color: var(--color-text);
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  color: var(--color-text);
  text-align: center;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.modal-actions button {
  padding: 6px 20px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.confirm-btn {
  background-color: #00a6ff;
  color: white;
}

.confirm-btn:hover {
  background-color: #0095e6;
}

.todo-container {
  width: 100%;
  height: 100%;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.todo-card {
  width: 100%;
  max-width: 600px;
  min-height: 500px; /* 增加最小高度 */
  display: flex;
  flex-direction: column;
}

.macos-card {
  background-color: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.card-header {
  height: 36px;
  background-color: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid var(--color-border);
  position: relative;
  flex-shrink: 0;
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
  flex-direction: column;
  gap: 20px;
}

.input-section {
  display: flex;
  gap: 12px;
}

.todo-input {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  transition: all 0.2s;
}

.todo-input:focus {
  outline: none;
  border-color: #00a6ff;
  box-shadow: 0 0 0 2px rgba(0, 166, 255, 0.2);
}

.add-btn {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  border: none;
  background-color: #00a6ff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover:not(:disabled) {
  background-color: #0095e6;
  transform: translateY(-1px);
}

.add-btn:active:not(:disabled) {
  transform: translateY(0);
}

.add-btn:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
  opacity: 0.6;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  max-height: 60vh;
  /* 隐藏滚动条但保留滚动功能 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.todo-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: var(--color-background);
  border-radius: 8px;
  border: 1px solid var(--color-border);
  transition: all 0.2s;
}

.todo-item:hover {
  transform: translateX(2px);
  border-color: rgba(0, 166, 255, 0.3);
}

.checkbox-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
}

.checkbox-wrapper input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: transparent;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  transition: all 0.2s;
}

.checkbox-wrapper:hover input ~ .checkmark {
  border-color: #00a6ff;
}

.checkbox-wrapper input:checked ~ .checkmark {
  background-color: #00a6ff;
  border-color: #00a6ff;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.checkbox-wrapper input:checked ~ .checkmark:after {
  display: block;
}

.checkbox-wrapper .checkmark:after {
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.todo-text {
  font-size: 15px;
  color: var(--color-text);
  line-height: 1.4;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--ev-c-text-2);
  opacity: 0.6;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

/* 深色模式适配 */
:global(.dark-theme) .macos-card {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  background-color: #252525;
}

:global(.dark-theme) .card-header {
  background-color: rgba(255, 255, 255, 0.03);
}

:global(.dark-theme) .todo-input,
:global(.dark-theme) .todo-item {
  background-color: rgba(255, 255, 255, 0.05);
}

/* 适配毛玻璃主题 */
:global(.glass-theme) .macos-card {
  background-color: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

:global(.glass-theme) .todo-input,
:global(.glass-theme) .todo-item {
  background-color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}
</style>

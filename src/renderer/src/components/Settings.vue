<script setup>
import { ref, onMounted } from 'vue'
import ThemeSwitch from './ThemeSwitch.vue'
import AboutModal from './AboutModal.vue'

const props = defineProps({
  currentTheme: {
    type: String,
    default: 'light'
  }
})

const emit = defineEmits(['update:theme'])

const handleThemeUpdate = (newTheme) => {
  emit('update:theme', newTheme)
}

const showForm = ref(false)
const showAbout = ref(false)
const isLoading = ref(false)

const userProfile = ref({
  id: null,
  username: '',
  avatar_base64: '',
  motto: '',
  gender: '',
  hobbies: ''
})

const fetchProfile = async () => {
  if (window.api && window.api.getUserProfile) {
    const result = await window.api.getUserProfile()
    if (result.success) {
      userProfile.value = { ...result.user }
    }
  }
}

const handleAvatarChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      userProfile.value.avatar_base64 = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const saveProfile = async () => {
  isLoading.value = true
  try {
    if (!window.api || !window.api.updateUserProfile) {
      alert('Error: API is missing. Please restart the app.')
      return
    }

    // 检查是否有 userProfile.id
    if (!userProfile.value.id) {
      alert('无法保存：用户 ID 为空。请刷新页面重试。')
      return
    }

    // 确保 avatar_base64 是字符串，如果是 null 则不传递或传递空字符串
    const profileToSave = { 
      ...userProfile.value,
      avatar_base64: userProfile.value.avatar_base64 || ''
    }
    
    const result = await window.api.updateUserProfile(profileToSave)
    
    if (result.success) {
      userProfile.value = { ...result.user }
      showForm.value = false
    } else {
      alert('保存失败: ' + result.error)
    }
  } catch (e) {
    alert('保存出错: ' + e.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProfile)
</script>

<template>
  <div class="settings-container">
    <div class="settings-card macos-card">
      <div class="card-header">
        <div class="traffic-lights">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <div class="card-title">系统设置</div>
      </div>
      
      <div class="card-content">
        <div class="setting-item" @click="showForm = true">
          <div class="item-info">
            <span class="item-label">个人资料设置</span>
            <span class="item-desc">修改您的名称、头像、兴趣爱好等</span>
          </div>
          <div class="item-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>

        <div class="setting-item">
          <div class="item-info">
            <span class="item-label">外观设置</span>
            <span class="item-desc">切换浅色、深色或毛玻璃主题</span>
          </div>
          <div class="item-action">
            <ThemeSwitch :model-value="props.currentTheme" @update:model-value="handleThemeUpdate" />
          </div>
        </div>
        
        <div class="setting-item" @click="showAbout = true">
          <div class="item-info">
            <span class="item-label">关于 Ticklo</span>
            <span class="item-desc">版本 1.0.0</span>
          </div>
          <div class="item-action">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态框组件 -->
    <AboutModal :show="showAbout" @close="showAbout = false" />

    <!-- 用户设置弹窗 -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal-content macos-card">
        <div class="card-header">
          <div class="card-title">修改个人资料</div>
          <button class="close-btn" @click="showForm = false">&times;</button>
        </div>
        
        <div class="form-body">
          <div class="form-item avatar-upload">
            <div class="avatar-preview">
              <img :src="userProfile.avatar_base64 || 'https://via.placeholder.com/100'" alt="Avatar" />
            </div>
            <label class="upload-btn">
              更换头像
              <input type="file" accept="image/*" @change="handleAvatarChange" hidden />
            </label>
          </div>
          
          <div class="form-item">
            <label>用户名称</label>
            <input v-model="userProfile.username" type="text" placeholder="请输入名称" />
          </div>
          
          <div class="form-item">
            <label>性别</label>
            <select v-model="userProfile.gender">
              <option value="">请选择</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="隐藏">隐藏</option>
            </select>
          </div>
          
          <div class="form-item">
            <label>个性签名 / 名言</label>
            <textarea v-model="userProfile.motto" placeholder="写下你的座右铭..."></textarea>
          </div>
          
          <div class="form-item">
            <label>兴趣爱好</label>
            <input v-model="userProfile.hobbies" type="text" placeholder="用逗号分隔多个爱好" />
          </div>
          
          <div class="form-actions">
            <button class="cancel-btn" @click="showForm = false">取消</button>
            <button class="save-btn" :disabled="isLoading" @click="saveProfile">
              {{ isLoading ? '保存中...' : '保存修改' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  width: 100%;
  height: 100%;
  padding: 40px;
  display: flex;
  justify-content: center;
}

.settings-card {
  width: 100%;
  max-width: 600px;
  height: fit-content;
}

.macos-card {
  background-color: var(--color-background-soft);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
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
  width: 100%; /* 这里有点问题，应该是固定宽度 */
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red { background-color: #ff5f56; }
.dot.yellow { background-color: #ffbd2e; }
.dot.green { background-color: #27c93f; }

.card-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
}

.card-content {
  padding: 8px 0;
}

.setting-item {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.setting-item:hover {
  background-color: rgba(128, 128, 128, 0.05);
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-label {
  font-size: 15px;
  font-weight: 600;
}

.item-desc {
  font-size: 12px;
  opacity: 0.5;
}

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
  backdrop-filter: blur(4px); /* 背景模糊 */
}

.modal-content {
  width: 400px;
  background-color: var(--color-background); /* 使用主题背景色 */
  border-radius: 12px; /* 确保圆角 */
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3); /* 增强阴影 */
  border: 1px solid var(--color-border);
}

/* 适配毛玻璃主题下的弹窗 */
:global(.glass-theme) .modal-content {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  backdrop-filter: none; /* 使用不透明背景时可以移除模糊，或者保留模糊增加层次感 */
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
}

.form-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.avatar-upload {
  align-items: center;
  margin-bottom: 8px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-border);
  margin-bottom: 12px;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-btn {
  font-size: 13px;
  color: #00a6ff;
  cursor: pointer;
  font-weight: 600;
}

.form-item label {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.8;
}

.form-item input, .form-item select, .form-item textarea {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  color: var(--color-text);
  font-family: inherit;
}

.form-item textarea {
  height: 80px;
  resize: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.form-actions button {
  padding: 8px 16px;
  border-radius: 6px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background-color: transparent;
  color: var(--color-text);
  opacity: 0.6;
}

.save-btn {
  background-color: #00a6ff;
  color: white;
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 深色模式适配 */
:global(.dark-theme) .macos-card {
  background-color: #252525;
}
</style>

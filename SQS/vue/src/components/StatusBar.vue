<template>
  <div class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <el-icon :size="14"><User /></el-icon>
        {{ authStore.userName }}
      </span>
      <span class="status-item">
        <el-icon :size="14"><Timer /></el-icon>
        {{ currentTime }}
      </span>
    </div>
    <div class="status-right">
      <span class="status-item">
        <el-icon :size="14">
          <CircleCheck v-if="serverOnline" color="#67c23a" />
          <CircleClose v-else color="#f56c6c" />
        </el-icon>
        服务器: {{ serverOnline ? '在线' : '离线' }}
      </span>
      <span class="status-item version">
        v1.0.0
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { User, Timer, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const authStore = useAuthStore()

const currentTime = ref('')
const serverOnline = ref(true)
let timeInterval = null
let checkInterval = null

function updateTime() {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

async function checkServerStatus() {
  try {
    const response = await fetch('/api/health')
    serverOnline.value = response.ok
  } catch {
    serverOnline.value = false
  }
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  checkServerStatus()
  checkInterval = setInterval(checkServerStatus, 30000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
  if (checkInterval) {
    clearInterval(checkInterval)
  }
})
</script>

<style scoped>
.status-bar {
  height: 28px;
  background: #fff;
  border-top: 1px solid #dcdfe6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 12px;
  color: #606266;
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.version {
  color: #909399;
}
</style>

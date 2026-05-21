<template>
  <div class="system-management">
    <div class="page-header">
      <el-icon :size="24" color="#3b82f6"><Setting /></el-icon>
      <h2>系统管理</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="系统设置" class="card">
          <el-form :model="systemSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="systemSettings.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统版本">
              <el-input v-model="systemSettings.version" disabled />
            </el-form-item>
            <el-form-item label="系统语言">
              <el-select v-model="systemSettings.language" placeholder="请选择语言">
                <el-option label="中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item label="日期格式">
              <el-select v-model="systemSettings.dateFormat" placeholder="请选择日期格式">
                <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
                <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
                <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
              </el-select>
            </el-form-item>
            <el-form-item label="每页显示条数">
              <el-select v-model="systemSettings.pageSize" placeholder="请选择">
                <el-option label="10条" :value="10" />
                <el-option label="20条" :value="20" />
                <el-option label="50条" :value="50" />
                <el-option label="100条" :value="100" />
              </el-select>
            </el-form-item>
            <el-form-item label="自动保存">
              <el-switch v-model="systemSettings.autoSave" />
            </el-form-item>
            <el-form-item label="通知提醒">
              <el-switch v-model="systemSettings.notifications" />
            </el-form-item>
          </el-form>
          <div class="card-footer">
            <el-button type="primary" @click="saveSystemSettings">保存设置</el-button>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card title="安全设置" class="card">
          <el-form :model="securitySettings" label-width="120px">
            <el-form-item label="密码有效期(天)">
              <el-input-number v-model="securitySettings.passwordExpireDays" :min="7" :max="365" />
            </el-form-item>
            <el-form-item label="登录失败次数限制">
              <el-input-number v-model="securitySettings.maxLoginAttempts" :min="3" :max="20" />
            </el-form-item>
            <el-form-item label="账户锁定时间(分钟)">
              <el-input-number v-model="securitySettings.lockoutMinutes" :min="5" :max="120" />
            </el-form-item>
            <el-form-item label="启用双因素认证">
              <el-switch v-model="securitySettings.twoFactorAuth" />
            </el-form-item>
            <el-form-item label="会话超时时间(分钟)">
              <el-input-number v-model="securitySettings.sessionTimeout" :min="5" :max="480" />
            </el-form-item>
            <el-form-item label="启用IP白名单">
              <el-switch v-model="securitySettings.ipWhitelistEnabled" />
            </el-form-item>
          </el-form>
          <div class="card-footer">
            <el-button type="primary" @click="saveSecuritySettings">保存设置</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card title="数据管理" class="card">
          <div class="data-actions">
            <el-button type="primary" @click="handleBackup" :loading="backupLoading">
              <el-icon><Download /></el-icon>
              数据备份
            </el-button>
            <el-button type="warning" @click="showRestoreModal = true">
              <el-icon><Upload /></el-icon>
              数据恢复
            </el-button>
            <el-button type="danger" @click="handleClearCache">
              <el-icon><Refresh /></el-icon>
              清理缓存
            </el-button>
          </div>
          
          <div class="data-info">
            <div class="info-item">
              <span class="info-label">数据库大小</span>
              <span class="info-value">{{ databaseSize }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">记录总数</span>
              <span class="info-value">{{ totalRecords }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">最后备份时间</span>
              <span class="info-value">{{ lastBackupTime }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card title="系统日志" class="card">
          <div class="log-filter">
            <el-select v-model="logFilter.type" placeholder="日志类型" clearable>
              <el-option label="全部" value="" />
              <el-option label="操作日志" value="operation" />
              <el-option label="错误日志" value="error" />
              <el-option label="系统日志" value="system" />
            </el-select>
            <el-date-picker v-model="logFilter.date" type="date" placeholder="选择日期" />
            <el-button @click="loadLogs">查询</el-button>
          </div>
          
          <div class="log-list">
            <div v-for="log in systemLogs" :key="log.id" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span :class="`log-type log-${log.type}`">{{ log.typeLabel }}</span>
              <span class="log-content">{{ log.content }}</span>
            </div>
          </div>
          
          <el-pagination
            :current-page="logPagination.page"
            :page-size="logPagination.pageSize"
            :total="logPagination.total"
            @current-change="loadLogs"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog title="数据恢复" v-model="showRestoreModal" width="450px">
      <el-form :model="restoreForm" label-width="100px">
        <el-form-item label="备份文件">
          <el-upload
            class="upload-demo"
            action="/api/system/restore"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".json,.bak"
          >
            <el-button type="primary">选择文件</el-button>
          </el-upload>
          <div v-if="restoreForm.fileName" class="file-name">{{ restoreForm.fileName }}</div>
        </el-form-item>
        <el-form-item label="确认恢复">
          <el-switch v-model="restoreForm.confirm" />
          <span style="color: #f56c6c; margin-left: 10px;">恢复将覆盖现有数据！</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRestoreModal = false">取消</el-button>
        <el-button type="primary" @click="handleRestore" :disabled="!restoreForm.confirm">确认恢复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Setting, Download, Upload, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const systemSettings = reactive({
  systemName: 'SRM供应商管理系统',
  version: 'v1.0.0',
  language: 'zh-CN',
  dateFormat: 'YYYY-MM-DD',
  pageSize: 20,
  autoSave: true,
  notifications: true
})

const securitySettings = reactive({
  passwordExpireDays: 90,
  maxLoginAttempts: 5,
  lockoutMinutes: 30,
  twoFactorAuth: false,
  sessionTimeout: 60,
  ipWhitelistEnabled: false
})

const logFilter = reactive({
  type: '',
  date: ''
})

const logPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 50
})

const showRestoreModal = ref(false)
const restoreForm = reactive({
  fileName: '',
  confirm: false
})

const backupLoading = ref(false)

const databaseSize = ref('256 MB')
const totalRecords = ref('12,847')
const lastBackupTime = ref('2024-01-15 14:30:00')

const systemLogs = ref([
  { id: 1, time: '2024-01-15 14:32:15', type: 'system', typeLabel: '系统', content: '定时任务执行完成' },
  { id: 2, time: '2024-01-15 14:30:00', type: 'operation', typeLabel: '操作', content: '管理员执行数据备份' },
  { id: 3, time: '2024-01-15 14:25:30', type: 'error', typeLabel: '错误', content: '用户登录失败，密码错误' },
  { id: 4, time: '2024-01-15 14:20:00', type: 'system', typeLabel: '系统', content: '数据库连接正常' },
  { id: 5, time: '2024-01-15 14:15:45', type: 'operation', typeLabel: '操作', content: '新增用户：admin2' },
  { id: 6, time: '2024-01-15 14:10:00', type: 'system', typeLabel: '系统', content: '缓存清理完成' },
  { id: 7, time: '2024-01-15 14:05:30', type: 'operation', typeLabel: '操作', content: '更新系统配置' },
  { id: 8, time: '2024-01-15 14:00:00', type: 'system', typeLabel: '系统', typeLabel: '系统', content: '系统启动完成' }
])

function saveSystemSettings() {
  ElMessage.success('系统设置保存成功')
}

function saveSecuritySettings() {
  ElMessage.success('安全设置保存成功')
}

async function handleBackup() {
  backupLoading.value = true
  await new Promise(resolve => setTimeout(resolve, 2000))
  backupLoading.value = false
  lastBackupTime.value = new Date().toLocaleString('zh-CN')
  ElMessage.success('数据备份成功')
}

function handleFileChange(file) {
  restoreForm.fileName = file.name
}

function handleRestore() {
  showRestoreModal.value = false
  restoreForm.confirm = false
  restoreForm.fileName = ''
  ElMessage.success('数据恢复成功')
}

function handleClearCache() {
  ElMessage.success('缓存清理成功')
}

function loadLogs() {
  ElMessage.info('日志加载成功')
}

onMounted(() => {
  console.log('System Management page loaded')
})
</script>

<style scoped>
.system-management {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.card {
  height: 100%;
}

.card-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebf0f5;
  text-align: right;
}

.data-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.data-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 12px 20px;
  background: #fafafa;
  border-radius: 8px;
  min-width: 140px;
}

.info-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.log-filter {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.log-list {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #999;
  font-size: 12px;
  min-width: 140px;
}

.log-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  min-width: 50px;
  text-align: center;
}

.log-system {
  background: #dbeafe;
  color: #2563eb;
}

.log-operation {
  background: #dcfce7;
  color: #16a34a;
}

.log-error {
  background: #fee2e2;
  color: #dc2626;
}

.log-content {
  flex: 1;
  color: #333;
}

.file-name {
  margin-top: 10px;
  font-size: 13px;
  color: #666;
}
</style>
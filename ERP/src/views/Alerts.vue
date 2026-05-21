<template>
  <div class="alerts-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="filter-area">
            <el-select v-model="filterType" placeholder="预警类型" style="width: 140px" clearable>
              <el-option label="全部" value="" />
              <el-option label="销售预警" value="sale" />
              <el-option label="采购预警" value="purchase" />
              <el-option label="生产预警" value="production" />
              <el-option label="财务预警" value="finance" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="处理状态" style="width: 120px" clearable>
              <el-option label="全部" value="" />
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已处理" value="resolved" />
              <el-option label="已忽略" value="ignored" />
            </el-select>
          </div>
          <div class="action-area">
            <el-button type="primary" @click="loadAlerts">
              <el-icon><Refresh /></el-icon>
              刷新预警
            </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待处理" name="pending">
          <template #label>
            <span>待处理 <el-badge :value="pendingCount" :hidden="pendingCount === 0" type="danger" /></span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="全部" name="all" />
      </el-tabs>

      <el-table :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="alertType" label="预警类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getAlertTypeTag(row.alertType)" size="small">
              {{ getAlertTypeName(row.alertType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="90">
          <template #default="{ row }">
            <el-tag :type="getSeverityTag(row.severity)" size="small">
              {{ getSeverityName(row.severity) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="预警标题" min-width="200" />
        <el-table-column prop="content" label="预警内容" min-width="300" />
        <el-table-column prop="refType" label="关联单据" width="100">
          <template #default="{ row }">
            <span v-if="row.refType === 'order'">订单</span>
            <span v-else-if="row.refType === 'purchase'">采购单</span>
            <span v-else-if="row.refType === 'production'">工单</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="refNumber" label="单据编号" width="140" />
        <el-table-column prop="createdAt" label="发生时间" width="160" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handleResolve(row)">处理</el-button>
            <el-button v-if="row.status === 'pending'" type="warning" link size="small" @click="handleIgnore(row)">忽略</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadAlerts"
          @current-change="loadAlerts"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" title="预警详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border v-if="selectedAlert">
        <el-descriptions-item label="预警类型">
          <el-tag :type="getAlertTypeTag(selectedAlert.alertType)" size="small">
            {{ getAlertTypeName(selectedAlert.alertType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="严重程度">
          <el-tag :type="getSeverityTag(selectedAlert.severity)" size="small">
            {{ getSeverityName(selectedAlert.severity) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预警标题" :span="2">{{ selectedAlert.title }}</el-descriptions-item>
        <el-descriptions-item label="预警内容" :span="2">{{ selectedAlert.content }}</el-descriptions-item>
        <el-descriptions-item label="关联单据">{{ selectedAlert.refType }}</el-descriptions-item>
        <el-descriptions-item label="单据编号">{{ selectedAlert.refNumber }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ selectedAlert.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="getStatusTag(selectedAlert.status)" size="small">
            {{ getStatusName(selectedAlert.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2" v-if="selectedAlert.resolveNote">
          {{ selectedAlert.resolveNote }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button v-if="selectedAlert?.status === 'pending'" type="warning" @click="handleIgnore(selectedAlert)">忽略</el-button>
        <el-button v-if="selectedAlert?.status === 'pending'" type="success" @click="handleResolve(selectedAlert)">标记已处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const activeTab = ref('pending')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const allAlerts = ref([])
const dialogVisible = ref(false)
const selectedAlert = ref(null)

const displayData = computed(() => {
  let data = [...allAlerts.value]
  if (activeTab.value === 'pending') {
    data = data.filter(a => a.status === 'pending')
  }
  if (filterType.value) {
    data = data.filter(a => a.alertType === filterType.value)
  }
  if (filterStatus.value) {
    data = data.filter(a => a.status === filterStatus.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const pendingCount = computed(() => {
  return allAlerts.value.filter(a => a.status === 'pending').length
})

const total = computed(() => displayData.value.length)

function getAlertTypeTag(type) {
  const map = { sale: '', purchase: 'warning', production: 'info', finance: 'danger' }
  return map[type] || 'info'
}

function getAlertTypeName(type) {
  const map = { sale: '销售预警', purchase: '采购预警', production: '生产预警', finance: '财务预警' }
  return map[type] || type
}

function getSeverityTag(severity) {
  const map = { low: 'info', medium: 'warning', high: 'danger', critical: 'danger' }
  return map[severity] || 'info'
}

function getSeverityName(severity) {
  const map = { low: '低', medium: '中', high: '高', critical: '紧急' }
  return map[severity] || severity
}

function getStatusTag(status) {
  const map = { pending: 'danger', processing: 'warning', resolved: 'success', ignored: 'info' }
  return map[status] || 'info'
}

function getStatusName(status) {
  const map = { pending: '待处理', processing: '处理中', resolved: '已处理', ignored: '已忽略' }
  return map[status] || status
}

async function loadAlerts() {
  loading.value = true
  try {
    const response = await fetch('/api/alerts')
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        allAlerts.value = result.data
      }
    }
  } catch (error) {
    console.error('加载预警失败:', error)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  currentPage.value = 1
}

function handleView(row) {
  selectedAlert.value = { ...row }
  dialogVisible.value = true
}

async function handleResolve(row) {
  try {
    await ElMessageBox.confirm('确定要标记此预警为已处理吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    const response = await fetch(`/api/alerts/${row.id}/resolve`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('处理成功')
        loadAlerts()
        dialogVisible.value = false
      }
    }
  } catch {
    // cancelled
  }
}

async function handleIgnore(row) {
  try {
    await ElMessageBox.confirm('确定要忽略此预警吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await fetch(`/api/alerts/${row.id}/ignore`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('已忽略')
        loadAlerts()
        dialogVisible.value = false
      }
    }
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadAlerts()
})
</script>

<style scoped>
.alerts-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-area {
  display: flex;
  gap: 10px;
}

.action-area {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

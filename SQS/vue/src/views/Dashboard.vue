<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <div class="header-info">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">欢迎回来，{{ currentUser?.name || '用户' }}！今天是 {{ today }}</p>
      </div>
      <el-button 
        icon="Refresh" 
        @click="refreshData" 
        :loading="refreshing"
        class="refresh-btn"
      >
        刷新数据
      </el-button>
    </div>

    <div class="stats-grid">
      <div 
        class="stat-card" 
        v-for="stat in stats" 
        :key="stat.title"
        @click="navigateTo(stat.route)"
      >
        <div class="stat-icon-wrapper" :style="{ background: stat.gradient }">
          <el-icon :size="32" :color="stat.iconColor">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">{{ stat.title }}</p>
          <h2 class="stat-value">
            {{ stat.prefix }}{{ stat.formattedValue }}{{ stat.suffix }}
          </h2>
          <div v-if="stat.change !== undefined" class="stat-change" :class="stat.changeClass">
            <el-icon :size="16"><component :is="stat.change >= 0 ? 'Top' : 'Bottom'" /></el-icon>
            <span>{{ Math.abs(stat.change) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="main-content">
        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Document /></el-icon> 最近报价单
            </h3>
            <el-button link @click="$router.push('/quotes')">查看全部</el-button>
          </div>
          <el-table :data="recentQuotes" style="width: 100%" v-loading="loadingQuotes" border>
            <el-table-column prop="quoteNumber" label="报价单号" width="140">
              <template #default="{ row }">
                <span class="quote-link" @click="goToQuote(row.id)">{{ row.quoteNumber }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="customerName" label="客户" />
            <el-table-column prop="salespersonName" label="报价人" width="100" />
            <el-table-column prop="totalAmount" label="金额" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ row.totalAmount?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="140">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <div v-if="recentQuotes.length === 0 && !loadingQuotes" class="empty-state">
            <el-icon :size="48" color="#ccc"><Document /></el-icon>
            <p>暂无报价单</p>
          </div>
        </el-card>
      </div>

      <div class="side-content">
        <el-card class="card quick-actions-card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Plus /></el-icon> 快捷操作
            </h3>
          </div>
          <div class="quick-actions">
            <el-button
              type="primary"
              icon="Document"
              @click="$router.push('/quotes/new')"
              class="action-btn"
            >
              新建报价单
            </el-button>
            <el-button
              type="success"
              icon="Box"
              @click="$router.push('/products')"
              class="action-btn"
            >
              产品管理
            </el-button>
            <el-button
              type="info"
              icon="User"
              @click="$router.push('/customers')"
              class="action-btn"
            >
              客户管理
            </el-button>
            <el-button
              type="warning"
              icon="Setting"
              @click="$router.push('/settings')"
              class="action-btn"
            >
              系统设置
            </el-button>
          </div>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><component :is="'TrendCharts'" /></el-icon> 报价状态分布
            </h3>
          </div>
          <div class="status-chart">
            <div v-for="item in statusDistribution" :key="item.status" class="chart-item">
              <div class="chart-label">{{ item.label }}</div>
              <div class="chart-bar-wrapper">
                <div 
                  class="chart-bar" 
                  :style="{ width: item.percentage + '%', background: item.color }"
                ></div>
              </div>
              <div class="chart-value">{{ item.count }} ({{ item.percentage }}%)</div>
            </div>
          </div>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><component :is="'Timer'" /></el-icon> 待处理事项
              <span class="badge">{{ pendingTasks.length }}</span>
            </h3>
          </div>
          <div class="todo-list">
            <div v-for="(task, index) in pendingTasks" :key="index" class="todo-item" @click="toggleTask(task)">
              <el-checkbox 
                v-model="task.completed" 
                @change.stop="toggleTask(task)"
                :disabled="task.type === 'system'"
              />
              <span :class="{ done: task.completed }" class="task-text">
                <span class="task-icon" :class="task.type">
                  <el-icon :size="14"><component :is="getTaskIcon(task.type)" /></el-icon>
                </span>
                {{ task.title }}
              </span>
              <span v-if="task.count" class="task-count">{{ task.count }}项</span>
            </div>
            <div v-if="pendingTasks.length === 0" class="empty-todo">
              <el-icon :size="32" color="#ccc"><component :is="'CircleCheck'" /></el-icon>
              <p>暂无待处理事项</p>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productsApi, quotesApi, customersApi, authApi } from '../api'
import { Plus, Box, Document, User, Refresh, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const currentUser = ref({})
const today = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

const stats = ref([
  { 
    title: '产品总数', 
    value: 0, 
    formattedValue: '0',
    icon: Box, 
    iconColor: '#fff', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    route: '/products',
    prefix: '',
    suffix: '',
    change: 12,
    changeClass: 'positive'
  },
  { 
    title: '报价单总数', 
    value: 0, 
    formattedValue: '0',
    icon: Document, 
    iconColor: '#fff', 
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    route: '/quotes',
    prefix: '',
    suffix: '',
    change: 8,
    changeClass: 'positive'
  },
  { 
    title: '客户总数', 
    value: 0, 
    formattedValue: '0',
    icon: User, 
    iconColor: '#fff', 
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    route: '/customers',
    prefix: '',
    suffix: '',
    change: -3,
    changeClass: 'negative'
  },
  { 
    title: '总销售额', 
    value: 0, 
    formattedValue: '0.00',
    icon: User, 
    iconColor: '#fff', 
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    route: '/quotes',
    prefix: '¥',
    suffix: '',
    change: 15,
    changeClass: 'positive'
  }
])

const recentQuotes = ref([])
const loadingQuotes = ref(false)
const refreshing = ref(false)

const statusDistribution = computed(() => {
  const counts = {
    draft: 0,
    sent: 0,
    confirmed: 0,
    rejected: 0
  }
  recentQuotes.value.forEach(q => {
    if (counts[q.status] !== undefined) {
      counts[q.status]++
    }
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return [
    { status: 'draft', label: '草稿', count: counts.draft, percentage: Math.round((counts.draft / total) * 100), color: '#909399' },
    { status: 'sent', label: '已发送', count: counts.sent, percentage: Math.round((counts.sent / total) * 100), color: '#409eff' },
    { status: 'confirmed', label: '已确认', count: counts.confirmed, percentage: Math.round((counts.confirmed / total) * 100), color: '#67c23a' },
    { status: 'rejected', label: '已拒绝', count: counts.rejected, percentage: Math.round((counts.rejected / total) * 100), color: '#f56c6c' }
  ]
})

const pendingTasks = ref([])

const TASK_ICONS = {
  quote: 'Document',
  customer: 'User',
  product: 'Box',
  system: 'Warning',
  message: 'ChatDotRound'
}

function getTaskIcon(type) {
  return TASK_ICONS[type] || 'Warning'
}

function toggleTask(task) {
  if (task.type !== 'system') {
    task.completed = !task.completed
    ElMessage.success(task.completed ? '已标记为完成' : '已取消完成')
  }
}

function updatePendingTasks(quotes, customers) {
  const draftQuotes = quotes.filter(q => q.status === 'draft').length
  const tasks = []
  
  if (draftQuotes > 0) {
    tasks.push({
      id: 'drafts',
      title: '待发送的报价单',
      type: 'quote',
      completed: false,
      count: draftQuotes
    })
  }
  
  const newCustomers = customers.filter(c => !c.customerNo || c.customerNo === '').length
  if (newCustomers > 0) {
    tasks.push({
      id: 'customers',
      title: '未完善客户编号',
      type: 'customer',
      completed: false,
      count: newCustomers
    })
  }
  
  tasks.push({
    id: 'review',
    title: '检查报价单状态',
    type: 'system',
    completed: false
  })
  
  pendingTasks.value = tasks
}

const STATUS_CONFIG = {
  draft: { label: '草稿', type: 'info' },
  sent: { label: '已发送', type: 'primary' },
  confirmed: { label: '已确认', type: 'success' },
  rejected: { label: '已拒绝', type: 'danger' }
}

function getStatusType(status) {
  return STATUS_CONFIG[status]?.type || 'info'
}

function getStatusText(status) {
  return STATUS_CONFIG[status]?.label || status
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function navigateTo(route) {
  if (route) {
    router.push(route)
  }
}

function goToQuote(id) {
  router.push(`/quotes/${id}`)
}

async function loadStats() {
  try {
    const [productsData, customersData, usersData, quotesData] = await Promise.all([
      productsApi.list({ page: 1, pageSize: 1000 }),
      customersApi.list({ page: 1, pageSize: 1000 }),
      authApi.getUsers(),
      quotesApi.list({ page: 1, pageSize: 1000 })
    ])
    
    stats.value[0].value = productsData.total || productsData.products?.length || 0
    stats.value[0].formattedValue = stats.value[0].value.toString()
    
    stats.value[1].value = quotesData.total || quotesData.quotes?.length || 0
    stats.value[1].formattedValue = stats.value[1].value.toString()
    
    stats.value[2].value = customersData.total || customersData.customers?.length || 0
    stats.value[2].formattedValue = stats.value[2].value.toString()
    
    const quotes = quotesData.quotes || []
    const totalSales = quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0)
    stats.value[3].value = totalSales
    stats.value[3].formattedValue = totalSales.toFixed(2)
    
    const customers = customersData.customers || []
    updatePendingTasks(quotes, customers)
    
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

async function loadRecentQuotes() {
  loadingQuotes.value = true
  try {
    const data = await quotesApi.list({ page: 1, pageSize: 8 })
    recentQuotes.value = data.quotes || data || []
    stats.value[1].value = data.total || recentQuotes.value.length
    stats.value[1].formattedValue = stats.value[1].value.toString()
  } catch (error) {
    console.error('Failed to load recent quotes:', error)
  } finally {
    loadingQuotes.value = false
  }
}

function loadCurrentUser() {
  try {
    const userStr = localStorage.getItem('currentUser')
    if (userStr) {
      currentUser.value = JSON.parse(userStr)
    }
  } catch (error) {
    console.error('Failed to load current user:', error)
  }
}

async function refreshData() {
  refreshing.value = true
  await Promise.all([loadStats(), loadRecentQuotes()])
  refreshing.value = false
}

onMounted(() => {
  loadCurrentUser()
  loadStats()
  loadRecentQuotes()
})
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-info {
  .page-title {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    margin: 0;
  }

  .page-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 8px 0 0;
  }
}

.refresh-btn {
  padding: 8px 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  }
}

.stat-icon-wrapper {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;

  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin: 0;
  }

  .stat-value {
    font-size: 32px;
    font-weight: bold;
    color: #1f2937;
    margin: 8px 0;
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .stat-change {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 8px;
    border-radius: 12px;

    &.positive {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    &.negative {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 20px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.quote-link {
  color: #409eff;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.amount {
  font-weight: 600;
  color: #303133;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.quick-actions-card {
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
    padding: 12px;
    font-weight: 500;
  }
}

.status-chart {
  padding: 16px;

  .chart-item {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .chart-label {
      width: 60px;
      font-size: 13px;
      color: #6b7280;
    }

    .chart-bar-wrapper {
      flex: 1;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .chart-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .chart-value {
      width: 70px;
      text-align: right;
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }
  }
}

.todo-list {
  padding: 16px;

  .todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px dashed #f0f0f0;
    cursor: pointer;
    transition: background 0.2s;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f9fafb;
      margin: 0 -16px;
      padding-left: 16px;
      padding-right: 16px;
      border-radius: 8px;
    }

    .task-text {
      flex: 1;
      font-size: 13px;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;

      &.done {
        text-decoration: line-through;
        color: #9ca3af;
      }

      .task-icon {
        width: 20px;
        height: 20px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;

        &.quote {
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
        }

        &.customer {
          background: rgba(103, 194, 54, 0.1);
          color: #67c23a;
        }

        &.product {
          background: rgba(245, 108, 108, 0.1);
          color: #f56c6c;
        }

        &.system {
          background: rgba(250, 173, 20, 0.1);
          color: #e6a23c;
        }

        &.message {
          background: rgba(156, 136, 255, 0.1);
          color: #9c88ff;
        }
      }
    }

    .task-count {
      font-size: 12px;
      color: #fff;
      background: #409eff;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 500;
    }
  }
}

.empty-todo {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: #909399;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.badge {
  font-size: 12px;
  color: #fff;
  background: #f56c6c;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
  margin-left: 8px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .side-content {
    order: -1;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon sales">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月销售额</div>
            <div class="stat-value">¥{{ statistics.monthlySales.toLocaleString() }}</div>
            <div class="stat-change" :class="statistics.salesChange >= 0 ? 'up' : 'down'">
              {{ statistics.salesChange >= 0 ? '↑' : '↓' }} {{ Math.abs(statistics.salesChange) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon purchase">
            <el-icon><ShoppingCart /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">本月采购额</div>
            <div class="stat-value">¥{{ statistics.monthlyPurchase.toLocaleString() }}</div>
            <div class="stat-change">本月订单 {{ statistics.purchaseOrders }} 笔</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon production">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">生产工单</div>
            <div class="stat-value">{{ statistics.workOrders }}</div>
            <div class="stat-change">
              <span style="color: #67c23a">进行中 {{ statistics.inProgressOrders }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon inventory">
            <el-icon><Box /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">库存预警</div>
            <div class="stat-value">{{ statistics.inventoryAlerts }}</div>
            <div class="stat-change" style="color: #f56c6c">待处理预警</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>销售趋势</span>
          </template>
          <div ref="salesChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div ref="orderChartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="$router.push('/orders')">查看更多</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" border size="small">
            <el-table-column prop="orderNo" label="订单号" width="140" />
            <el-table-column prop="customerName" label="客户" width="120" />
            <el-table-column prop="orderDate" label="日期" width="100" />
            <el-table-column prop="totalAmount" label="金额" width="100">
              <template #default="{ row }">
                <span>¥{{ row.totalAmount?.toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/orders')">
              <el-icon><Plus /></el-icon>
              新建订单
            </el-button>
            <el-button type="success" @click="$router.push('/production')">
              <el-icon><Setting /></el-icon>
              生产工单
            </el-button>
            <el-button type="warning" @click="$router.push('/inventory')">
              <el-icon><Box /></el-icon>
              库存管理
            </el-button>
            <el-button type="info" @click="$router.push('/finance')">
              <el-icon><Money /></el-icon>
              财务管理
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <span>待处理事项</span>
          </template>
          <el-scrollbar height="200px">
            <div class="todo-list">
              <div v-for="item in todoItems" :key="item.id" class="todo-item" @click="handleTodo(item)">
                <el-icon :color="item.color"><component :is="item.icon" /></el-icon>
                <span>{{ item.title }}</span>
                <el-tag size="small" :type="item.tagType">{{ item.count }}</el-tag>
              </div>
              <el-empty v-if="todoItems.length === 0" description="暂无待处理事项" :image-size="60" />
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { TrendCharts, ShoppingCart, Setting, Box, Plus, Money, Bell, Warning, Clock } from '@element-plus/icons-vue'

const router = useRouter()
const salesChartRef = ref(null)
const orderChartRef = ref(null)

const statistics = reactive({
  monthlySales: 156800,
  salesChange: 12.5,
  monthlyPurchase: 98500,
  purchaseOrders: 24,
  workOrders: 15,
  inProgressOrders: 8,
  inventoryAlerts: 3
})

const recentOrders = ref([
  { orderNo: 'SO20260518001', customerName: '深圳电器批发', orderDate: '2026-05-18', totalAmount: 25800, status: '待生产' },
  { orderNo: 'SO20260517002', customerName: '广州五金公司', orderDate: '2026-05-17', totalAmount: 15600, status: '生产中' },
  { orderNo: 'SO20260517001', customerName: '东莞线材批发', orderDate: '2026-05-17', totalAmount: 32400, status: '已发货' },
  { orderNo: 'SO20260516003', customerName: '佛山电子科技', orderDate: '2026-05-16', totalAmount: 18900, status: '已完工' },
  { orderNo: 'SO20260516002', customerName: '惠州电器批发', orderDate: '2026-05-16', totalAmount: 25600, status: '已发货' }
])

const todoItems = ref([
  { id: 1, title: '待处理预警', icon: Warning, color: '#f56c6c', tagType: 'danger', count: 3, link: '/alerts' },
  { id: 2, title: '待发货订单', icon: Clock, color: '#e6a23c', tagType: 'warning', count: 5, link: '/orders' },
  { id: 3, title: '库存不足', icon: Box, color: '#909399', tagType: 'info', count: 2, link: '/inventory' },
  { id: 4, title: '应收款催款', icon: Money, color: '#67c23a', tagType: 'success', count: 4, link: '/finance' }
])

function getOrderStatusType(status) {
  const map = {
    '待生产': 'info',
    '生产中': 'warning',
    '已完工': 'success',
    '已发货': 'primary',
    '已取消': 'danger'
  }
  return map[status] || 'info'
}

function handleTodo(item) {
  router.push(item.link)
}

async function loadStatistics() {
  try {
    const [ordersRes, productionRes, inventoryRes, alertsRes] = await Promise.all([
      fetch('/api/orders'),
      fetch('/api/production'),
      fetch('/api/inventory'),
      fetch('/api/alerts')
    ])

    if (ordersRes.ok) {
      const result = await ordersRes.json()
      if (result.success && result.data) {
        const orders = result.data
        const thisMonth = new Date().toISOString().slice(0, 7)
        const monthlyOrders = orders.filter(o => o.orderDate?.startsWith(thisMonth))
        statistics.monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
        statistics.purchaseOrders = monthlyOrders.filter(o => o.orderType === '采购').length
        recentOrders.value = orders.slice(0, 5)
      }
    }

    if (productionRes.ok) {
      const result = await productionRes.json()
      if (result.success && result.data) {
        statistics.workOrders = result.data.length
        statistics.inProgressOrders = result.data.filter(o => o.status === '生产中').length
      }
    }

    if (inventoryRes.ok) {
      const result = await inventoryRes.json()
      if (result.success && result.data) {
        statistics.inventoryAlerts = result.data.filter(i => i.availableQuantity < i.minStock).length
      }
    }

    if (alertsRes.ok) {
      const result = await alertsRes.json()
      if (result.success && result.data) {
        const pendingAlerts = result.data.filter(a => a.status === 'pending')
        const alertItem = todoItems.value.find(t => t.title === '待处理预警')
        if (alertItem) alertItem.count = pendingAlerts.length
      }
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  margin-right: 15px;
}

.stat-icon.sales { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.purchase { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.production { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.inventory { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-change {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.stat-change.up { color: #67c23a; }
.stat-change.down { color: #f56c6c; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.todo-list {
  padding: 5px 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.todo-item:hover {
  background: #f5f7fa;
}

.todo-item:last-child {
  border-bottom: none;
}
</style>

<template>
  <div class="srm-page">
    <div class="page-header">
      <div class="header-info">
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">SRM供应商关系管理系统</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon> 刷新数据
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card" v-for="stat in stats" :key="stat.title">
        <div class="stat-icon-wrapper" :style="{ background: stat.gradient }">
          <el-icon :size="32" :color="stat.iconColor">
            <component :is="stat.icon" />
          </el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-label">{{ stat.title }}</p>
          <h2 class="stat-value">{{ stat.value }}</h2>
          <div class="stat-desc">{{ stat.desc }}</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="main-content">
        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><ShoppingCart /></el-icon> 最近采购订单
            </h3>
            <el-button type="text" @click="$router.push('/purchase')">查看全部</el-button>
          </div>
          <el-table :data="orderData" style="width: 100%" v-loading="loading" border>
            <el-table-column prop="orderNumber" label="订单号" width="150" />
            <el-table-column prop="supplierName" label="供应商" min-width="150" />
            <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="orderDate" label="下单日期" width="120" />
            <el-table-column prop="totalAmount" label="金额" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ row.totalAmount?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><TrendCharts /></el-icon> 采购趋势分析
            </h3>
          </div>
          <div class="chart-container">
            <div class="chart-bars">
              <div v-for="(item, index) in trendData" :key="index" class="chart-bar-item">
                <div class="bar-wrapper">
                  <div 
                    class="bar" 
                    :style="{ height: (item.amount / maxTrendAmount * 100) + '%' }"
                    :title="`¥${item.amount.toLocaleString()}`"
                  >
                    <span class="bar-tooltip">¥{{ item.amount.toLocaleString() }}</span>
                  </div>
                </div>
                <span class="bar-label">{{ item.week }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <div class="side-content">
        <el-card class="card quick-actions-card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Grid /></el-icon> 模块导航
            </h3>
          </div>
          <div class="quick-actions">
            <div class="action-grid">
              <div class="action-item" @click="$router.push('/suppliers')">
                <el-icon :size="28" color="#409eff"><OfficeBuilding /></el-icon>
                <span>供应商管理</span>
              </div>
              <div class="action-item" @click="$router.push('/purchase')">
                <el-icon :size="28" color="#67c23a"><ShoppingCart /></el-icon>
                <span>采购订单</span>
              </div>
              <div class="action-item" @click="$router.push('/contracts')">
                <el-icon :size="28" color="#e6a23c"><Document /></el-icon>
                <span>合同管理</span>
              </div>
              <div class="action-item" @click="$router.push('/performance')">
                <el-icon :size="28" color="#909399"><DataAnalysis /></el-icon>
                <span>绩效评估</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Warning /></el-icon> 待审核供应商
            </h3>
            <span class="badge">{{ pendingSuppliers.length }}</span>
          </div>
          <div class="alert-list">
            <div v-for="item in pendingSuppliers" :key="item.id" class="alert-item">
              <div class="alert-info">
                <span class="alert-name">{{ item.supplierName }}</span>
                <span class="alert-code">{{ item.supplierCode }}</span>
              </div>
              <el-button type="text" size="small" @click="handleViewSupplier(item)">查看</el-button>
            </div>
            <div v-if="pendingSuppliers.length === 0" class="empty-state">
              <el-icon :size="32" color="#67c23a"><CircleCheck /></el-icon>
              <p>暂无待审核供应商</p>
            </div>
          </div>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><Star /></el-icon> 优质供应商
            </h3>
          </div>
          <div class="supplier-list">
            <div v-for="item in topSuppliers" :key="item.id" class="supplier-item">
              <div class="supplier-rank">{{ getRankIcon(item.rank) }}</div>
              <div class="supplier-info">
                <span class="supplier-name">{{ item.supplierName }}</span>
                <span class="supplier-amount">累计采购 ¥{{ formatAmount(item.totalAmount) }}</span>
              </div>
              <el-rate v-model="item.rating" disabled size="small" />
            </div>
          </div>
        </el-card>

        <el-card class="card">
          <div class="card-header">
            <h3 class="card-title">
              <el-icon><PieChart /></el-icon> 订单状态分布
            </h3>
          </div>
          <div class="status-chart">
            <div v-for="item in statusDistribution" :key="item.status" class="status-item">
              <div class="status-info">
                <el-tag :type="item.type" size="small">{{ item.label }}</el-tag>
                <span class="status-count">{{ item.count }}</span>
              </div>
              <div class="status-bar-wrapper">
                <div class="status-bar" :style="{ width: item.percentage + '%', background: item.color }"></div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, OfficeBuilding, ShoppingCart, Document, DataAnalysis,
  Grid, Warning, CircleCheck, TrendCharts, Star, PieChart
} from '@element-plus/icons-vue'

const loading = ref(false)

const stats = reactive([
  { title: '供应商总数', value: '0', desc: '已认证供应商', icon: OfficeBuilding, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', iconColor: '#fff' },
  { title: '本月采购', value: '¥0.00', desc: '采购支出', icon: ShoppingCart, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', iconColor: '#fff' },
  { title: '待处理订单', value: '0', desc: '待确认订单', icon: Warning, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', iconColor: '#fff' },
  { title: '有效合同', value: '0', desc: '执行中合同', icon: Document, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', iconColor: '#fff' }
])

const supplierData = ref([])
const orderData = ref([])
const pendingSuppliers = ref([])
const trendData = ref([])
const topSuppliers = ref([])
const statusDistribution = ref([])

const maxTrendAmount = computed(() => {
  if (trendData.value.length === 0) return 1
  return Math.max(...trendData.value.map(t => t.amount))
})

function getCategoryText(category) {
  const texts = { raw: '原材料', auxiliary: '辅材', equipment: '设备', service: '服务' }
  return texts[category] || category
}

function getStatusType(status) {
  const types = { certified: 'success', pending: 'warning', disabled: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { certified: '已认证', pending: '待审核', disabled: '已禁用' }
  return texts[status] || status
}

function getOrderStatusType(status) {
  const types = { 
    pending: 'warning', 
    confirmed: 'primary', 
    shipped: 'success', 
    received: 'success' 
  }
  return types[status] || 'info'
}

function getOrderStatusText(status) {
  const texts = { 
    pending: '待确认', 
    confirmed: '已确认', 
    shipped: '已发货', 
    received: '已收货' 
  }
  return texts[status] || status
}

function formatAmount(amount) {
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toLocaleString()
}

function getRankIcon(rank) {
  const icons = ['🥇', '🥈', '🥉', '4', '5']
  return icons[rank - 1] || rank
}

async function fetchDashboardStats() {
  try {
    const [supplierRes, orderRes, contractRes] = await Promise.all([
      fetch('http://localhost:3001/api/suppliers'),
      fetch('http://localhost:3001/api/purchase-orders'),
      fetch('http://localhost:3001/api/contracts')
    ])

    if (supplierRes.ok) {
      const supplierResult = await supplierRes.json()
      if (supplierResult.success) {
        const totalSuppliers = supplierResult.total || 0
        stats[0].value = totalSuppliers
      }
    }

    if (orderRes.ok) {
      const orderResult = await orderRes.json()
      if (orderResult.success && orderResult.data) {
        const orders = orderResult.data
        const pendingOrders = orders.filter(o => o.status === 'pending').length
        const confirmedOrders = orders.filter(o => o.status === 'confirmed').length
        const shippedOrders = orders.filter(o => o.status === 'shipped').length
        const receivedOrders = orders.filter(o => o.status === 'received').length
        const totalOrders = orders.length

        const monthlyAmount = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        stats[1].value = `¥${monthlyAmount.toLocaleString()}`
        stats[2].value = pendingOrders

        statusDistribution.value = [
          { status: 'pending', label: '待确认', count: pendingOrders, percentage: totalOrders > 0 ? (pendingOrders / totalOrders * 100) : 0, type: 'warning', color: '#e6a23c' },
          { status: 'confirmed', label: '已确认', count: confirmedOrders, percentage: totalOrders > 0 ? (confirmedOrders / totalOrders * 100) : 0, type: 'primary', color: '#409eff' },
          { status: 'shipped', label: '已发货', count: shippedOrders + receivedOrders, percentage: totalOrders > 0 ? ((shippedOrders + receivedOrders) / totalOrders * 100) : 0, type: 'success', color: '#67c23a' }
        ]
      }
    }

    if (contractRes.ok) {
      const contractResult = await contractRes.json()
      if (contractResult.success) {
        const activeContracts = contractResult.data?.filter(c => c.status === 'active')?.length || 0
        stats[3].value = activeContracts
      }
    }
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error)
  }
}

async function fetchPurchaseOrders() {
  try {
    const response = await fetch('http://localhost:3001/api/purchase-orders?page=1&pageSize=5')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        orderData.value = result.data.map(item => ({
          orderNumber: item.order_number,
          supplierName: item.supplier_name,
          materialName: item.material_name,
          orderDate: item.created_at?.split(' ')[0] || '',
          totalAmount: item.total_amount,
          status: item.status
        }))
      }
    }
  } catch (error) {
    console.error('获取采购订单失败:', error)
  }
}

async function fetchSuppliers() {
  try {
    const response = await fetch('http://localhost:3001/api/suppliers')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        supplierData.value = result.data

        pendingSuppliers.value = result.data
          .filter(s => s.status === 'pending')
          .slice(0, 3)
          .map(s => ({
            id: s.id,
            supplierName: s.company_name,
            supplierCode: s.supplier_code
          }))
      }
    }
  } catch (error) {
    console.error('获取供应商数据失败:', error)
  }
}

async function fetchTrendData() {
  try {
    const response = await fetch('http://localhost:3001/api/purchase-orders')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        const weeklyData = {}
        const today = new Date()
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const weekKey = `${date.getMonth() + 1}/${date.getDate()}`
          weeklyData[weekKey] = 0
        }

        result.data.forEach(order => {
          const orderDate = order.created_at?.split(' ')[0]
          if (orderDate) {
            const date = new Date(orderDate)
            const weekKey = `${date.getMonth() + 1}/${date.getDate()}`
            if (weeklyData[weekKey] !== undefined) {
              weeklyData[weekKey] += order.total_amount || 0
            }
          }
        })

        trendData.value = Object.entries(weeklyData).map(([week, amount]) => ({
          week,
          amount: Math.round(amount / 1000) * 1000
        }))
      }
    }
  } catch (error) {
    console.error('获取采购趋势数据失败:', error)
  }
}

async function fetchTopSuppliers() {
  try {
    const response = await fetch('http://localhost:3001/api/supplier-performance')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        topSuppliers.value = result.data
          .filter(s => s.supplier_code)
          .slice(0, 5)
          .map((s, index) => ({
            id: s.id,
            supplierName: s.supplier_name || '未知供应商',
            totalAmount: s.total_amount || 0,
            rating: Math.round(s.overall_rating) || 4,
            rank: index + 1
          }))
      }
    }
  } catch (error) {
    console.error('获取优质供应商数据失败:', error)
  }
}

async function refreshData() {
  loading.value = true
  await Promise.all([
    fetchDashboardStats(),
    fetchPurchaseOrders(),
    fetchSuppliers(),
    fetchTrendData(),
    fetchTopSuppliers()
  ])
  loading.value = false
  ElMessage.success('数据已刷新')
}

function handleViewSupplier(item) {
  $router.push(`/suppliers/${item.id}`)
}

onMounted(() => {
  refreshData()
})
</script>

<style lang="scss" scoped>
.srm-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-info {
  h1 {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;

  .stat-label {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 4px 0;
  }

  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .stat-desc {
    font-size: 12px;
    color: #9ca3af;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .badge {
      background: #ef4444;
      color: #fff;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
}

.chart-container {
  padding: 20px 0;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 180px;
  padding: 0 10px;
}

.chart-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 12%;
}

.bar-wrapper {
  height: 140px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 24px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s ease;

  .bar-tooltip {
    display: none;
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1f2937;
    color: #fff;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    margin-bottom: 8px;
  }

  &:hover .bar-tooltip {
    display: block;
  }
}

.bar-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

.quick-actions-card {
  .action-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    span {
      font-size: 13px;
      color: #4b5563;
      margin-top: 8px;
    }

    &:hover {
      background: #f3f4f6;
      transform: translateY(-2px);
    }
  }
}

.alert-list {
  .alert-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }

    .alert-info {
      display: flex;
      flex-direction: column;

      .alert-name {
        font-size: 14px;
        color: #1f2937;
      }

      .alert-code {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 0;
    color: #9ca3af;

    p {
      margin-top: 8px;
      font-size: 14px;
    }
  }
}

.supplier-list {
  .supplier-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;

    &:last-child {
      border-bottom: none;
    }

    .supplier-rank {
      font-size: 20px;
      margin-right: 12px;
    }

    .supplier-info {
      flex: 1;
      display: flex;
      flex-direction: column;

      .supplier-name {
        font-size: 14px;
        color: #1f2937;
      }

      .supplier-amount {
        font-size: 12px;
        color: #9ca3af;
      }
    }
  }
}

.status-chart {
  .status-item {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .status-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;

      .status-count {
        font-size: 14px;
        font-weight: 600;
        color: #1f2937;
      }
    }

    .status-bar-wrapper {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .status-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
}

.amount {
  color: #1f2937;
  font-weight: 500;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
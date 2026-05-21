<template>
  <div class="page-container">
    <div class="page-header">
      <h1>供应商绩效评估</h1>
      <p>评估与监控供应商表现</p>
    </div>
    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索供应商名称"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <el-table :data="tableData" border style="width: 100%" v-loading="loading">
        <el-table-column prop="supplierName" label="供应商" min-width="180" />
        <el-table-column prop="deliveryRate" label="准时交货率" width="130" align="center">
          <template #default="{ row }">
            <span :class="getRateClass(row.deliveryRate)">{{ row.deliveryRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="qualityScore" label="质量评分" width="130" align="center">
          <template #default="{ row }">
            <el-rate :model-value="row.qualityScore" disabled size="small" show-score />
          </template>
        </el-table-column>
        <el-table-column prop="responseTime" label="响应时间" width="130" align="center">
          <template #default="{ row }">
            <span>{{ row.responseTime }}h</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="总订单数" width="100" align="right" />
        <el-table-column prop="totalAmount" label="合作金额" width="130" align="right">
          <template #default="{ row }">
            <span>¥{{ row.totalAmount?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="综合评级" width="130" align="center">
          <template #default="{ row }">
            <el-tag :type="getPerformanceType(row.overallRating)" effect="dark">
              {{ row.overallRatingText }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="total"
          class="pagination"
          @current-change="pagination.page = $event; loadPerformance()"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const tableData = ref([])
const total = ref(0)
const searchKeyword = ref('')
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

function getRateClass(rate) {
  if (rate >= 95) return 'text-success'
  if (rate >= 85) return 'text-warning'
  return 'text-danger'
}

function getPerformanceType(rating) {
  if (rating === 'A') return 'success'
  if (rating === 'B') return 'warning'
  if (rating === 'C') return 'danger'
  return 'info'
}

function getRatingText(rating) {
  const texts = { A: '优秀', B: '良好', C: '一般', D: '较差' }
  return texts[rating] || rating
}

async function loadPerformance() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value || ''
    })
    const response = await fetch(`http://localhost:3001/api/supplier-performance?${params}`)
    const data = await response.json()
    if (data.success) {
      tableData.value = data.data.map(item => ({
        ...item,
        supplierName: item.supplier_name,
        deliveryRate: item.delivery_rate,
        qualityScore: item.quality_score,
        responseTime: item.response_time,
        totalOrders: item.total_orders,
        totalAmount: item.total_amount,
        overallRating: item.overall_rating,
        overallRatingText: getRatingText(item.overall_rating)
      }))
      total.value = data.total
    }
  } catch (error) {
    console.error('加载绩效数据失败:', error)
    ElMessage.error('加载绩效数据失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadPerformance()
}

onMounted(() => {
  loadPerformance()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

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

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .search-input {
    width: 300px;
  }
}

.text-success {
  color: #67c23a;
  font-weight: 500;
}

.text-warning {
  color: #e6a23c;
  font-weight: 500;
}

.text-danger {
  color: #f56c6c;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.pagination {
  text-align: right;
}
</style>
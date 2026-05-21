<template>
  <div class="order-container">
    <div class="page-header">
      <div class="header-content">
        <h1>我的订单</h1>
        <p>查看和管理您的采购订单</p>
      </div>
    </div>

    <div class="status-tabs">
      <el-tabs v-model="activeStatus" @tab-change="handleStatusChange">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane label="待确认" name="pending" />
        <el-tab-pane label="已确认" name="confirmed" />
        <el-tab-pane label="已发货" name="shipped" />
        <el-tab-pane label="已收货" name="received" />
        <el-tab-pane label="已完成" name="completed" />
        <el-tab-pane label="已取消" name="cancelled" />
      </el-tabs>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索订单号、物料编号、物料名称"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-picker"
        />
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <el-table :data="filteredOrders" border style="width: 100%" @selection-change="handleSelectionChange" ref="tableRef">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="orderNo" label="订单编号" width="160" />
        <el-table-column prop="materialCode" label="物料编号" width="140" />
        <el-table-column prop="materialName" label="物料名称" min-width="180" />
        <el-table-column prop="specification" label="规格型号" width="140" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unitPrice" label="单价(元)" width="110">
          <template #default="{ row }">{{ row.unitPrice.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="120">
          <template #default="{ row }">{{ row.amount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="deliveryDate" label="交货日期" width="140">
          <template #default="{ row }">{{ formatDate(row.deliveryDate) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click.stop="viewOrder(row)">查看详情</el-button>
            <template v-if="row.status === 'pending'">
              <el-button size="small" type="primary" @click.stop="confirmOrder(row)">确认订单</el-button>
            </template>
            <template v-if="row.status === 'confirmed'">
              <el-button size="small" type="success" @click.stop="shipOrder(row)">确认发货</el-button>
            </template>
            <template v-if="row.status === 'shipped'">
              <el-button size="small" type="info" @click.stop="uploadDelivery(row)">上传送货单</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-4">
        <div class="flex gap-2">
          <el-button 
            v-if="selectedRows.length > 0" 
            type="danger" 
            @click="handleBatchDelete"
            :disabled="selectedRows.length === 0"
          >
            <el-icon><Box /></el-icon> 批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="filteredOrders.length"
          class="pagination"
          @current-change="pagination.page = $event"
          @size-change="pagination.pageSize = $event"
        />
      </div>
    </el-card>

    <el-dialog title="订单详情" :visible.sync="showOrderDetail" width="800px">
      <div v-if="selectedOrder" class="order-detail">
        <div class="detail-header">
          <div class="order-info">
            <span class="order-no">订单编号：{{ selectedOrder.orderNo }}</span>
            <el-tag :type="getStatusType(selectedOrder.status)">{{ getStatusText(selectedOrder.status) }}</el-tag>
          </div>
          <div class="order-date">创建时间：{{ formatDate(selectedOrder.createdAt) }}</div>
        </div>

        <div class="detail-section">
          <h3>物料信息</h3>
          <table class="detail-table">
            <tr>
              <th>物料编号</th>
              <th>物料名称</th>
              <th>规格型号</th>
              <th>数量</th>
              <th>单位</th>
              <th>单价(元)</th>
              <th>金额(元)</th>
            </tr>
            <tr>
              <td>{{ selectedOrder.materialCode }}</td>
              <td>{{ selectedOrder.materialName }}</td>
              <td>{{ selectedOrder.specification }}</td>
              <td>{{ selectedOrder.quantity }}</td>
              <td>{{ selectedOrder.unit }}</td>
              <td>{{ selectedOrder.unitPrice.toFixed(2) }}</td>
              <td>{{ selectedOrder.amount.toFixed(2) }}</td>
            </tr>
          </table>
        </div>

        <div class="detail-section">
          <h3>交货信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>交货日期</label>
              <span>{{ formatDate(selectedOrder.deliveryDate) }}</span>
            </div>
            <div class="info-item">
              <label>交货地点</label>
              <span>{{ selectedOrder.deliveryAddress }}</span>
            </div>
            <div class="info-item">
              <label>收货联系人</label>
              <span>{{ selectedOrder.receiver }}</span>
            </div>
            <div class="info-item">
              <label>联系电话</label>
              <span>{{ selectedOrder.receiverPhone }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>订单备注</h3>
          <p class="remark">{{ selectedOrder.remark || '无' }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="showOrderDetail = false">关闭</el-button>
        <template v-if="selectedOrder?.status === 'pending'">
          <el-button type="primary" @click="confirmOrder(selectedOrder)">确认订单</el-button>
        </template>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { Search, Box } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeStatus = ref('all')
const searchKeyword = ref('')
const dateRange = ref([])
const showOrderDetail = ref(false)
const selectedOrder = ref(null)
const selectedRows = ref([])
const tableRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const orders = ref([
  {
    id: 1,
    orderNo: 'PO20260518001',
    materialCode: 'M-CU-2501',
    materialName: '铜材A',
    specification: '规格A',
    quantity: 1000,
    unit: 'kg',
    unitPrice: 58.50,
    amount: 58500.00,
    deliveryDate: '2026-05-25T00:00:00.000Z',
    status: 'pending',
    deliveryAddress: '广东省深圳市南山区科技园A栋',
    receiver: '张经理',
    receiverPhone: '13800138001',
    remark: '请按时交货',
    createdAt: '2026-05-18T09:00:00.000Z'
  },
  {
    id: 2,
    orderNo: 'PO20260518002',
    materialCode: 'M-PL-001',
    materialName: '塑料颗粒B',
    specification: '规格B',
    quantity: 2000,
    unit: 'kg',
    unitPrice: 12.30,
    amount: 24600.00,
    deliveryDate: '2026-05-28T00:00:00.000Z',
    status: 'confirmed',
    deliveryAddress: '广东省深圳市南山区科技园B栋',
    receiver: '李小姐',
    receiverPhone: '13800138002',
    remark: '',
    createdAt: '2026-05-18T10:00:00.000Z'
  },
  {
    id: 3,
    orderNo: 'PO20260517001',
    materialCode: 'M-EL-001',
    materialName: '电子元件C',
    specification: '规格C',
    quantity: 5000,
    unit: '个',
    unitPrice: 2.50,
    amount: 12500.00,
    deliveryDate: '2026-05-20T00:00:00.000Z',
    status: 'shipped',
    deliveryAddress: '广东省深圳市南山区科技园A栋',
    receiver: '王经理',
    receiverPhone: '13800138003',
    remark: '加急订单',
    createdAt: '2026-05-17T14:00:00.000Z'
  },
  {
    id: 4,
    orderNo: 'PO20260516001',
    materialCode: 'A-PK-001',
    materialName: '包装材料D',
    specification: '规格D',
    quantity: 10000,
    unit: '个',
    unitPrice: 0.80,
    amount: 8000.00,
    deliveryDate: '2026-05-18T00:00:00.000Z',
    status: 'completed',
    deliveryAddress: '广东省深圳市南山区科技园C栋',
    receiver: '赵经理',
    receiverPhone: '13800138004',
    remark: '',
    createdAt: '2026-05-16T11:00:00.000Z'
  },
  {
    id: 5,
    orderNo: 'PO20260515001',
    materialCode: 'E-MC-001',
    materialName: '机械设备E',
    specification: '规格E',
    quantity: 10,
    unit: '台',
    unitPrice: 15000.00,
    amount: 150000.00,
    deliveryDate: '2026-05-22T00:00:00.000Z',
    status: 'pending',
    deliveryAddress: '广东省深圳市南山区科技园A栋',
    receiver: '刘主任',
    receiverPhone: '13800138005',
    remark: '需要提前确认交期',
    createdAt: '2026-05-15T09:00:00.000Z'
  }
])

const filteredOrders = computed(() => {
  let result = orders.value

  if (activeStatus.value !== 'all') {
    result = result.filter(item => item.status === activeStatus.value)
  }

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.orderNo.toLowerCase().includes(keyword) ||
      item.materialCode.toLowerCase().includes(keyword) ||
      item.materialName.toLowerCase().includes(keyword)
    )
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    endDate.setHours(23, 59, 59, 999)
    result = result.filter(item => {
      const orderDate = new Date(item.createdAt)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  return result
})

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    shipped: '已发货',
    received: '已收货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

function getStatusType(status) {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    shipped: 'info',
    received: 'success',
    completed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

function handleStatusChange() {
  pagination.page = 1
}

function handleSearch() {
  pagination.page = 1
}

function viewOrder(row) {
  selectedOrder.value = row
  showOrderDetail.value = true
}

function confirmOrder(row) {
  row.status = 'confirmed'
  ElMessage.success('订单已确认')
  showOrderDetail.value = false
}

function shipOrder(row) {
  row.status = 'shipped'
  ElMessage.success('已确认发货')
}

function uploadDelivery(row) {
  ElMessage.info('送货单上传功能开发中')
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的订单')
    return
  }

  if (!confirm(`确定要删除选中的 ${selectedRows.value.length} 个订单吗？`)) return

  try {
    selectedRows.value.forEach(row => {
      const index = orders.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        orders.value.splice(index, 1)
      }
    })
    ElMessage.success(`已成功删除 ${selectedRows.value.length} 个订单`)
    selectedRows.value = []
  } catch (error) {
    ElMessage.error('批量删除失败')
    console.error('批量删除订单失败:', error)
  }
}
</script>

<style lang="scss" scoped>
.order-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  .header-content {
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
}

.status-tabs {
  margin-bottom: 20px;
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .search-input {
    width: 350px;
  }

  .date-picker {
    width: 300px;
  }
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.order-detail {
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #e4e7ed;
    margin-bottom: 20px;

    .order-info {
      display: flex;
      align-items: center;
      gap: 12px;

      .order-no {
        font-size: 16px;
        font-weight: bold;
        color: #1f2937;
      }
    }
  }

  .detail-section {
    margin-bottom: 24px;

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #3b82f6;
    }
  }

  .detail-table {
    width: 100%;
    border-collapse: collapse;

    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e4e7ed;
    }

    th {
      background: #f9fafb;
      font-weight: 600;
      color: #6b7280;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;

    .info-item {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;

      label {
        display: block;
        font-size: 13px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      span {
        font-size: 14px;
        color: #1f2937;
      }
    }
  }

  .remark {
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;
    margin: 0;
    font-size: 14px;
    color: #374151;
    line-height: 1.6;
  }
}
</style>

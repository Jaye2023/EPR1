<template>
  <div class="page-container">
    <div class="page-header">
      <h1>数据表格示例</h1>
      <p>展示可复用数据表格组件的使用方式</p>
    </div>

    <el-card>
      <DataTable
        ref="tableRef"
        :api-url="apiUrl"
        :columns="columns"
        :show-date-filter="true"
        :filters="filters"
        @view="handleView"
        @row-click="handleRowClick"
        @batch-action="handleBatchAction"
      >
        <!-- 自定义操作按钮 -->
        <template #actions>
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
          <el-button type="warning" @click="showCustomDialog = true">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
        </template>

        <!-- 自定义批量操作 -->
        <template #batch-actions>
          <el-button 
            v-if="selectedRows.length > 0" 
            type="success" 
            size="small" 
            @click="handleBatchConfirm"
          >
            <el-icon><CircleCheck /></el-icon> 批量确认
          </el-button>
          <el-button 
            v-if="selectedRows.length > 0" 
            type="danger" 
            size="small" 
            @click="handleBatchDelete"
          >
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
        </template>

        <!-- 自定义操作列 -->
        <template #operation="{ row }">
          <el-button 
            v-if="row.status === 'pending'" 
            type="primary" 
            link 
            size="small" 
            @click="handleConfirm(row)"
          >确认</el-button>
          <el-button 
            v-if="row.status === 'confirmed'" 
            type="warning" 
            link 
            size="small" 
            @click="handleEdit(row)"
          >编辑</el-button>
          <el-button type="text" link size="small" @click="handleView(row)">详情</el-button>
        </template>

        <!-- 详情弹窗内容 -->
        <template #dialog-content="{ data }">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ data.orderNumber }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(data.status)">{{ getStatusText(data.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="供应商">{{ data.supplierName }}</el-descriptions-item>
            <el-descriptions-item label="物料名称">{{ data.materialName }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ data.quantity }} {{ data.unit }}</el-descriptions-item>
            <el-descriptions-item label="金额">¥{{ data.totalAmount?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="要求交期">{{ data.deliveryDate }}</el-descriptions-item>
            <el-descriptions-item label="确认交期">{{ data.confirmedDate || '待确认' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <!-- 弹窗底部按钮 -->
        <template #dialog-footer>
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button type="primary" @click="handleConfirmSubmit">确认</el-button>
        </template>
      </DataTable>
    </el-card>

    <!-- 新增弹窗 -->
    <el-dialog v-model="showCustomDialog" title="新增数据" width="600px">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="订单号" required>
          <el-input v-model="formData.orderNumber" placeholder="请输入订单号" />
        </el-form-item>
        <el-form-item label="供应商" required>
          <el-input v-model="formData.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="物料名称" required>
          <el-input v-model="formData.materialName" placeholder="请输入物料名称" />
        </el-form-item>
        <el-form-item label="数量">
          <el-input-number v-model="formData.quantity" :min="1" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input v-model="formData.unitPrice" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, Plus, CircleCheck, Delete } from '@element-plus/icons-vue'
import DataTable from '../components/DataTable.vue'

const tableRef = ref(null)
const selectedRows = ref([])
const showCustomDialog = ref(false)

const apiUrl = 'http://localhost:3001/api/purchase-orders'

const formData = reactive({
  orderNumber: '',
  supplierName: '',
  materialName: '',
  quantity: 1,
  unitPrice: 0
})

const columns = [
  { prop: 'orderNumber', label: '订单号', width: 140, sortable: true, type: 'link' },
  { prop: 'createdAt', label: '下单日期', width: 110, sortable: true },
  { prop: 'supplierName', label: '供应商', minWidth: 150 },
  { prop: 'materialName', label: '物料名称', minWidth: 150, showOverflowTooltip: true },
  { prop: 'specification', label: '规格型号', minWidth: 120 },
  { prop: 'quantity', label: '数量', width: 80, align: 'right' },
  { prop: 'unitPrice', label: '单价', width: 80, align: 'right', type: 'money' },
  { prop: 'totalAmount', label: '金额', width: 100, align: 'right', type: 'money' },
  { prop: 'deliveryDate', label: '要求交期', width: 100 },
  { 
    prop: 'status', 
    label: '状态', 
    width: 90, 
    type: 'status',
    statusMap: {
      pending: { label: '待确认', type: 'warning' },
      confirmed: { label: '已确认', type: 'primary' },
      shipped: { label: '已发货', type: 'success' },
      received: { label: '已收货', type: 'success' }
    }
  }
]

const filters = [
  {
    key: 'status',
    label: '状态',
    width: '120px',
    options: [
      { value: 'pending', label: '待确认' },
      { value: 'confirmed', label: '已确认' },
      { value: 'shipped', label: '已发货' },
      { value: 'received', label: '已收货' }
    ]
  },
  {
    key: 'supplier_code',
    label: '供应商编码',
    width: '140px',
    options: [
      { value: 'S001', label: '供应商A' },
      { value: 'S002', label: '供应商B' },
      { value: 'S003', label: '供应商C' }
    ]
  }
]

onMounted(() => {
  if (tableRef.value) {
    tableRef.value.loadData()
  }
})

function handleRefresh() {
  if (tableRef.value) {
    tableRef.value.loadData()
  }
  ElMessage.success('数据已刷新')
}

function handleExport() {
  ElMessage.info('导出功能演示')
}

function handleView(row) {
  console.log('查看详情:', row)
}

function handleEdit(row) {
  console.log('编辑:', row)
  ElMessage.info(`编辑订单: ${row.orderNumber}`)
}

function handleConfirm(row) {
  console.log('确认:', row)
  ElMessage.success(`已确认订单: ${row.orderNumber}`)
}

function handleRowClick(row) {
  console.log('行点击:', row)
}

function handleBatchAction(rows) {
  selectedRows.value = rows
  console.log('批量操作:', rows)
}

function handleBatchConfirm() {
  ElMessage.success(`已批量确认 ${selectedRows.value.length} 条记录`)
}

function handleBatchDelete() {
  ElMessage.warning(`已批量删除 ${selectedRows.value.length} 条记录`)
}

function handleCloseDialog() {
  showCustomDialog.value = false
}

function handleConfirmSubmit() {
  showCustomDialog.value = false
  ElMessage.success('操作成功')
}

function handleAddSubmit() {
  showCustomDialog.value = false
  ElMessage.success('新增成功')
}

function getStatusType(status) {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    shipped: 'success',
    received: 'success'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    shipped: '已发货',
    received: '已收货'
  }
  return texts[status] || status
}
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-header p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}
</style>
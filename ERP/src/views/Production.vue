<template>
  <div class="production-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="searchText" placeholder="搜索工单编号/产品" style="width: 200px" clearable @change="loadData">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="工单状态" style="width: 120px" clearable @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="待生产" value="待生产" />
              <el-option label="生产中" value="生产中" />
              <el-option label="已完工" value="已完工" />
              <el-option label="已入库" value="已入库" />
              <el-option label="已取消" value="已取消" />
            </el-select>
            <el-select v-model="filterLine" placeholder="生产线" style="width: 120px" clearable @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="生产线A" value="生产线A" />
              <el-option label="生产线B" value="生产线B" />
              <el-option label="生产线C" value="生产线C" />
            </el-select>
          </div>
          <div class="action-area">
            <el-button type="success" @click="handleGenerateFromSale">
              <el-icon><Connection /></el-icon>
              销售订单转工单
            </el-button>
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新建工单
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="workOrderNo" label="工单编号" width="150" fixed />
        <el-table-column prop="sourceOrderNo" label="来源订单" width="140">
          <template #default="{ row }">
            <span v-if="row.sourceOrderNo">{{ row.sourceOrderNo }}</span>
            <span v-else style="color: #999">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编号" width="120" />
        <el-table-column prop="productName" label="产品名称" min-width="150" />
        <el-table-column prop="quantity" label="计划数量" width="90" />
        <el-table-column prop="completedQuantity" label="已完成" width="80">
          <template #default="{ row }">
            <span :style="{ color: row.completedQuantity >= row.quantity ? '#67c23a' : '' }">
              {{ row.completedQuantity || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="productionLine" label="生产线" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="planStartDate" label="计划开工" width="110" />
        <el-table-column prop="planEndDate" label="计划完工" width="110" />
        <el-table-column prop="actualStartDate" label="实际开工" width="110" />
        <el-table-column prop="progress" label="进度" width="100">
          <template #default="{ row }">
            <el-progress :percentage="row.progress || 0" :color="getProgressColor(row.progress)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button v-if="row.status === '待生产'" type="success" link size="small" @click="handleStart(row)">开工</el-button>
            <el-button v-if="row.status === '生产中'" type="warning" link size="small" @click="handleReport(row)">报工</el-button>
            <el-button v-if="row.status === '生产中'" type="success" link size="small" @click="handleComplete(row)">完工</el-button>
            <el-button type="danger" link size="small" @click="handleCancel(row)">取消</el-button>
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
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工单编号">
              <el-input v-model="form.workOrderNo" disabled placeholder="系统自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产线" prop="productionLine">
              <el-select v-model="form.productionLine" placeholder="请选择生产线" style="width: 100%">
                <el-option label="生产线A" value="生产线A" />
                <el-option label="生产线B" value="生产线B" />
                <el-option label="生产线C" value="生产线C" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品" prop="materialCode">
              <el-select v-model="form.materialCode" filterable placeholder="请选择产品" style="width: 100%" @change="handleProductChange">
                <el-option v-for="p in products" :key="p.materialCode" :label="`${p.materialCode} - ${p.productName}`" :value="p.materialCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="form.productName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源订单">
              <el-select v-model="form.sourceOrderNo" filterable placeholder="可选" style="width: 100%" clearable>
                <el-option v-for="o in saleOrders" :key="o.orderNumber" :label="o.orderNumber" :value="o.orderNumber" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="计划开工">
              <el-date-picker v-model="form.planStartDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计划完工">
              <el-date-picker v-model="form.planEndDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="BOM用料">
          <el-table :data="bomItems" border size="small">
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" />
            <el-table-column prop="quantity" label="需求数量" width="100" />
            <el-table-column prop="stockQuantity" label="库存数量" width="100" />
            <el-table-column prop="shortage" label="缺料" width="80">
              <template #default="{ row }">
                <span v-if="row.shortage > 0" style="color: #f56c6c">{{ row.shortage }}</span>
                <span v-else style="color: #67c23a">-</span>
              </template>
            </el-table-column>
          </el-table>
          <el-button type="primary" link size="small" @click="handleCheckBom" style="margin-top: 10px">检查物料齐套</el-button>
        </el-form-item>
        <el-form-item label="工序列表">
          <el-table :data="processSteps" border size="small">
            <el-table-column prop="stepName" label="工序名称" />
            <el-table-column prop="workCenter" label="工作中心" width="100" />
            <el-table-column prop="standardHours" label="标准工时" width="80" />
            <el-table-column prop="actualHours" label="实际工时" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.status === '已完成'" type="success" size="small">{{ row.status }}</el-tag>
                <el-tag v-else-if="row.status === '进行中'" type="warning" size="small">{{ row.status }}</el-tag>
                <el-tag v-else type="info" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialogVisible" title="工序报工" width="500px" destroy-on-close>
      <el-form :model="reportForm" ref="reportFormRef" label-width="100px">
        <el-form-item label="工单编号">
          <el-input v-model="reportForm.workOrderNo" disabled />
        </el-form-item>
        <el-form-item label="工序" prop="stepName">
          <el-select v-model="reportForm.stepName" placeholder="请选择工序" style="width: 100%">
            <el-option v-for="s in pendingSteps" :key="s.stepName" :label="s.stepName" :value="s.stepName" />
          </el-select>
        </el-form-item>
        <el-form-item label="报工数量" prop="quantity">
          <el-input-number v-model="reportForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="工时(小时)" prop="hours">
          <el-input-number v-model="reportForm.hours" :min="0" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="报工说明">
          <el-input v-model="reportForm.note" type="textarea" :rows="2" placeholder="请输入说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleReportSubmit">提交报工</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="工单详情" width="800px" destroy-on-close>
      <el-tabs v-if="selectedWorkOrder">
        <el-tab-pane label="工单信息">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="工单编号">{{ selectedWorkOrder.workOrderNo }}</el-descriptions-item>
            <el-descriptions-item label="生产线">{{ selectedWorkOrder.productionLine }}</el-descriptions-item>
            <el-descriptions-item label="物料编号">{{ selectedWorkOrder.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ selectedWorkOrder.productName }}</el-descriptions-item>
            <el-descriptions-item label="计划数量">{{ selectedWorkOrder.quantity }}</el-descriptions-item>
            <el-descriptions-item label="已完成数量">{{ selectedWorkOrder.completedQuantity || 0 }}</el-descriptions-item>
            <el-descriptions-item label="计划开工">{{ selectedWorkOrder.planStartDate }}</el-descriptions-item>
            <el-descriptions-item label="计划完工">{{ selectedWorkOrder.planEndDate }}</el-descriptions-item>
            <el-descriptions-item label="实际开工">{{ selectedWorkOrder.actualStartDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="实际完工">{{ selectedWorkOrder.actualEndDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(selectedWorkOrder.status)">{{ selectedWorkOrder.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="完成进度">
              <el-progress :percentage="selectedWorkOrder.progress || 0" :color="getProgressColor(selectedWorkOrder.progress)" />
            </el-descriptions-item>
            <el-descriptions-item label="来源订单" :span="2">{{ selectedWorkOrder.sourceOrderNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ selectedWorkOrder.remarks || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="物料需求">
          <el-table :data="selectedWorkOrder.bomItems || []" border size="small">
            <el-table-column prop="materialCode" label="物料编号" />
            <el-table-column prop="materialName" label="物料名称" />
            <el-table-column prop="quantity" label="需求数量" />
            <el-table-column prop="stockQuantity" label="库存数量" />
            <el-table-column label="缺料">
              <template #default="{ row }">
                <span v-if="row.shortage > 0" style="color: #f56c6c">{{ row.shortage }}</span>
                <span v-else style="color: #67c23a">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="工序进度">
          <el-table :data="selectedWorkOrder.processSteps || []" border size="small">
            <el-table-column prop="stepName" label="工序名称" />
            <el-table-column prop="workCenter" label="工作中心" />
            <el-table-column prop="standardHours" label="标准工时" />
            <el-table-column prop="actualHours" label="实际工时" />
            <el-table-column label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : row.status === '进行中' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="报工记录">
          <el-table :data="selectedWorkOrder.reportRecords || []" border size="small">
            <el-table-column prop="reportDate" label="报工日期" />
            <el-table-column prop="stepName" label="工序" />
            <el-table-column prop="quantity" label="数量" />
            <el-table-column prop="hours" label="工时" />
            <el-table-column prop="operator" label="操作人" />
            <el-table-column prop="note" label="说明" />
          </el-table>
          <el-empty v-if="!selectedWorkOrder.reportRecords || selectedWorkOrder.reportRecords.length === 0" description="暂无报工记录" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="saleDialogVisible" title="销售订单转工单" width="600px" destroy-on-close>
      <el-form :model="saleForm" label-width="100px">
        <el-form-item label="选择订单">
          <el-select v-model="saleForm.selectedOrderNo" filterable placeholder="请选择销售订单" style="width: 100%" @change="handleSaleOrderChange">
            <el-option v-for="o in availableSaleOrders" :key="o.orderNumber" :label="`${o.orderNumber} - ${o.productName} (${o.quantity}${o.unit})`" :value="o.orderNumber" />
          </el-select>
        </el-form-item>
        <template v-if="saleForm.selectedOrder">
          <el-form-item label="产品">
            <el-input :value="`${saleForm.selectedOrder.materialCode} - ${saleForm.selectedOrder.productName}`" disabled />
          </el-form-item>
          <el-form-item label="订单数量">
            <el-input :value="`${saleForm.selectedOrder.quantity} ${saleForm.selectedOrder.unit}`" disabled />
          </el-form-item>
          <el-form-item label="交付日期">
            <el-input :value="saleForm.selectedOrder.deliveryDate" disabled />
          </el-form-item>
        </template>
        <el-form-item label="生产线" prop="productionLine">
          <el-select v-model="saleForm.productionLine" placeholder="请选择生产线" style="width: 100%">
            <el-option label="生产线A" value="生产线A" />
            <el-option label="生产线B" value="生产线B" />
            <el-option label="生产线C" value="生产线C" />
          </el-select>
        </el-form-item>
        <el-form-item label="计划开工">
          <el-date-picker v-model="saleForm.planStartDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleGenerateWorkOrder">生成工单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Connection } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const filterStatus = ref('')
const filterLine = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const allData = ref([])
const products = ref([])
const saleOrders = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const reportDialogVisible = ref(false)
const saleDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const reportFormRef = ref()
const selectedWorkOrder = ref(null)

const form = ref({
  id: null,
  workOrderNo: '',
  materialCode: '',
  productName: '',
  quantity: 1,
  productionLine: '',
  planStartDate: '',
  planEndDate: '',
  sourceOrderNo: '',
  remarks: ''
})

const reportForm = ref({
  workOrderNo: '',
  stepName: '',
  quantity: 1,
  hours: 0,
  note: ''
})

const saleForm = ref({
  selectedOrderNo: '',
  selectedOrder: null,
  productionLine: '',
  planStartDate: ''
})

const bomItems = ref([])
const processSteps = ref([])

const rules = {
  materialCode: [{ required: true, message: '请选择产品', trigger: 'change' }],
  productionLine: [{ required: true, message: '请选择生产线', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

const displayData = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.workOrderNo?.toLowerCase().includes(text) ||
      item.productName?.toLowerCase().includes(text) ||
      item.materialCode?.toLowerCase().includes(text)
    )
  }
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  if (filterLine.value) {
    data = data.filter(item => item.productionLine === filterLine.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const total = computed(() => displayData.value.length)

const availableSaleOrders = computed(() => {
  return saleOrders.value.filter(o => o.orderType === '销售' && (o.status === '待生产' || o.status === '已发货'))
})

const pendingSteps = computed(() => {
  if (!selectedWorkOrder.value?.processSteps) return []
  return selectedWorkOrder.value.processSteps.filter(s => s.status !== '已完成')
})

function getStatusType(status) {
  const map = { '待生产': 'info', '生产中': 'warning', '已完工': 'success', '已入库': 'success', '已取消': 'danger' }
  return map[status] || 'info'
}

function getProgressColor(progress) {
  if (progress >= 100) return '#67c23a'
  if (progress >= 50) return '#409eff'
  return '#e6a23c'
}

async function loadData() {
  loading.value = true
  try {
    const [woRes, productRes, orderRes] = await Promise.all([
      fetch('/api/production/work-orders'),
      fetch('/api/products'),
      fetch('/api/erp/orders')
    ])

    const woResult = await woRes.json()
    if (woResult.success) allData.value = woResult.data

    const productResult = await productRes.json()
    if (productResult.success) products.value = productResult.data

    const orderResult = await orderRes.json()
    if (orderResult.success) saleOrders.value = orderResult.data
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

function handleProductChange(materialCode) {
  const product = products.value.find(p => p.materialCode === materialCode)
  if (product) {
    form.value.productName = product.productName
  }
  bomItems.value = []
  processSteps.value = [
    { stepName: '裁线', workCenter: '裁线车间', standardHours: 0.5, actualHours: 0, status: '待生产' },
    { stepName: '焊接', workCenter: '焊接工位', standardHours: 1, actualHours: 0, status: '待生产' },
    { stepName: '组装', workCenter: '组装线', standardHours: 2, actualHours: 0, status: '待生产' },
    { stepName: '测试', workCenter: '测试台', standardHours: 0.5, actualHours: 0, status: '待生产' },
    { stepName: '包装', workCenter: '包装区', standardHours: 0.3, actualHours: 0, status: '待生产' }
  ]
}

function handleCheckBom() {
  const sampleBom = [
    { materialCode: 'M-CU-2501', materialName: '铜丝 2.5mm', quantity: form.value.quantity * 0.5, stockQuantity: 100, shortage: 0 },
    { materialCode: 'M-PVC-01', materialName: 'PVC料', quantity: form.value.quantity * 0.2, stockQuantity: 50, shortage: 0 }
  ]
  sampleBom.forEach(item => {
    item.shortage = Math.max(0, item.quantity - item.stockQuantity)
  })
  bomItems.value = sampleBom
}

function handleAdd() {
  dialogTitle.value = '新建工单'
  form.value = {
    id: null,
    workOrderNo: '',
    materialCode: '',
    productName: '',
    quantity: 1,
    productionLine: '',
    planStartDate: '',
    planEndDate: '',
    sourceOrderNo: '',
    remarks: ''
  }
  bomItems.value = []
  processSteps.value = []
  dialogVisible.value = true
}

function handleView(row) {
  selectedWorkOrder.value = { ...row }
  detailDialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const isEdit = form.value.id !== null
  const url = isEdit ? `/api/production/work-orders/${form.value.id}` : '/api/production/work-orders'
  const method = isEdit ? 'PUT' : 'POST'

  const submitData = {
    ...form.value,
    bomItems: bomItems.value,
    processSteps: processSteps.value
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData)
    })

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success(isEdit ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

async function handleStart(row) {
  try {
    await ElMessageBox.confirm(`确定要开工工单 "${row.workOrderNo}" 吗？`, '提示', { type: 'info' })
    const response = await fetch(`/api/production/work-orders/${row.id}/start`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('已开工')
        loadData()
      }
    }
  } catch {}
}

async function handleReport(row) {
  selectedWorkOrder.value = row
  reportForm.value = {
    workOrderNo: row.workOrderNo,
    stepName: '',
    quantity: 1,
    hours: 0,
    note: ''
  }
  reportDialogVisible.value = true
}

async function handleReportSubmit() {
  if (!reportForm.value.stepName) {
    ElMessage.warning('请选择工序')
    return
  }
  try {
    const response = await fetch(`/api/production/work-orders/${selectedWorkOrder.value.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportForm.value)
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('报工成功')
        reportDialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error('报工失败')
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(`确定要完工工单 "${row.workOrderNo}" 吗？`, '提示', { type: 'info' })
    const response = await fetch(`/api/production/work-orders/${row.id}/complete`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('已完工')
        loadData()
      }
    }
  } catch {}
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(`确定要取消工单 "${row.workOrderNo}" 吗？`, '警告', { type: 'warning' })
    const response = await fetch(`/api/production/work-orders/${row.id}/cancel`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('已取消')
        loadData()
      }
    }
  } catch {}
}

function handleGenerateFromSale() {
  saleForm.value = {
    selectedOrderNo: '',
    selectedOrder: null,
    productionLine: '',
    planStartDate: ''
  }
  saleDialogVisible.value = true
}

function handleSaleOrderChange(orderNo) {
  const order = saleOrders.value.find(o => o.orderNumber === orderNo)
  saleForm.value.selectedOrder = order || null
}

async function handleGenerateWorkOrder() {
  if (!saleForm.value.selectedOrderNo || !saleForm.value.productionLine) {
    ElMessage.warning('请选择订单和生产线')
    return
  }
  const order = saleForm.value.selectedOrder
  try {
    const response = await fetch('/api/production/work-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materialCode: order.materialCode,
        productName: order.productName,
        quantity: order.quantity,
        unit: order.unit,
        productionLine: saleForm.value.productionLine,
        planStartDate: saleForm.value.planStartDate,
        planEndDate: order.deliveryDate,
        sourceOrderNo: order.orderNumber
      })
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('工单已生成')
        saleDialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error('生成失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.production-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-area {
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

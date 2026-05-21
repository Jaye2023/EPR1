<template>
  <div class="finance-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="应收款" name="receivable" />
            <el-tab-pane label="应付款" name="payable" />
            <el-tab-pane label="收款记录" name="receipt" />
            <el-tab-pane label="付款记录" name="payment" />
          </el-tabs>
          <div class="action-area">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              {{ activeTab === 'receivable' ? '新增应收' : activeTab === 'payable' ? '新增应付' : '记录' }}
            </el-button>
          </div>
        </div>
        <div class="filter-area">
          <el-input v-model="searchText" placeholder="客户/供应商/单号" style="width: 200px" clearable @change="loadData">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable @change="loadData">
            <el-option label="全部" value="" />
            <el-option v-if="activeTab === 'receivable'" label="未收款" value="未收款" />
            <el-option v-if="activeTab === 'payable'" label="未付款" value="未付款" />
            <el-option v-if="activeTab === 'receivable'" label="部分收款" value="部分收款" />
            <el-option v-if="activeTab === 'payable'" label="部分付款" value="部分付款" />
            <el-option v-if="activeTab === 'receivable'" label="已收款" value="已收款" />
            <el-option v-if="activeTab === 'payable'" label="已付款" value="已付款" />
            <el-option label="已核销" value="已核销" />
          </el-select>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" @change="loadData" />
        </div>
      </template>

      <el-table v-if="activeTab === 'receivable' || activeTab === 'payable'" :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="billNo" label="单据编号" width="150" />
        <el-table-column :prop="activeTab === 'receivable' ? 'customerName' : 'supplierName'" :label="activeTab === 'receivable' ? '客户名称' : '供应商名称'" width="150" />
        <el-table-column :prop="activeTab === 'receivable' ? 'salesOrderNo' : 'purchaseOrderNo'" :label="activeTab === 'receivable' ? '销售单号' : '采购单号'" width="140" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="receivedAmount" label="已收/付" width="120">
          <template #default="{ row }">
            <span style="color: #409eff">¥{{ (row.receivedAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceAmount" label="未收/付" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c">¥{{ (row.amount - (row.receivedAmount || 0)).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="到期日期" width="110" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createDate" label="创建日期" width="110" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleRecord(row)">{{ activeTab === 'receivable' ? '收款' : '付款' }}</el-button>
            <el-button type="success" link size="small" @click="handleVerify(row)">核销</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else :data="recordData" border v-loading="loading" stripe>
        <el-table-column prop="billNo" label="单据编号" width="150" />
        <el-table-column prop="partyName" label="客户/供应商" width="150" />
        <el-table-column prop="recordDate" label="记录日期" width="110" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="收款方式" width="100" />
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="note" label="备注" />
      </el-table>

      <div class="summary-info" v-if="activeTab === 'receivable' || activeTab === 'payable'">
        <span>总{{ activeTab === 'receivable' ? '应收' : '应付' }}：<strong>¥{{ totalAmount.toFixed(2) }}</strong></span>
        <span>已{{ activeTab === 'receivable' ? '收' : '付' }}：<strong style="color: #409eff">¥{{ totalReceived.toFixed(2) }}</strong></span>
        <span>未{{ activeTab === 'receivable' ? '收' : '付' }}：<strong style="color: #f56c6c">¥{{ (totalAmount - totalReceived).toFixed(2) }}</strong></span>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="单据编号">
          <el-input v-model="form.billNo" disabled />
        </el-form-item>
        <el-form-item label="客户/供应商" prop="partyName">
          <el-input v-model="form.partyName" />
        </el-form-item>
        <el-form-item label="关联单号" prop="orderNo">
          <el-input v-model="form.orderNo" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日期" prop="dueDate">
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="recordDialogVisible" :title="activeTab === 'receivable' ? '收款记录' : '付款记录'" width="500px" destroy-on-close>
      <el-table :data="recordList" border size="small">
        <el-table-column prop="recordDate" label="日期" width="110" />
        <el-table-column prop="amount" label="金额" width="100">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="方式" width="100" />
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="note" label="备注" />
      </el-table>
      <el-divider />
      <el-form :model="recordForm" label-width="80px">
        <el-form-item :label="activeTab === 'receivable' ? '收款金额' : '付款金额'">
          <el-input-number v-model="recordForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="activeTab === 'receivable' ? '收款方式' : '付款方式'">
          <el-select v-model="recordForm.paymentMethod" style="width: 100%">
            <el-option label="银行转账" value="银行转账" />
            <el-option label="现金" value="现金" />
            <el-option label="支票" value="支票" />
            <el-option label="承兑汇票" value="承兑汇票" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="recordForm.note" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleRecordSubmit">确认收款</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const loading = ref(false)
const activeTab = ref('receivable')
const searchText = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const allData = ref([])
const allRecords = ref([])
const dialogVisible = ref(false)
const recordDialogVisible = ref(false)
const selectedBill = ref(null)
const recordList = ref([])
const recordData = computed(() => {
  if (activeTab.value === 'receipt') {
    return allRecords.value.filter(r => r.billNo?.startsWith('AR'))
  } else if (activeTab.value === 'payment') {
    return allRecords.value.filter(r => r.billNo?.startsWith('AP'))
  }
  return []
})

const form = ref({
  billNo: '',
  partyName: '',
  orderNo: '',
  amount: 0,
  dueDate: '',
  note: ''
})

const recordForm = ref({
  amount: 0,
  paymentMethod: '银行转账',
  note: ''
})

const dialogTitle = computed(() => {
  if (activeTab.value === 'receivable') return '新增应收'
  if (activeTab.value === 'payable') return '新增应付'
  return '记录'
})

const displayData = computed(() => {
  let data = [...allData.value].filter(d => d.type === activeTab.value)
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.billNo?.toLowerCase().includes(text) ||
      item.customerName?.toLowerCase().includes(text) ||
      item.supplierName?.toLowerCase().includes(text)
    )
  }
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  return data
})

const totalAmount = computed(() => displayData.value.reduce((sum, item) => sum + item.amount, 0))
const totalReceived = computed(() => displayData.value.reduce((sum, item) => sum + (item.receivedAmount || 0), 0))

function getStatusType(row) {
  if (row.status === '已核销') return 'success'
  if (row.status === '已收款' || row.status === '已付款') return 'success'
  if (row.status === '部分收款' || row.status === '部分付款') return 'warning'
  if (row.status === '未收款' || row.status === '未付款') return 'danger'
  return 'info'
}

function generateBillNo() {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const prefix = activeTab.value === 'receivable' ? 'AR' : 'AP'
  return `${prefix}${today}${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    const response = await fetch('/api/finance')
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        allData.value = result.data
      }
    }

    const recordsResponse = await fetch('/api/finance/records')
    if (recordsResponse.ok) {
      const recordsResult = await recordsResponse.json()
      if (recordsResult.success) {
        allRecords.value = recordsResult.data
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  filterStatus.value = ''
  searchText.value = ''
}

function handleAdd() {
  form.value = {
    billNo: generateBillNo(),
    partyName: '',
    orderNo: '',
    amount: 0,
    dueDate: '',
    note: ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.partyName || !form.value.amount) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const response = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form.value, type: activeTab.value })
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

async function handleRecord(row) {
  selectedBill.value = row
  recordForm.value = { amount: 0, paymentMethod: '银行转账', note: '' }
  recordDialogVisible.value = true
  try {
    const response = await fetch(`/api/finance/${row.billNo}/records`)
    if (response.ok) {
      const result = await response.json()
      recordList.value = result.success ? result.data : []
    }
  } catch {
    recordList.value = []
  }
}

async function handleRecordSubmit() {
  if (!recordForm.value.amount) {
    ElMessage.warning(`请输入${activeTab.value === 'receivable' ? '收款' : '付款'}金额`)
    return
  }
  try {
    const response = await fetch(`/api/finance/${selectedBill.value.billNo}/record`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordForm.value)
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success(activeTab.value === 'receivable' ? '收款成功' : '付款成功')
        recordDialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error(activeTab.value === 'receivable' ? '收款失败' : '付款失败')
  }
}

async function handleVerify(row) {
  try {
    const response = await fetch(`/api/finance/${row.billNo}/verify`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('核销成功')
        loadData()
      }
    }
  } catch {
    ElMessage.error('核销失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.finance-container {
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
  margin-top: 15px;
}

.action-area {
  display: flex;
  gap: 10px;
}

.summary-info {
  margin-top: 15px;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 30px;
  font-size: 14px;
}
</style>

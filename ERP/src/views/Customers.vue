<template>
  <div class="customer-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="searchText" placeholder="搜索客户编号/名称" style="width: 240px" clearable @change="loadData">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterType" placeholder="客户类型" style="width: 140px" clearable @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="终端客户" value="终端客户" />
              <el-option label="经销商" value="经销商" />
              <el-option label="OEM客户" value="OEM客户" />
              <el-option label="战略客户" value="战略客户" />
            </el-select>
          </div>
          <div class="action-area">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增客户
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="customerNo" label="客户编号" width="100" />
        <el-table-column prop="name" label="客户名称" min-width="150" />
        <el-table-column prop="customerType" label="客户类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.customerType" type="info" size="small">{{ row.customerType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="paymentMethod" label="结算方式" width="120" />
        <el-table-column prop="creditLimit" label="信用额度" width="110">
          <template #default="{ row }">
            <span v-if="row.creditLimit">¥{{ row.creditLimit.toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="usedCredit" label="已用额度" width="100">
          <template #default="{ row }">
            <span v-if="row.usedCredit">¥{{ row.usedCredit.toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率" width="70">
          <template #default="{ row }">
            {{ row.taxRate ? row.taxRate + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="paymentDays" label="账期" width="80">
          <template #default="{ row }">
            {{ row.paymentDays ? row.paymentDays + '天' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
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
            <el-form-item label="客户编号" prop="customerNo">
              <el-input v-model="form.customerNo" placeholder="系统自动生成" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户类型" prop="customerType">
              <el-select v-model="form.customerType" placeholder="请选择客户类型" style="width: 100%">
                <el-option label="终端客户" value="终端客户" />
                <el-option label="经销商" value="经销商" />
                <el-option label="OEM客户" value="OEM客户" />
                <el-option label="战略客户" value="战略客户" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入客户名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户全称">
              <el-input v-model="form.fullName" placeholder="请输入客户全称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="form.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="电子邮箱">
              <el-input v-model="form.email" placeholder="请输入电子邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号">
              <el-input v-model="form.taxNo" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="结算方式">
              <el-select v-model="form.paymentMethod" placeholder="请选择结算方式" style="width: 100%">
                <el-option label="月结30天" value="月结30天" />
                <el-option label="月结60天" value="月结60天" />
                <el-option label="月结90天" value="月结90天" />
                <el-option label="预付款" value="预付款" />
                <el-option label="货到付款" value="货到付款" />
                <el-option label="票据支付" value="票据支付" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="账期(天)">
              <el-input-number v-model="form.paymentDays" :min="0" :max="365" placeholder="账期" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="信用额度">
              <el-input-number v-model="form.creditLimit" :min="0" :precision="2" placeholder="信用额度" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率(%)">
              <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" placeholder="税率" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开户银行">
              <el-input v-model="form.bankName" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号">
              <el-input v-model="form.bankAccount" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="注册地址">
          <el-input v-model="form.address" placeholder="请输入注册地址" />
        </el-form-item>
        <el-form-item label="收货地址">
          <el-input v-model="form.shippingAddress" placeholder="请输入收货地址" />
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

    <el-dialog v-model="detailDialogVisible" title="客户详情" width="700px" destroy-on-close>
      <el-descriptions :column="2" border v-if="selectedCustomer">
        <el-descriptions-item label="客户编号">{{ selectedCustomer.customerNo }}</el-descriptions-item>
        <el-descriptions-item label="客户类型">
          <el-tag v-if="selectedCustomer.customerType" type="info" size="small">{{ selectedCustomer.customerType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ selectedCustomer.name }}</el-descriptions-item>
        <el-descriptions-item label="客户全称">{{ selectedCustomer.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ selectedCustomer.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ selectedCustomer.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电子邮箱">{{ selectedCustomer.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="税号">{{ selectedCustomer.taxNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="结算方式">{{ selectedCustomer.paymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账期">{{ selectedCustomer.paymentDays ? selectedCustomer.paymentDays + '天' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="信用额度">
          <span v-if="selectedCustomer.creditLimit">¥{{ selectedCustomer.creditLimit.toLocaleString() }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="已用额度">
          <span v-if="selectedCustomer.usedCredit">¥{{ selectedCustomer.usedCredit.toLocaleString() }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="可用额度">
          <span v-if="selectedCustomer.creditLimit && selectedCustomer.usedCredit"
                :style="{ color: (selectedCustomer.creditLimit - selectedCustomer.usedCredit) > 0 ? '#67c23a' : '#f56c6c' }">
            ¥{{ (selectedCustomer.creditLimit - selectedCustomer.usedCredit).toLocaleString() }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="税率">{{ selectedCustomer.taxRate ? selectedCustomer.taxRate + '%' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ selectedCustomer.bankName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账号" :span="2">{{ selectedCustomer.bankAccount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="注册地址" :span="2">{{ selectedCustomer.address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ selectedCustomer.shippingAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ selectedCustomer.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const allData = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const selectedCustomer = ref(null)

const form = ref({
  id: null,
  customerNo: '',
  name: '',
  fullName: '',
  customerType: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  shippingAddress: '',
  paymentMethod: '',
  paymentDays: null,
  creditLimit: null,
  usedCredit: 0,
  taxRate: null,
  taxNo: '',
  bankName: '',
  bankAccount: '',
  remarks: ''
})

const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const displayData = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.customerNo?.toLowerCase().includes(text) ||
      item.name?.toLowerCase().includes(text) ||
      item.fullName?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.customerType === filterType.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const total = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.customerNo?.toLowerCase().includes(text) ||
      item.name?.toLowerCase().includes(text) ||
      item.fullName?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.customerType === filterType.value)
  }
  return data.length
})

async function loadData() {
  loading.value = true
  try {
    const response = await fetch('/api/customers')
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        allData.value = result.data.map(item => ({
          ...item,
          customerNo: item.customerNo,
          fullName: item.fullName,
          customerType: item.customerType,
          shippingAddress: item.shippingAddress,
          paymentDays: item.paymentDays,
          usedCredit: item.usedCredit,
          taxNo: item.taxNo,
          bankName: item.bankName,
          bankAccount: item.bankAccount,
          remarks: item.remarks
        }))
      }
    }
  } catch (error) {
    console.error('加载客户数据失败:', error)
    ElMessage.error('加载客户数据失败')
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  dialogTitle.value = '新增客户'
  form.value = {
    id: null,
    customerNo: '',
    name: '',
    fullName: '',
    customerType: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    shippingAddress: '',
    paymentMethod: '',
    paymentDays: null,
    creditLimit: null,
    usedCredit: 0,
    taxRate: null,
    taxNo: '',
    bankName: '',
    bankAccount: '',
    remarks: ''
  }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑客户'
  form.value = { ...row }
  dialogVisible.value = true
}

function handleView(row) {
  selectedCustomer.value = { ...row }
  detailDialogVisible.value = true
}

function handleEditFromDetail() {
  detailDialogVisible.value = false
  handleEdit(selectedCustomer.value)
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const isEdit = form.value.id !== null
  const url = isEdit ? `/api/customers/${form.value.id}` : '/api/customers'
  const method = isEdit ? 'PUT' : 'POST'

  const submitData = {
    ...form.value,
    status: 'active',
    sourceSystem: 'ERP'
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
        ElMessage.success(isEdit ? '更新成功' : '新增成功')
        dialogVisible.value = false
        loadData()
      }
    } else {
      ElMessage.error('操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除客户 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await fetch(`/api/customers/${row.id}`, { method: 'DELETE' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('删除成功')
        loadData()
      }
    }
  } catch {
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.customer-container {
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
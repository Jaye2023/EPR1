<template>
  <div class="customers-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>客户管理</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>客户列表</span>
          <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon> 添加客户
          </el-button>
        </div>
      </template>

      <div class="flex gap-3 mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索客户名称、联系人..."
          style="width: 300px"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-select v-model="filterType" placeholder="客户类型" style="width: 140px" clearable @change="loadData">
          <el-option label="全部" value="" />
          <el-option label="终端客户" value="终端客户" />
          <el-option label="经销商" value="经销商" />
          <el-option label="OEM客户" value="OEM客户" />
          <el-option label="战略客户" value="战略客户" />
        </el-select>
        <el-button @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="customerNo" label="客户编号" width="100" show-overflow-tooltip />
        <el-table-column prop="name" label="客户名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="fullName" label="公司全称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="customerType" label="客户类型" width="90" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag v-if="row.customerType" type="info" size="small">{{ row.customerType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="contactPerson" label="联系人" width="90" show-overflow-tooltip />
        <el-table-column prop="phone" label="电话" width="120" show-overflow-tooltip />
        <el-table-column prop="paymentMethod" label="付款方式" width="100" show-overflow-tooltip />
        <el-table-column prop="creditLimit" label="信用额度" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.creditLimit">¥{{ row.creditLimit.toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="usedCredit" label="已用额度" width="110" align="right">
          <template #default="{ row }">
            <span v-if="row.usedCredit">¥{{ row.usedCredit.toLocaleString() }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentDays" label="账期" width="80">
          <template #default="{ row }">
            {{ row.paymentDays ? row.paymentDays + '天' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="140">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="success" @click="openDetailDialog(row)">详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-4">
        <el-button v-if="selectedRows.length > 0" type="danger" @click="handleBatchDelete">
          批量删除 ({{ selectedRows.length }})
        </el-button>
        <div v-else></div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户编号" prop="customerNo">
              <el-input v-model="form.customerNo" placeholder="请输入客户编号" />
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
            <el-form-item label="公司全称" prop="fullName">
              <el-input v-model="form.fullName" placeholder="请输入公司全称" />
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
            <el-form-item label="电话" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税号" prop="taxNo">
              <el-input v-model="form.taxNo" placeholder="请输入税号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="付款方式" prop="paymentMethod">
              <el-select v-model="form.paymentMethod" placeholder="请选择付款方式" style="width: 100%">
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
            <el-form-item label="开户银行" prop="bankName">
              <el-input v-model="form.bankName" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bankAccount">
              <el-input v-model="form.bankAccount" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="收货地址" prop="shippingAddress">
          <el-input v-model="form.shippingAddress" placeholder="请输入收货地址" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="客户详情" width="700px">
      <el-descriptions :column="2" border v-if="selectedCustomer">
        <el-descriptions-item label="客户编号">{{ selectedCustomer.customerNo }}</el-descriptions-item>
        <el-descriptions-item label="客户类型">
          <el-tag v-if="selectedCustomer.customerType" type="info" size="small">{{ selectedCustomer.customerType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ selectedCustomer.name }}</el-descriptions-item>
        <el-descriptions-item label="公司全称">{{ selectedCustomer.fullName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ selectedCustomer.contactPerson || '-' }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ selectedCustomer.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ selectedCustomer.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="税号">{{ selectedCustomer.taxNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="付款方式">{{ selectedCustomer.paymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账期">{{ selectedCustomer.paymentDays ? selectedCustomer.paymentDays + '天' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="税率">{{ selectedCustomer.taxRate ? selectedCustomer.taxRate + '%' : '-' }}</el-descriptions-item>
        <el-descriptions-item label="信用额度">
          <span v-if="selectedCustomer.creditLimit">¥{{ selectedCustomer.creditLimit.toLocaleString() }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="已用额度">
          <span v-if="selectedCustomer.usedCredit">¥{{ selectedCustomer.usedCredit.toLocaleString() }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="可用额度">
          <span v-if="selectedCustomer.creditLimit !== undefined && selectedCustomer.usedCredit !== undefined"
                :style="{ color: (selectedCustomer.creditLimit - selectedCustomer.usedCredit) > 0 ? '#67c23a' : '#f56c6c' }">
            ¥{{ (selectedCustomer.creditLimit - selectedCustomer.usedCredit).toLocaleString() }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ selectedCustomer.bankName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行账号" :span="2">{{ selectedCustomer.bankAccount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ selectedCustomer.address || '-' }}</el-descriptions-item>
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
import { ref, reactive, onMounted } from 'vue'
import { customersApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const selectedCustomer = ref(null)

const searchKeyword = ref('')
const filterType = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('')

const formRef = ref()
const form = reactive({
  id: null,
  customerNo: '',
  name: '',
  fullName: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  shippingAddress: '',
  paymentMethod: '',
  customerType: '',
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
  phone: [{ required: true, message: '请输入电话', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value,
      customerType: filterType.value
    }
    const data = await customersApi.list(params)
    
    if (data.success) {
      tableData.value = data.data || []
      pagination.total = data.total || 0
    } else {
      tableData.value = []
      pagination.total = 0
    }
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function openAddDialog() {
  dialogTitle.value = '添加客户'
  form.id = null
  Object.assign(form, {
    customerNo: '',
    name: '',
    fullName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    shippingAddress: '',
    paymentMethod: '',
    customerType: '',
    paymentDays: null,
    creditLimit: null,
    usedCredit: 0,
    taxRate: null,
    taxNo: '',
    bankName: '',
    bankAccount: '',
    remarks: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑客户'
  form.id = row.id
  Object.assign(form, {
    customerNo: row.customerNo || '',
    name: row.name,
    fullName: row.fullName || '',
    contactPerson: row.contactPerson || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    shippingAddress: row.shippingAddress || '',
    paymentMethod: row.paymentMethod || '',
    customerType: row.customerType || '',
    paymentDays: row.paymentDays || null,
    creditLimit: row.creditLimit || null,
    usedCredit: row.usedCredit || 0,
    taxRate: row.taxRate || null,
    taxNo: row.taxNo || '',
    bankName: row.bankName || '',
    bankAccount: row.bankAccount || '',
    remarks: row.remarks || ''
  })
  dialogVisible.value = true
}

function openDetailDialog(row) {
  selectedCustomer.value = { ...row }
  detailDialogVisible.value = true
}

function handleEditFromDetail() {
  detailDialogVisible.value = false
  openEditDialog(selectedCustomer.value)
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const submitData = {
      customerNo: form.customerNo,
      name: form.name,
      fullName: form.fullName,
      contactPerson: form.contactPerson,
      phone: form.phone,
      email: form.email,
      address: form.address,
      shippingAddress: form.shippingAddress,
      paymentMethod: form.paymentMethod,
      customerType: form.customerType,
      paymentDays: form.paymentDays,
      creditLimit: form.creditLimit,
      usedCredit: form.usedCredit,
      taxRate: form.taxRate,
      taxNo: form.taxNo,
      bankName: form.bankName,
      bankAccount: form.bankAccount,
      remarks: form.remarks,
      status: 'active',
      sourceSystem: 'SQS'
    }

    if (form.id) {
      await customersApi.update(form.id, submitData)
      ElMessage.success('更新成功')
    } else {
      await customersApi.create(submitData)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除客户 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await customersApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch {
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的客户')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个客户吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    for (const row of selectedRows.value) {
      await customersApi.delete(row.id)
    }
    ElMessage.success(`已删除 ${selectedRows.value.length} 个客户`)
    selectedRows.value = []
    loadData()
  } catch {
  }
}

onMounted(() => {
  loadData()
})
</script>
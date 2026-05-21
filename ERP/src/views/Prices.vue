<template>
  <div class="price-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="searchText" placeholder="搜索物料编号/名称" style="width: 240px" clearable @change="loadData">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterType" placeholder="价格类型" style="width: 140px" clearable @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="客户售价" value="customer" />
              <el-option label="供应商核价" value="supplier" />
              <el-option label="最低限价" value="min" />
              <el-option label="历史价" value="history" />
            </el-select>
          </div>
          <div class="action-area">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增价格
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="materialCode" label="物料编号" width="130" />
        <el-table-column prop="productName" label="产品名称" min-width="150" />
        <el-table-column prop="priceType" label="价格类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriceTypeTag(row.priceType)" size="small">
              {{ getPriceTypeName(row.priceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户/供应商" width="150">
          <template #default="{ row }">
            {{ row.customerName || row.supplierName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="100">
          <template #default="{ row }">
            <span v-if="row.unitPrice">¥{{ row.unitPrice.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="minPrice" label="最低限价" width="100">
          <template #default="{ row }">
            <span v-if="row.minPrice">¥{{ row.minPrice.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="maxPrice" label="最高限价" width="100">
          <template #default="{ row }">
            <span v-if="row.maxPrice">¥{{ row.maxPrice.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="taxRate" label="税率" width="70">
          <template #default="{ row }">
            {{ row.taxRate ? row.taxRate + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="effectiveDate" label="生效日期" width="110" />
        <el-table-column prop="expiryDate" label="失效日期" width="110" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '启用' ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格类型" prop="priceType">
              <el-select v-model="form.priceType" placeholder="请选择价格类型" style="width: 100%" @change="handlePriceTypeChange">
                <el-option label="客户售价" value="customer" />
                <el-option label="供应商核价" value="supplier" />
                <el-option label="最低限价" value="min" />
                <el-option label="最高限价" value="max" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="form.status" style="width: 100%">
                <el-option label="启用" value="启用" />
                <el-option label="禁用" value="禁用" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品" prop="materialCode">
              <el-select v-model="form.materialCode" filterable placeholder="请选择产品" style="width: 100%" @change="handleProductChange">
                <el-option
                  v-for="p in products"
                  :key="p.materialCode"
                  :label="`${p.materialCode} - ${p.productName}`"
                  :value="p.materialCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品名称">
              <el-input v-model="form.productName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="form.priceType === 'customer'">
          <el-col :span="12">
            <el-form-item label="客户" prop="customerId">
              <el-select v-model="form.customerId" filterable placeholder="请选择客户" style="width: 100%" @change="handleCustomerChange">
                <el-option
                  v-for="c in customers"
                  :key="c.id"
                  :label="c.name"
                  :value="c.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户名称">
              <el-input v-model="form.customerName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="form.priceType === 'supplier'">
          <el-col :span="12">
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="form.supplierId" filterable placeholder="请选择供应商" style="width: 100%" @change="handleSupplierChange">
                <el-option
                  v-for="s in suppliers"
                  :key="s.id"
                  :label="s.name"
                  :value="s.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商名称">
              <el-input v-model="form.supplierName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="税率(%)">
              <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生效日期">
              <el-date-picker v-model="form.effectiveDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="失效日期">
              <el-date-picker v-model="form.expiryDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
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
const products = ref([])
const customers = ref([])
const suppliers = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const form = ref({
  id: null,
  priceType: 'customer',
  materialCode: '',
  productName: '',
  customerId: null,
  customerName: '',
  supplierId: null,
  supplierName: '',
  unitPrice: null,
  minPrice: null,
  maxPrice: null,
  taxRate: null,
  effectiveDate: '',
  expiryDate: '',
  status: '启用',
  remarks: ''
})

const rules = {
  priceType: [{ required: true, message: '请选择价格类型', trigger: 'change' }],
  materialCode: [{ required: true, message: '请选择产品', trigger: 'change' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

const displayData = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.materialCode?.toLowerCase().includes(text) ||
      item.productName?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.priceType === filterType.value)
  }
  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const total = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.materialCode?.toLowerCase().includes(text) ||
      item.productName?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.priceType === filterType.value)
  }
  return data.length
})

function getPriceTypeTag(type) {
  const map = { customer: '', supplier: 'warning', min: 'danger', max: 'success' }
  return map[type] || 'info'
}

function getPriceTypeName(type) {
  const map = { customer: '客户售价', supplier: '供应商核价', min: '最低限价', max: '最高限价' }
  return map[type] || type
}

async function loadData() {
  loading.value = true
  try {
    const [priceRes, productRes, customerRes, supplierRes] = await Promise.all([
      fetch('/api/prices'),
      fetch('/api/products'),
      fetch('/api/customers'),
      fetch('/api/suppliers')
    ])

    const priceResult = await priceRes.json()
    if (priceResult.success) allData.value = priceResult.data

    const productResult = await productRes.json()
    if (productResult.success) products.value = productResult.data

    const customerResult = await customerRes.json()
    if (customerResult.success) customers.value = customerResult.data

    const supplierResult = await supplierRes.json()
    if (supplierResult.success) suppliers.value = supplierResult.data
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

function handlePriceTypeChange() {
  form.value.customerId = null
  form.value.customerName = ''
  form.value.supplierId = null
  form.value.supplierName = ''
}

function handleProductChange(materialCode) {
  const product = products.value.find(p => p.materialCode === materialCode)
  if (product) {
    form.value.productName = product.productName
  }
}

function handleCustomerChange(customerId) {
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    form.value.customerName = customer.name
  }
}

function handleSupplierChange(supplierId) {
  const supplier = suppliers.value.find(s => s.id === supplierId)
  if (supplier) {
    form.value.supplierName = supplier.name
  }
}

function handleAdd() {
  dialogTitle.value = '新增价格'
  form.value = {
    id: null,
    priceType: 'customer',
    materialCode: '',
    productName: '',
    customerId: null,
    customerName: '',
    supplierId: null,
    supplierName: '',
    unitPrice: null,
    minPrice: null,
    maxPrice: null,
    taxRate: null,
    effectiveDate: '',
    expiryDate: '',
    status: '启用',
    remarks: ''
  }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑价格'
  form.value = { ...row }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  const isEdit = form.value.id !== null
  const url = isEdit ? `/api/prices/${form.value.id}` : '/api/prices'
  const method = isEdit ? 'PUT' : 'POST'

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
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
    await ElMessageBox.confirm(`确定要删除这条价格记录吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await fetch(`/api/prices/${row.id}`, { method: 'DELETE' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('删除成功')
        loadData()
      }
    }
  } catch {
    // cancelled
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.price-container {
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

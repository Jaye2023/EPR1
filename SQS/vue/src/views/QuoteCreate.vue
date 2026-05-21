<template>
  <div class="quote-create-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/quotes' }">报价单管理</el-breadcrumb-item>
      <el-breadcrumb-item>新建报价单</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span>新建报价单</span>
          <div class="flex gap-2">
            <el-button @click="goBack">
              <el-icon><ArrowLeft /></el-icon> 返回列表
            </el-button>
          </div>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="quote-form">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="客户" prop="customerCode">
              <el-select 
                v-model="form.customerCode" 
                style="width: 100%" 
                placeholder="请选择客户" 
                filterable
                clearable
                @change="onCustomerChange"
              >
                <el-option v-for="c in customers" :key="c.customerCode" :label="`${c.name} (${c.customerCode})`" :value="c.customerCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价人" prop="salespersonId">
              <el-select 
                v-model="form.salespersonId" 
                style="width: 100%" 
                placeholder="请选择报价人"
                clearable
              >
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价日期" prop="quoteDate">
              <el-date-picker 
                v-model="form.quoteDate" 
                type="date" 
                style="width: 100%" 
                :placeholder="`请选择报价日期`"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="有效日期">
              <el-date-picker v-model="form.validUntil" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价单号">
              <el-input v-model="form.quoteNumber" disabled placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货币">
              <el-select v-model="form.currency" style="width: 100%">
                <el-option label="人民币" value="CNY" />
                <el-option label="美元" value="USD" />
                <el-option label="欧元" value="EUR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <div v-if="selectedCustomer" class="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div class="flex gap-6 text-sm">
            <div>
              <span class="text-gray">客户名称：</span>
              <span class="font-medium">{{ selectedCustomer.name }}</span>
            </div>
            <div>
              <span class="text-gray">联系人：</span>
              <span>{{ selectedCustomer.contactPerson || '-' }}</span>
            </div>
            <div>
              <span class="text-gray">联系电话：</span>
              <span>{{ selectedCustomer.phone || '-' }}</span>
            </div>
            <div>
              <span class="text-gray">地址：</span>
              <span>{{ selectedCustomer.address || '-' }}</span>
            </div>
          </div>
        </div>
        
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="付款方式">
              <el-select v-model="form.paymentMethod" style="width: 100%" placeholder="请选择付款方式" clearable>
                <el-option label="电汇" value="电汇" />
                <el-option label="信用证" value="信用证" />
                <el-option label="托收" value="托收" />
                <el-option label="现金" value="现金" />
                <el-option label="月结" value="月结" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价有效期铜价">
              <el-input v-model="form.validityTerm" placeholder="请输入报价有效期铜价" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税率">
              <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" style="width: 100%" placeholder="税率%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="货物交付地址">
              <el-input v-model="form.deliveryTerm" placeholder="请输入货物交付地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">报价明细</el-divider>
        
        <div class="quote-items">
          <el-table :data="form.items" border style="width: 100%" :show-header="true" class="quote-items-table">
            <el-table-column type="index" label="序号" width="60" fixed />
            <el-table-column prop="materialCode" label="物料编号" width="200" fixed>
              <template #default="{ row, $index }">
                <div class="flex items-center gap-1">
                  <el-autocomplete
                    v-model="row.materialCode"
                    :fetch-suggestions="(queryString, cb) => handleProductSearchSuggestions(queryString, cb)"
                    placeholder="输入或选择"
                    style="flex: 1"
                    @select="(item) => handleProductSelect(item, row, $index)"
                    @blur="handleProductSearch(row, $index)"
                    @keyup.enter="handleProductSearch(row, $index)"
                  >
                    <template #item="{ item }">
                      <span>{{ item.materialCode }} - {{ item.description }}</span>
                    </template>
                  </el-autocomplete>
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="Search" 
                    circle 
                    title="打开物料库"
                    @click="openMaterialDialog($index)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="产品描述" min-width="280">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="产品描述" />
              </template>
            </el-table-column>
            <el-table-column prop="wireSpec" label="规格" width="140">
              <template #default="{ row }">
                <el-input v-model="row.wireSpec" placeholder="规格" disabled />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :precision="0" style="width: 100%" @change="recalculateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100">
              <template #default="{ row }">
                <el-select v-model="row.unit" style="width: 100%" placeholder="选择单位">
                  <el-option label="个" value="pcs" />
                  <el-option label="米" value="m" />
                  <el-option label="套" value="set" />
                  <el-option label="卷" value="roll" />
                  <el-option label="件" value="piece" />
                  <el-option label="公斤" value="kg" />
                  <el-option label="箱" value="box" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价(元)" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="4" style="width: 100%" @change="recalculateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额(元)" width="130" align="right">
              <template #default="{ row }">
                <span class="font-medium text-primary">¥{{ row.amount?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row, $index }">
                <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-between items-center mt-2">
            <span class="text-gray text-sm">共 {{ form.items.length }} 项</span>
            <el-button type="success" size="small" @click="addItem">
              <el-icon><Plus /></el-icon> 添加明细
            </el-button>
          </div>
        </div>

        <el-row class="mt-4" style="border-top: 2px solid #ddd; padding-top: 15px;">
          <el-col :span="16">
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray">明细数量：</span>
                <span class="font-semibold">{{ form.items.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-gray">明细项数：</span>
                <span class="font-semibold">{{ form.items.length }} 项</span>
              </div>
              <div>
                <span class="text-gray">货币：</span>
                <span class="font-semibold">{{ getCurrencyText(form.currency) }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8" class="text-right">
            <div v-if="form.taxRate && form.taxRate > 0" class="text-sm mb-1">
              <span class="text-gray">税额({{ form.taxRate }}%)：</span>
              <span>¥{{ form.taxAmount?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="text-gray mb-1">合计金额</div>
            <div class="text-2xl font-bold text-primary">¥{{ form.totalAmount?.toFixed(2) || '0.00' }}</div>
          </el-col>
        </el-row>
      </el-form>
      
      <div class="flex justify-end gap-2 mt-4">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存报价单</el-button>
      </div>
    </el-card>

    <!-- 物料选择对话框 -->
    <el-dialog v-model="materialDialogVisible" title="选择物料" width="900px" :close-on-click-modal="false">
      <div class="mb-4">
        <el-input
          v-model="materialSearchKeyword"
          placeholder="输入物料编号、名称或描述搜索"
          style="width: 300px"
          clearable
          @keyup.enter="searchMaterials"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="searchMaterials" class="ml-2">搜索</el-button>
      </div>
      <el-table 
        :data="materialList" 
        v-loading="materialLoading" 
        @row-click="handleMaterialRowClick"
        highlight-current-row
        border
        style="cursor: pointer"
        height="400"
      >
        <el-table-column prop="materialCode" label="物料编号" width="150" />
        <el-table-column prop="description" label="产品描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="wireSpec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(4) || '0.0000' }}</template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="selectMaterial(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="materialPagination.page"
          v-model:page-size="materialPagination.pageSize"
          :total="materialPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="searchMaterials"
          @current-change="searchMaterials"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { quotesApi, authApi, customersApi, productsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { Plus, Search, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const submitting = ref(false)
const formRef = ref()
const customers = ref([])
const users = ref([])

const materialDialogVisible = ref(false)
const materialSearchKeyword = ref('')
const materialList = ref([])
const materialLoading = ref(false)
const materialPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})
let currentItemIndex = null

const form = reactive({
  id: null,
  quoteNumber: '',
  customerCode: '',
  salespersonId: '',
  quoteDate: new Date(),
  validUntil: null,
  paymentMethod: '',
  deliveryTerm: '',
  validityTerm: '',
  remarks: '',
  status: 'draft',
  totalAmount: 0,
  currency: 'CNY',
  taxRate: 0,
  taxAmount: 0,
  items: [{
    materialCode: '',
    description: '',
    wireSpec: '',
    formula: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    amount: 0
  }]
})

const selectedCustomer = computed(() => {
  if (!form.customerCode) return null
  return customers.value.find(c => c.customerCode === form.customerCode) || null
})

const rules = {
  customerCode: [{ required: true, message: '请选择客户', trigger: 'change' }],
  salespersonId: [{ required: true, message: '请选择报价人', trigger: 'change' }],
  quoteDate: [{ required: true, message: '请选择报价日期', trigger: 'change' }]
}

function validateItems() {
  const invalidItems = form.items.filter(item => !item.materialCode?.trim())
  if (invalidItems.length > 0) {
    ElMessage.warning(`有 ${invalidItems.length} 行明细未填写物料编号`)
    return false
  }
  
  const invalidQuantity = form.items.filter(item => !item.quantity || item.quantity <= 0)
  if (invalidQuantity.length > 0) {
    ElMessage.warning('请确保所有明细数量都大于0')
    return false
  }
  
  return true
}

function getCurrencyText(currency) {
  const map = { CNY: '人民币', USD: '美元', EUR: '欧元' }
  return map[currency] || currency
}

function addItem() {
  form.items.push({
    materialCode: '',
    description: '',
    wireSpec: '',
    formula: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    amount: 0
  })
}

function removeItem(index) {
  form.items.splice(index, 1)
  recalculateTotal()
}

function recalculateTotal() {
  let subtotal = 0
  form.items.forEach(item => {
    item.amount = (item.quantity || 0) * (item.unitPrice || 0)
    subtotal += item.amount
  })
  
  const taxRate = form.taxRate || 0
  form.taxAmount = subtotal * (taxRate / 100)
  form.totalAmount = subtotal + form.taxAmount
}

function onCustomerChange() {
  recalculateTotal()
}

const productSuggestions = ref([])

function openMaterialDialog(index) {
  currentItemIndex = index
  materialSearchKeyword.value = ''
  materialPagination.page = 1
  materialPagination.pageSize = 20
  searchMaterials()
  materialDialogVisible.value = true
}

async function searchMaterials() {
  materialLoading.value = true
  try {
    const params = {
      page: materialPagination.page,
      pageSize: materialPagination.pageSize,
      search: materialSearchKeyword.value
    }
    const data = await productsApi.list(params)
    materialList.value = data.products || data.data || []
    materialPagination.total = data.total || materialList.value.length
  } catch (error) {
    console.error('搜索物料失败:', error)
    ElMessage.error('搜索物料失败')
  } finally {
    materialLoading.value = false
  }
}

function handleMaterialRowClick(row) {
  selectMaterial(row)
}

function selectMaterial(row) {
  const item = form.items[currentItemIndex]
  if (item) {
    item.materialCode = row.materialCode
    item.description = row.description || ''
    item.wireSpec = row.wireSpec || ''
    item.unitPrice = row.unitPrice || 0
    item.unit = row.unit || 'pcs'
    item.formula = row.formula || ''
    recalculateTotal()
  }
  materialDialogVisible.value = false
  ElMessage.success('已选择物料')
}

async function handleProductSearchSuggestions(queryString, cb) {
  if (!queryString.trim()) {
    cb([])
    return
  }
  
  try {
    const data = await productsApi.search(queryString)
    productSuggestions.value = data || []
    cb(productSuggestions.value)
  } catch (error) {
    console.error('Failed to search products:', error)
    cb([])
  }
}

function handleProductSelect(item, row, index) {
  row.materialCode = item.materialCode
  row.description = item.description || ''
  row.unitPrice = item.unitPrice || 0
  row.unit = item.unit || 'pcs'
  row.wireSpec = item.wireSpec || ''
  row.formula = item.formula || ''
  recalculateTotal()
  ElMessage.success('已加载物料信息')
}

async function handleProductSearch(row, index) {
  const materialCode = row.materialCode?.trim()
  if (!materialCode) return

  try {
    const data = await productsApi.getByItemNumber(materialCode)
    if (data) {
      row.description = data.description || ''
      row.unitPrice = data.unitPrice || 0
      row.unit = data.unit || 'pcs'
      row.wireSpec = data.wireSpec || ''
      row.formula = data.formula || ''
      recalculateTotal()
      ElMessage.success('已加载物料信息')
    } else {
      ElMessage.warning(`未找到物料编号: ${materialCode}`)
    }
  } catch (error) {
    console.error('Failed to load product:', error)
    ElMessage.error(`加载物料失败: ${error.message}`)
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    if (!validateItems()) {
      return
    }
    
    if (form.items.length === 0) {
      ElMessage.warning('请至少添加一条报价明细')
      return
    }
    
    submitting.value = true

    recalculateTotal()

    const cleanItems = form.items.map(item => ({
      materialCode: item.materialCode,
      description: item.description,
      wireSpec: item.wireSpec || '',
      formula: item.formula || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      amount: item.amount
    }))

    const subtotal = form.items.reduce((sum, item) => sum + item.amount, 0)
    
    const quoteData = {
      customerCode: form.customerCode,
      salespersonId: form.salespersonId,
      quoteDate: form.quoteDate.toISOString().split('T')[0],
      validUntil: form.validUntil ? form.validUntil.toISOString().split('T')[0] : null,
      currency: form.currency,
      paymentMethod: form.paymentMethod,
      deliveryTerm: form.deliveryTerm,
      validityTerm: form.validityTerm,
      taxRate: form.taxRate,
      taxAmount: form.taxAmount,
      subtotal: subtotal,
      totalAmount: form.totalAmount,
      status: form.status,
      remark: form.remarks,
      items: cleanItems
    }

    await quotesApi.create(quoteData)
    ElMessage.success('报价单创建成功')
    
    router.push('/quotes')
  } catch (error) {
    if (error !== false) {
      console.error('保存报价单失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

function goBack() {
  router.push('/quotes')
}

async function loadCustomers() {
  try {
    const data = await customersApi.list({ page: 1, pageSize: 200 })
    customers.value = data.data || data.customers || []
  } catch (error) {
    console.error('Failed to load customers:', error)
  }
}

async function loadUsers() {
  try {
    const data = await authApi.getUsers()
    const userList = data.data || data || []
    users.value = userList.filter(u => u.status === 'active' && u.role === 'salesperson')
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

onMounted(async () => {
  await Promise.all([loadCustomers(), loadUsers()])
})
</script>
<template>
  <div class="materials-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>物料管理</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>物料列表</span>
          <div class="flex gap-2">
            <el-button @click="exportCsv">导出CSV</el-button>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon> 添加物料
            </el-button>
          </div>
        </div>
      </template>

      <div class="flex gap-3 mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索物料名称、描述..."
          style="width: 300px"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button @click="loadData">搜索</el-button>
        <el-button type="success" @click="handleCalculateAll" :loading="calculating">
          <el-icon><PriceTag /></el-icon> 计算所有单价
        </el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="materialCode" label="物料编号" width="120" />
        <el-table-column prop="productName" label="物料名称" width="180" />
        <el-table-column prop="description" label="物料描述" min-width="250" :cell-style="{ whiteSpace: 'normal', wordBreak: 'break-all' }">
          <template #default="{ row }">
            <span class="description-text">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价(元)" width="100" align="right">
          <template #default="{ row }">
            <span class="font-bold text-primary">¥{{ row.unitPrice?.toFixed(2) || '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerPartNo" label="客户料号" width="120" />
        <el-table-column prop="plugModel" label="插头型号" width="120" />
        <el-table-column prop="plugPrice" label="插头价(元)" width="110" align="right">
          <template #default="{ row }">
            ¥{{ row.plugPrice?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="wireSpec" label="电线规格" min-width="150" show-overflow-tooltip />
        <el-table-column prop="wireUnitPrice" label="单价(元/米)" width="110" align="right">
          <template #default="{ row }">
            ¥{{ row.wireUnitPrice?.toFixed(4) || '0.0000' }}
          </template>
        </el-table-column>
        <el-table-column prop="length" label="长度(米)" width="100" align="right">
          <template #default="{ row }">
            {{ row.length || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="100">
          <template #default="{ row }">
            <el-tag size="small" v-if="row.color">{{ row.color }}</el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="tailProcessing" label="尾部处理" min-width="120" :cell-style="{ whiteSpace: 'normal', wordBreak: 'break-all' }">
          <template #default="{ row }">
            <span>{{ row.tailProcessing || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tailProcessingPrice" label="尾处费(元)" width="110" align="right">
          <template #default="{ row }">
            ¥{{ row.tailProcessingPrice?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="customerNo" label="客户编号" width="100" />
        <el-table-column prop="partNo" label="料号" width="100" />
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="计算公式" width="120">
          <template #default="{ row }">
            <el-popover
              v-if="row.unitPrice"
              trigger="hover"
              placement="top"
              width="420"
            >
              <div class="formula-detail p-2">
                <div class="font-bold mb-2 text-sm">计算明细</div>
                <div class="text-xs space-y-1">
                  <div>电线总价 = {{ row.wireUnitPrice?.toFixed(4) || '0.0000' }} × {{ row.length || 0 }}米</div>
                  <div class="pl-2">= ¥{{ row.wirePrice?.toFixed(2) || '0.00' }}</div>
                  <div>插头价格 = ¥{{ row.plugPrice?.toFixed(2) || '0.00' }}</div>
                  <div>尾部处理 = ¥{{ row.tailProcessingPrice?.toFixed(2) || '0.00' }}</div>
                  <div class="border-t mt-1 pt-1 font-semibold">
                    单价 = {{ row.wirePrice?.toFixed(2) || '0.00' }} + {{ row.plugPrice?.toFixed(2) || '0.00' }} + {{ row.tailProcessingPrice?.toFixed(2) || '0.00' }}
                  </div>
                  <div class="text-primary font-bold">= ¥{{ row.unitPrice?.toFixed(2) }} 元</div>
                </div>
              </div>
              <template #reference>
                <el-button link type="primary" size="small">查看</el-button>
              </template>
            </el-popover>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="handleCalculate(row)">计算</el-button>
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="950px" :fullscreen="false">
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">基本信息</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="物料编号">
                <div class="flex gap-2">
                  <el-input v-model="form.materialCode" style="width: 100%" placeholder="请输入物料编号" :disabled="!!form.id" />
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleGenerateCode"
                    icon="Refresh"
                    :disabled="!!form.id"
                  >自动生成</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="物料类别">
                <el-select v-model="form.materialType" style="width: 100%" placeholder="请选择物料类别">
                  <el-option 
                    v-for="option in materialTypeOptions" 
                    :key="option.value" 
                    :label="option.label" 
                    :value="option.value" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="物料名称">
                <el-input v-model="form.productName" placeholder="请输入物料名称" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="客户料号">
                <el-input v-model="form.customerPartNo" placeholder="请输入客户料号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="料号">
                <el-input v-model="form.partNo" placeholder="请输入料号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="客户编号">
                <el-input v-model="form.customerNo" placeholder="请输入客户编号" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="单位">
                <el-select v-model="form.unit" style="width: 100%">
                  <el-option label="件" value="pcs" />
                  <el-option label="个" value="each" />
                  <el-option label="根" value="root" />   
                  <el-option label="条" value="strip" />
                  <el-option label="米" value="meter" />
                  <el-option label="卷" value="roll" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">物料描述与解析</span>
          </template>
          <el-form-item label="物料描述" class="mb-0">
            <el-input 
              v-model="form.description" 
              type="textarea" 
              :rows="3" 
              placeholder="输入物料描述后点击解析按钮自动识别，如：ML-317 H05VV-F 3*0.75 尾部处理：SR-199 热缩管8.0*30 黑色电工胶布（缠绕两圈）2个VH3.96端子 总长=2米" 
            />
          </el-form-item>
          <div class="flex justify-end gap-2 mt-3">
            <el-button 
              type="primary" 
              @click="handleParseDescription" 
              :loading="parsing"
              icon="Search"
            >解析描述</el-button>
            <el-button 
              type="success" 
              @click="handleAutoCalculate" 
              :loading="submitting"
              icon="Wallet"
            >自动核算</el-button>
          </div>
        </el-card>

        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">物料规格</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="7">
              <el-form-item label="插头型号">
                <el-input v-model="form.plugModel" placeholder="自动识别或手动输入" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="电线规格">
                <el-input v-model="form.wireSpec" placeholder="如 H05VV-F 3*0.75" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="长度(米)">
                <div class="flex items-center">
                  <el-input-number v-model="form.length" :min="0.1" :step="0.1" style="flex: 1" />
                  <span class="ml-2 text-gray-500 text-sm">m</span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="mt-1">
            <el-col :span="24">
              <el-form-item label="颜色">
                <el-input
                  v-model="form.color"
                  type="textarea"
                  :rows="2"
                  placeholder="如：黑色、白色、灰色等（可输入多种颜色，用逗号分隔）"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16" class="mt-1">
            <el-col :span="24">
              <el-form-item label="尾部处理项目">
                <el-select 
                  v-model="form.tailProcessing" 
                  multiple 
                  style="width: 100%" 
                  placeholder="请选择尾部处理项目（可多选）"
                  @change="handleTailProcessingChange"
                >
                  <el-option 
                    v-for="tp in tailProcessingOptions" 
                    :key="tp.name" 
                    :label="`${tp.name} (¥${tp.price.toFixed(2)})`" 
                    :value="tp.name" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card v-if="parsedResult.tailProcessingDetails.length > 0" class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">尾部处理明细（已解析）</span>
          </template>
          <el-table :data="parsedResult.tailProcessingDetails" size="small" border>
            <el-table-column prop="quantity" label="数量" width="80" align="center">
              <template #default="{ row }">{{ row.quantity || 1 }}</template>
            </el-table-column>
            <el-table-column prop="name" label="项目名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="unitPrice" label="单价(元)" align="right">
              <template #default="{ row }">¥{{ row.unitPrice.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="小计(元)" align="right">
              <template #default="{ row }">¥{{ row.totalPrice.toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <div class="flex justify-end items-center mt-3 border-t pt-3">
            <span class="text-gray-500 mr-2">尾处费合计:</span>
            <span class="text-xl font-bold text-success">¥{{ parsedResult.tailProcessingDetails.reduce((sum, tp) => sum + (tp.totalPrice || tp.price), 0).toFixed(2) }}</span>
          </div>
        </el-card>

        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">价格核算</span>
          </template>
          <el-row :gutter="16">
            <el-col :span="5">
              <el-form-item label="插头价格">
                <el-input-number v-model="form.plugPrice" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="线材费用">
                <el-input-number v-model="wireCost" :min="0" :precision="2" style="width: 100%" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item label="尾处费">
                <el-input-number v-model="form.tailProcessingPrice" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="9">
              <el-form-item label="单价(元)">
                <div class="flex items-center">
                  <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="flex: 1" />
                  <span class="ml-2 text-gray-500 text-sm">/ 个</span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="parsedResult.calculationBreakdown" class="mt-2 pt-3 border-t border-gray-100">
            <el-col :span="24">
              <div class="flex items-center justify-between bg-gradient-to-r from-primary/5 to-success/5 p-3 rounded-lg">
                <div class="text-sm text-gray-600">
                  核算明细：
                  <span v-if="parsedResult.calculationBreakdown.plugPrice > 0" class="text-primary">插头 ¥{{ parsedResult.calculationBreakdown.plugPrice.toFixed(2) }}</span>
                  <span v-if="parsedResult.calculationBreakdown.wireCost > 0" class="text-blue-500"> + 线材 ¥{{ parsedResult.calculationBreakdown.wireCost.toFixed(2) }}</span>
                  <span v-if="parsedResult.calculationBreakdown.tailProcessingPrice > 0" class="text-orange-500"> + 尾部处理 ¥{{ parsedResult.calculationBreakdown.tailProcessingPrice.toFixed(2) }}</span>
                </div>
                <div class="text-lg font-bold text-success">
                  = ¥{{ form.unitPrice.toFixed(2) }}
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="mb-4" shadow="hover">
          <template #header>
            <span class="font-bold text-lg text-primary">关联数据详情</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="12" v-if="parsedResult.plugInfo">
              <div class="bg-primary/5 p-3 rounded border border-primary/20">
                <div class="flex justify-between items-center">
                  <div>
                    <span class="font-bold text-primary">{{ parsedResult.plugInfo.name }}</span>
                    <span class="ml-2 text-gray-500 text-sm">{{ parsedResult.plugInfo.description }}</span>
                  </div>
                  <span class="text-lg font-bold text-success">¥{{ parsedResult.plugInfo.price.toFixed(2) }}</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12" v-if="parsedResult.wireSpecInfo">
              <div class="bg-blue-50 p-3 rounded border border-blue-200">
                <div class="font-bold text-blue-600 mb-1">{{ parsedResult.wireSpecInfo.spec }}</div>
                <div class="text-sm text-gray-600">
                  类型: {{ parsedResult.wireSpecInfo.wireType }} | 
                  铜重: {{ parsedResult.wireSpecInfo.copperWeight }}g/m | 
                  材料重: {{ parsedResult.wireSpecInfo.materialWeight }}g/m
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-form-item label="备注">
          <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { productsApi, tailProcessingsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, PriceTag, Wallet } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const loading = ref(false)
const submitting = ref(false)
const calculating = ref(false)
const tableData = ref([])
const selectedRows = ref([])

const searchKeyword = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')

const formRef = ref()
const form = reactive({
  id: null,
  materialCode: '',
  materialType: '',
  productName: '',
  customerPartNo: '',
  partNo: '',
  plugModel: '',
  plugPrice: 0,
  color: '',
  wireSpec: '',
  wireUnitPrice: 0,
  length: 1,
  tailProcessing: '',
  tailProcessingPrice: 0,
  customerNo: '',
  unitPrice: 0,
  unit: 'pcs',
  description: '',
  remarks: ''
})

const materialTypeOptions = [
  { value: 'POWERCORD', label: '电源线' },
  { value: 'WIRE', label: '电线' },
  { value: 'PLUG', label: '插头' },
  { value: 'CABLE', label: '线束' },
  { value: 'TERMINAL', label: '端子' },
  { value: 'OTHER', label: '其他' }
]

const parsedResult = reactive({
  plugInfo: null,
  wireSpecInfo: null,
  tailProcessingDetails: [],
  calculated: false,
  calculationBreakdown: null
})

const parsing = ref(false)
const wireCost = ref(0)

const tailProcessingOptions = ref([])
const tailProcessingLoading = ref(false)

async function loadTailProcessingOptions() {
  tailProcessingLoading.value = true
  try {
    const result = await tailProcessingsApi.list()
    const list = Array.isArray(result) ? result : (result.items || [])
    tailProcessingOptions.value = list.map(tp => ({
      name: tp.name,
      price: tp.price || 0
    }))
  } catch (error) {
    console.error('加载尾部处理选项失败:', error)
    tailProcessingOptions.value = [
      { name: '尾部脱皮半剥', price: 0.05 },
      { name: '尾部全剥', price: 0.08 },
      { name: '尾部沾锡', price: 0.06 },
      { name: '尾部压端子', price: 0.12 },
      { name: '尾部热缩管', price: 0.04 },
      { name: '尾部打端子护套', price: 0.10 },
      { name: '尾部扎线', price: 0.03 },
      { name: '尾部连接线', price: 0.15 },
      { name: '尾部处理上锡', price: 0.06 }
    ]
  } finally {
    tailProcessingLoading.value = false
  }
}

function handleTailProcessingChange() {
  if (form.tailProcessing && Array.isArray(form.tailProcessing)) {
    const total = form.tailProcessing.reduce((sum, item) => {
      const tp = tailProcessingOptions.value.find(t => t.name === item)
      return sum + (tp ? tp.price : 0)
    }, 0)
    form.tailProcessingPrice = total
    // 转换为字符串格式（后端期望）
    form.tailProcessing = form.tailProcessing.join(',')
  } else {
    form.tailProcessingPrice = 0
  }
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value
    }
    const data = await productsApi.list(params)
    tableData.value = data.products || []
    pagination.total = data.total || tableData.value.length
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function openAddDialog() {
  dialogTitle.value = '添加物料'
  form.id = null
  Object.assign(form, {
    materialCode: '',
    materialType: '',
    productName: '',
    customerPartNo: '',
    partNo: '',
    plugModel: '',
    plugPrice: 0,
    color: '',
    wireSpec: '',
    wireUnitPrice: 0,
    length: 1,
    tailProcessing: '',
    tailProcessingPrice: 0,
    customerNo: '',
    unitPrice: 0,
    unit: 'pcs',
    description: '',
    remarks: ''
  })
  Object.assign(parsedResult, {
    plugInfo: null,
    wireSpecInfo: null,
    tailProcessingDetails: [],
    calculated: false,
    calculationBreakdown: null
  })
  wireCost.value = 0
  dialogVisible.value = true
  loadTailProcessingOptions()
}

function openEditDialog(row) {
  dialogTitle.value = '编辑物料'
  form.id = row.id
  Object.assign(form, {
    materialCode: row.materialCode || '',
    materialType: row.materialType || '',
    productName: row.productName || '',
    customerPartNo: row.customerPartNo || '',
    partNo: row.partNo || '',
    plugModel: row.plugModel || '',
    plugPrice: row.plugPrice || 0,
    color: row.color || '',
    wireSpec: row.wireSpec || '',
    wireUnitPrice: row.wireUnitPrice || 0,
    length: row.length || 1,
    tailProcessing: row.tailProcessing || '',
    tailProcessingPrice: row.tailProcessingPrice || 0,
    customerNo: row.customerNo || '',
    unitPrice: row.unitPrice || 0,
    unit: row.unit || 'pcs',
    description: row.description || '',
    remarks: row.remarks || ''
  })
  Object.assign(parsedResult, {
    plugInfo: null,
    wireSpecInfo: null,
    tailProcessingDetails: [],
    calculated: false,
    calculationBreakdown: null
  })
  wireCost.value = row.wireUnitPrice ? (row.wireUnitPrice * (row.length || 1)) : 0
  dialogVisible.value = true
  loadTailProcessingOptions()
}

async function handleGenerateCode() {
  try {
    const result = await productsApi.generateCode({ materialType: form.materialType })
    if (result && result.code) {
      form.materialCode = result.code
      ElMessage.success('物料编号生成成功')
    } else {
      ElMessage.warning('生成物料编号失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '生成物料编号失败')
  }
}

async function handleSubmit() {
  try {
    submitting.value = true

    if (form.id) {
      await productsApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await productsApi.create(form)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除物料 "${row.materialCode}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await productsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的物料')
    return
  }

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个物料吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = selectedRows.value.map(row => row.id)
    const result = await productsApi.batchDelete(ids)
    if (result && result.success !== undefined) {
      ElMessage.success(result.message || '批量删除成功')
    } else {
      ElMessage.success('批量删除成功')
    }
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      const errorMsg = error.response?.data?.message || error.message || '批量删除失败'
      ElMessage.error(errorMsg)
    }
  }
}

function exportCsv() {
  ElMessage.info('导出功能开发中')
}

async function handleCalculate(row) {
  try {
    const result = await productsApi.calculate(row.id)
    ElMessage.success(`单价计算成功：¥${result.product?.unitPrice?.toFixed(2) || '0.00'}`)
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '计算失败')
  }
}

async function handleParseDescription() {
  if (!form.description) {
    ElMessage.warning('请先输入产品描述')
    return
  }

  try {
    parsing.value = true
    const result = await productsApi.parse(form.description)
    
    console.log('解析API返回:', result)
    
    if (result && result.parsedData) {
      const parsed = result.parsedData
      
      console.log('设置 wireSpec:', parsed.wireSpec)
      form.plugModel = parsed.plugModel || ''
      form.wireSpec = parsed.wireSpec || ''
      form.length = parsed.length || 1
      form.color = parsed.color || ''
      
      // 尾部处理 - 转换为字符串（后端期望字符串格式）
      if (parsed.tailProcessings && parsed.tailProcessings.length > 0) {
        form.tailProcessing = parsed.tailProcessings.join(',')
      } else if (parsed.tailProcessing && typeof parsed.tailProcessing === 'string') {
        form.tailProcessing = parsed.tailProcessing
      } else {
        form.tailProcessing = ''
      }

      parsedResult.plugInfo = parsed.plugInfo || null
      parsedResult.wireSpecInfo = parsed.wireSpecInfo || null
      parsedResult.tailProcessingDetails = parsed.tailProcessingDetails || []
      parsedResult.calculated = false
      parsedResult.calculationBreakdown = null
      wireCost.value = 0

      form.plugPrice = parsed.plugInfo ? parseFloat(parsed.plugInfo.price) : 0
      
      // 设置线材单价
      form.wireUnitPrice = parsed.wireSpecInfo ? parseFloat(parsed.wireSpecInfo.unitPrice) || 0 : 0

      const tailProcessingTotal = parsed.tailProcessingDetails && parsed.tailProcessingDetails.length > 0 
        ? parsed.tailProcessingDetails.reduce((sum, tp) => sum + (parseFloat(tp.totalPrice) || parseFloat(tp.price) || 0), 0)
        : 0
      form.tailProcessingPrice = tailProcessingTotal

      ElMessage.success('解析成功，已自动填充相关字段')
    } else {
      ElMessage.warning('未解析到有效信息')
    }
  } catch (error) {
    console.error('解析描述失败:', error)
    ElMessage.error(error.message || '解析失败')
  } finally {
    parsing.value = false
  }
}

async function handleAutoCalculate() {
  if (!form.description) {
    ElMessage.warning('请先输入产品描述')
    return
  }

  try {
    submitting.value = true
    
    const result = await productsApi.parse(form.description)
    
    console.log('自动核算API返回:', result)
    
    if (result && result.parsedData && result.calculation) {
      const parsed = result.parsedData
      const calculation = result.calculation
      const breakdown = calculation.breakdown

      form.plugModel = parsed.plugModel || ''
      form.wireSpec = parsed.wireSpec || ''
      form.length = parsed.length || 1
      form.color = parsed.color || ''
      
      // 尾部处理 - 转换为字符串（后端期望字符串格式）
      if (parsed.tailProcessings && parsed.tailProcessings.length > 0) {
        form.tailProcessing = parsed.tailProcessings.join(',')
      } else if (parsed.tailProcessing && typeof parsed.tailProcessing === 'string') {
        form.tailProcessing = parsed.tailProcessing
      } else {
        form.tailProcessing = ''
      }

      parsedResult.plugInfo = parsed.plugInfo || null
      parsedResult.wireSpecInfo = parsed.wireSpecInfo || null
      parsedResult.tailProcessingDetails = parsed.tailProcessingDetails || []

      form.plugPrice = parseFloat(breakdown?.plugPrice) || 0
      wireCost.value = parseFloat(breakdown?.wireCost) || 0
      form.tailProcessingPrice = parseFloat(breakdown?.tailProcessingPrice) || 0
      form.unitPrice = parseFloat(calculation.totalPrice) || 0
      
      // 设置线材单价（用于后续计算）
      form.wireUnitPrice = parsed.wireSpecInfo ? parseFloat(parsed.wireSpecInfo.unitPrice) || 0 : 0

      parsedResult.calculationBreakdown = breakdown
      parsedResult.calculated = true

      ElMessage.success(`自动核算完成，单价：¥${form.unitPrice.toFixed(2)}`)
    } else {
      ElMessage.warning('核算失败：未获取到有效数据')
    }
  } catch (error) {
    console.error('自动核算失败:', error)
    ElMessage.error(error.message || '核算失败')
  } finally {
    submitting.value = false
  }
}

async function handleCalculateAll() {
  try {
    calculating.value = true
    const result = await productsApi.calculateAll()
    ElMessage.success(result.message || '批量计算完成')
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '批量计算失败')
  } finally {
    calculating.value = false
  }
}

onMounted(() => {
  loadData()
  loadTailProcessingOptions()
})
</script>

<style lang="scss" scoped>
.materials-page {
  .flex {
    display: flex;
  }
  .justify-between {
    justify-content: space-between;
  }
  .items-center {
    align-items: center;
  }
  .mb-4 {
    margin-bottom: 16px;
  }
  .mt-4 {
    margin-top: 16px;
  }
  .gap-2 {
    gap: 8px;
  }
  .gap-3 {
    gap: 12px;
  }
}
</style>

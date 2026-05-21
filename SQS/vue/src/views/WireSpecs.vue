<template>
  <div class="wire-specs-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>电线规格</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold">电线规格管理</span>
          <div class="flex gap-2">
            <el-button type="success" @click="openImportDialog">
              <el-icon><Upload /></el-icon> 导入
            </el-button>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon> 添加规格
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索筛选区域 -->
      <div class="search-section">
        <div class="search-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索规格名称..."
            style="width: 280px"
            clearable
            @clear="loadData"
            @keyup.enter="loadData"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          
          <el-select v-model="filterWireType" placeholder="线种" style="width: 140px" clearable>
            <el-option label="欧规" value="EU" />
            <el-option label="美规" value="US" />
            <el-option label="英规" value="UK" />
            <el-option label="国标" value="CN" />
            <el-option label="EV电动汽车" value="EV" />
          </el-select>
          
          <el-select v-model="filterMaterialType" placeholder="材料类型" style="width: 140px" clearable>
            <el-option label="PVC" value="PVC" />
            <el-option label="橡胶" value="Rubber" />
            <el-option label="XLPE" value="XLPE" />
            <el-option label="XLPO" value="XLPO" />
            <el-option label="TPE" value="TPE" />
            <el-option label="EPDM" value="EPDM" />
            <el-option label="Silicone" value="Silicone" />
          </el-select>
          
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
          <el-button @click="handleRefresh">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </div>
        
        <div class="action-row">
          <el-button type="warning" @click="handleSyncCopperPrice" :loading="syncingCopperPrice">
            <el-icon><Refresh /></el-icon> 同步铜价
          </el-button>
          <el-button type="success" @click="handleCalculateAll" :loading="calculating">
            <el-icon><PriceTag /></el-icon> 计算所有单价
          </el-button>
          <el-button type="primary" @click="handleBatchSave" :disabled="!hasCalculatedData">
            <el-icon><Document /></el-icon> 保存计算结果
          </el-button>
          <el-button type="info" @click="handleExport">
            <el-icon><Download /></el-icon> 导出 Excel
          </el-button>
          
          <el-dropdown @command="handleTableConfig">
            <el-button>
              <el-icon><Setting /></el-icon> 列配置
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="toggleColumns">选择显示列</el-dropdown-item>
                <el-dropdown-item command="resetColumns">重置列配置</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <div class="pagination-info" v-if="pagination.total > 0">
          <span>共 {{ pagination.total }} 条记录，每页 {{ pagination.pageSize }} 条，共 {{ Math.ceil(pagination.total / pagination.pageSize) }} 页</span>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="spec" label="规格" width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row)" size="small">
              {{ row.type || row.wireType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'materialType')?.visible" prop="materialType" label="材料" width="100">
          <template #default="{ row }">
            <span v-if="row.materialType" class="text-sm">{{ row.materialType }}</span>
            <span v-else class="text-gray text-sm">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'copperWeight')?.visible" prop="copperWeight" label="铜重(g/m)" width="100" align="right" />
        <el-table-column v-if="columnOptions.find(c => c.key === 'materialWeight')?.visible" prop="materialWeight" label="材料重(g/m)" width="110" align="right" />
        <el-table-column v-if="columnOptions.find(c => c.key === 'fillerWeight')?.visible" prop="fillerWeight" label="填充重(g/m)" width="110" align="right" />
        <el-table-column v-if="columnOptions.find(c => c.key === 'netWeight')?.visible" prop="netWeight" label="净重(g/m)" width="100" align="right">
          <template #default="{ row }">
            <span v-if="row.netWeight">{{ row.netWeight }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'materialPricePerTon')?.visible" prop="materialPricePerTon" label="材料价(元/吨)" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.materialPricePerTon">{{ row.materialPricePerTon.toLocaleString() }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'finalPrice')?.visible" prop="finalPrice" label="单价(元/米)" width="110" align="right">
          <template #default="{ row }">
            <span v-if="row.finalPrice">¥{{ row.finalPrice.toFixed(2) }}</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'profitMargin')?.visible" prop="profitMargin" label="毛利率" width="90" align="right">
          <template #default="{ row }">
            <span v-if="row.profitMargin">{{ ((1 - row.profitMargin) * 100).toFixed(1) }}%</span>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column v-if="columnOptions.find(c => c.key === 'formula')?.visible" label="计算公式" width="300">
          <template #default="{ row }">
            <el-popover
              v-if="row.finalPrice"
              trigger="hover"
              placement="top"
              width="450"
            >
              <div class="formula-detail">
                <div class="font-bold mb-2">计算明细</div>
                <div class="text-sm space-y-1">
                  <div>铜成本 = {{ row.copperWeight || 0 }}g/m / 1000 × ({{ row.copperPricePerTon || 100000 }}元/吨 + {{ row.copperProcessFee || 4000 }}元/吨) / 1000</div>
                  <div>胶料成本 = {{ row.materialWeight || 0 }}g/m / 1000 × {{ row.materialPricePerTon || 9000 }}元/吨 / 1000</div>
                  <div>填充成本 = {{ row.fillerWeight || 0 }}g/m / 1000 × {{ row.fillerPricePerTon || 8000 }}元/吨 / 1000</div>
                  <div class="border-t mt-1 pt-1 font-semibold">
                    单价 = ({{ (row.copperCost || 0).toFixed(4) }} + {{ (row.materialCost || 0).toFixed(4) }} + {{ (row.fillerCost || 0).toFixed(4) }}) / {{ row.profitMargin || 0.85 }}
                  </div>
                  <div class="text-primary font-bold">= ¥{{ row.finalPrice?.toFixed(4) }} 元/米</div>
                </div>
              </div>
              <template #reference>
                <el-button link type="primary" size="small">查看公式</el-button>
              </template>
            </el-popover>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="warning" @click="handleCalculate(row)">计算</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-footer">
        <div class="selected-actions" v-if="selectedRows.length > 0">
          <el-button type="danger" @click="handleBatchDelete">
            批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
        <div class="pagination-container">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100, 200]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="650px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
        <el-form-item label="规格" prop="spec">
          <el-input v-model="form.spec" placeholder="如: H01Z2Z2-K 1*6 或 3*1.5mm²" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="铜重量(g/m)" prop="copperWeight">
              <el-input-number v-model="form.copperWeight" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材料重量(g/m)" prop="materialWeight">
              <el-input-number v-model="form.materialWeight" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="填充重量(g/m)" prop="fillerWeight">
              <el-input-number v-model="form.fillerWeight" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="净重(g/m)" prop="netWeight">
              <el-input-number v-model="form.netWeight" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="线种" prop="wireType">
              <el-select v-model="form.wireType" style="width: 100%">
                <el-option label="欧规" value="EU" />
                <el-option label="美规" value="US" />
                <el-option label="英规" value="UK" />
                <el-option label="国标" value="CN" />
                <el-option label="EV电动汽车" value="EV" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="材料类型" prop="materialType">
              <el-select v-model="form.materialType" style="width: 100%">
                <el-option label="PVC" value="PVC" />
                <el-option label="橡胶" value="Rubber" />
                <el-option label="XLPE" value="XLPE" />
                <el-option label="XLPO" value="XLPO" />
                <el-option label="TPE" value="TPE" />
                <el-option label="EPDM" value="EPDM" />
                <el-option label="Silicone" value="Silicone" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 列配置对话框 -->
    <el-dialog v-model="columnsDialogVisible" title="选择显示列" width="400px">
      <div class="column-config-header">
        <el-button size="small" @click="selectAllColumns">全选</el-button>
        <el-button size="small" @click="deselectAllColumns">全不选</el-button>
        <el-button size="small" @click="resetColumnsToDefault">恢复默认</el-button>
      </div>
      <div class="column-config-list">
        <div 
          v-for="col in columnOptions" 
          :key="col.key" 
          class="column-item"
          :class="{ 
            'column-item-fixed': col.fixed,
            'column-item-disabled': col.fixed && !col.visible
          }"
          @click="!col.fixed && toggleColumn(col.key)"
        >
          <div class="column-item-content">
            <el-checkbox 
              v-model="col.visible" 
              :disabled="col.fixed"
              @change="handleColumnChange"
            />
            <span class="column-label">{{ col.label }}</span>
            <el-tag v-if="col.fixed" size="small" type="info" class="ml-2">固定</el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="columnsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmColumns">确定</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入电线规格" width="500px">
      <div class="import-section">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
          :file-list="fileList"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 .xlsx, .xls, .csv 格式，文件大小不超过 10MB</div>
          </template>
        </el-upload>

        <div class="mt-4">
          <el-link type="primary" @click="downloadTemplate('wire-specs')">下载导入模板</el-link>
        </div>

        <div class="import-notes mt-4">
          <p><strong>导入说明：</strong></p>
          <ul>
            <li>规格（必填）：电线规格型号，如 H05VV-F 3*0.75</li>
            <li>单价：单价（元/米）</li>
            <li>铜重(g/m)：每米铜丝重量</li>
            <li>材料重(g/m)：每米材料重量</li>
            <li>类型：线种类型（EU/US/UK/CN/EV）</li>
            <li>状态：active（启用）/ inactive（禁用）</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { wireSpecsApi } from '../api'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import { Plus, Search, PriceTag, Document, Download, Refresh, Setting, ArrowDown, Upload, UploadFilled } from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'

const settingsStore = useSettingsStore()

const loading = ref(false)
const calculating = ref(false)
const submitting = ref(false)
const syncingCopperPrice = ref(false)
const tableData = ref([])
const selectedRows = ref([])

const searchKeyword = ref('')
const filterWireType = ref('')
const filterMaterialType = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const columnsDialogVisible = ref(false)

const columnOptions = ref([
  { key: 'spec', label: '规格', visible: true, fixed: true },
  { key: 'type', label: '类型', visible: true, fixed: true },
  { key: 'materialType', label: '材料', visible: true },
  { key: 'copperWeight', label: '铜重 (g/m)', visible: true },
  { key: 'materialWeight', label: '材料重 (g/m)', visible: true },
  { key: 'fillerWeight', label: '填充重 (g/m)', visible: true },
  { key: 'netWeight', label: '净重 (g/m)', visible: false },
  { key: 'materialPricePerTon', label: '材料价 (元/吨)', visible: false },
  { key: 'finalPrice', label: '单价 (元/米)', visible: true },
  { key: 'profitMargin', label: '毛利率', visible: true },
  { key: 'formula', label: '计算公式', visible: true },
  { key: 'action', label: '操作', visible: true, fixed: true }
])

// 加载列配置
function loadColumnConfig() {
  const savedConfig = localStorage.getItem('wireSpecsColumnConfig')
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig)
      columnOptions.value.forEach(col => {
        const savedCol = config.find(c => c.key === col.key)
        if (savedCol && !col.fixed) {
          col.visible = savedCol.visible
        }
      })
    } catch (e) {
      console.error('加载列配置失败', e)
    }
  }
}

// 保存列配置
function saveColumnConfig() {
  const config = columnOptions.value.map(col => ({
    key: col.key,
    visible: col.visible
  }))
  localStorage.setItem('wireSpecsColumnConfig', JSON.stringify(config))
}

const hasCalculatedData = computed(() => {
  return tableData.value.some(row => row.finalPrice !== undefined && row.finalPrice !== null)
})

const formRef = ref()
const form = reactive({
  id: null,
  spec: '',
  copperWeight: 0,
  materialWeight: 0,
  fillerWeight: 0,
  netWeight: 0,
  wireType: 'EU',
  materialType: 'PVC'
})

const rules = {
  spec: [{ required: true, message: '请输入规格', trigger: 'blur' }]
}

function getTypeTagType(row) {
  const type = row.type || row.wireType || ''
  if (type.includes('EV') || type.includes('电动汽车') || type.includes('充电')) {
    return 'danger'
  } else if (type.includes('橡胶')) {
    return 'warning'
  } else if (type.includes('国标')) {
    return 'success'
  } else if (type.includes('美规')) {
    return 'info'
  }
  return 'primary'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value,
      wireType: filterWireType.value,
      materialType: filterMaterialType.value
    }
    const data = await wireSpecsApi.list(params)
    tableData.value = data.data || data.wireSpecs || []
    pagination.total = data.total || 0
    
    // 如果当前页超过总页数，跳转到最后一页
    const maxPage = Math.ceil(pagination.total / pagination.pageSize) || 1
    if (pagination.page > maxPage) {
      pagination.page = maxPage
      loadData()
      return
    }
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleRefresh() {
  searchKeyword.value = ''
  filterWireType.value = ''
  filterMaterialType.value = ''
  pagination.page = 1
  pagination.pageSize = 20
  loadData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.page = 1
  loadData()
}

function handleCurrentChange(page) {
  pagination.page = page
  loadData()
}

function handleTableConfig(command) {
  if (command === 'toggleColumns') {
    columnsDialogVisible.value = true
  } else if (command === 'resetColumns') {
    columnOptions.value.forEach(col => {
      if (!col.fixed) {
        col.visible = true
      }
    })
    saveColumnConfig()
    ElMessage.success('列配置已重置')
  }
}

function toggleColumn(key) {
  const col = columnOptions.value.find(c => c.key === key)
  if (col && !col.fixed) {
    col.visible = !col.visible
    // 自动保存配置
  }
}

function handleColumnChange() {
  saveColumnConfig()
}

function selectAllColumns() {
  columnOptions.value.forEach(col => {
    if (!col.fixed) {
      col.visible = true
    }
  })
  saveColumnConfig()
  ElMessage.success('已全选所有列')
}

function deselectAllColumns() {
  columnOptions.value.forEach(col => {
    if (!col.fixed) {
      col.visible = false
    }
  })
  saveColumnConfig()
  ElMessage.success('已取消全选')
}

function resetColumnsToDefault() {
  columnOptions.value.forEach(col => {
    if (!col.fixed) {
      // 恢复默认配置
      const defaultVisible = ['materialType', 'copperWeight', 'materialWeight', 'fillerWeight', 'finalPrice', 'profitMargin'].includes(col.key)
      col.visible = defaultVisible
    }
  })
  saveColumnConfig()
  ElMessage.success('已恢复默认列配置')
}

function handleConfirmColumns() {
  saveColumnConfig()
  columnsDialogVisible.value = false
  ElMessage.success('列配置已保存')
}



async function handleBatchSave() {
  try {
    const dataToSave = tableData.value.filter(row => row.finalPrice !== undefined && row.finalPrice !== null)
    if (dataToSave.length === 0) {
      ElMessage.warning('没有需要保存的计算结果')
      return
    }

    submitting.value = true
    const result = await wireSpecsApi.batchUpdate(dataToSave)
    ElMessage.success(`成功保存 ${result.updated} 条规格数据`)
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '批量保存失败')
  } finally {
    submitting.value = false
  }
}

async function handleExport() {
  try {
    const result = await wireSpecsApi.exportCsv()
    const blob = new Blob([result], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `电线规格列表_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function openAddDialog() {
  dialogTitle.value = '添加规格'
  form.id = null
  Object.assign(form, {
    spec: '',
    copperWeight: 0,
    materialWeight: 0,
    fillerWeight: 0,
    netWeight: 0,
    wireType: 'EU',
    materialType: 'PVC'
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑规格'
  form.id = row.id
  Object.assign(form, {
    spec: row.spec,
    copperWeight: row.copperWeight || 0,
    materialWeight: row.materialWeight || 0,
    fillerWeight: row.fillerWeight || 0,
    netWeight: row.netWeight || 0,
    wireType: row.wireType || 'EU',
    materialType: row.materialType || 'PVC'
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (form.id) {
      await wireSpecsApi.update(form.spec, form)
      ElMessage.success('更新成功')
    } else {
      await wireSpecsApi.create(form)
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
    await ElMessageBox.confirm(`确定删除规格 "${row.spec}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await wireSpecsApi.delete(row.spec)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个规格吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const specs = selectedRows.value.map(row => row.spec)
    await wireSpecsApi.batchDelete(specs)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 导入相关
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()
const fileList = ref([])
const importFile = ref(null)

function openImportDialog() {
  importDialogVisible.value = true
  fileList.value = []
  importFile.value = null
}

function handleFileChange(file, files) {
  importFile.value = file.raw
  fileList.value = files
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const result = await wireSpecsApi.import(formData)

    if (result.success) {
      ElMessage.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      if (result.errors && result.errors.length > 0) {
        console.error('导入错误:', result.errors)
      }
      importDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '导入失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

function downloadTemplate(type) {
  const templates = {
    'wire-specs': [
      { 规格: 'H05VV-F 3*0.75', 单价: 10.5, 铜重: 21.6, 材料重: 32.5, 类型: 'EU', 状态: 'active' },
      { 规格: 'H05VV-F 3*1.0', 单价: 12.8, 铜重: 28.8, 材料重: 42.0, 类型: 'EU', 状态: 'active' },
      { 规格: 'SJT 3*18AWG', 单价: 15.2, 铜重: 25.0, 材料重: 38.0, 类型: 'US', 状态: 'active' }
    ]
  }

  // 创建 CSV 内容
  const headers = Object.keys(templates[type][0])
  const csvContent = [
    headers.join(','),
    ...templates[type].map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n')

  // 下载
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadColumnConfig()
  loadData()
  loadCopperPriceInfo()
  settingsStore.loadSettings()
})

async function handleCalculate(row) {
  try {
    const result = await wireSpecsApi.calculate(row.spec, row.wireType, row.materialType)
    row.finalPrice = result.finalPrice
    row.copperCost = result.copperCost
    row.materialCost = result.materialCost
    row.fillerCost = result.fillerCost
    row.basePrice = result.basePrice
    row.profitMargin = result.profitMargin
    row.type = result.type
    row.materialType = result.materialType
    row.materialPricePerTon = result.materialPricePerTon
    row.copperPricePerTon = result.copperPricePerTon
    row.copperProcessFee = result.copperProcessFee
    row.fillerPricePerTon = result.fillerPricePerTon
    ElMessage.success(`计算完成：¥${result.finalPrice?.toFixed(2) || '0'} 元/米`)
  } catch (error) {
    ElMessage.error(error.message || '计算失败')
  }
}

async function handleSyncCopperPrice() {
  try {
    syncingCopperPrice.value = true
    const result = await wireSpecsApi.syncCopperPrice()
    if (result.success) {
      ElMessage.success(`铜价同步成功：¥${result.copperPrice?.toLocaleString()}/吨 (加工费: ¥${result.copperProcessFee?.toLocaleString()}/吨)`)
      // 更新本地显示的铜价信息
      await loadCopperPriceInfo()
    } else {
      ElMessage.error(result.error || '铜价同步失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '铜价同步失败')
  } finally {
    syncingCopperPrice.value = false
  }
}

async function loadCopperPriceInfo() {
  try {
    const response = await fetch('/api/wire-specs/copper-price-info')
    const result = await response.json()
    if (result.copperPrice) {
      settingsStore.copperPrice = result.copperPrice
      settingsStore.copperProcessFee = result.copperProcessFee
      settingsStore.copperPriceSyncedAt = result.copperPriceSyncedAt
    }
  } catch (error) {
    console.error('获取铜价信息失败:', error)
  }
}

async function handleCalculateAll() {
  try {
    calculating.value = true
    const result = await wireSpecsApi.calculateAll()
    const priceMap = new Map(result.results.map(r => [r.spec, r]))
    tableData.value.forEach(row => {
      const calcResult = priceMap.get(row.spec)
      if (calcResult) {
        row.finalPrice = calcResult.finalPrice
        row.copperCost = calcResult.copperCost
        row.materialCost = calcResult.materialCost
        row.fillerCost = calcResult.fillerCost
        row.basePrice = calcResult.basePrice
        row.profitMargin = calcResult.profitMargin
        row.type = calcResult.type
        row.materialType = calcResult.materialType
        row.materialPricePerTon = calcResult.materialPricePerTon
        row.copperPricePerTon = calcResult.copperPricePerTon
        row.copperProcessFee = calcResult.copperProcessFee
        row.fillerPricePerTon = calcResult.fillerPricePerTon
      }
    })
    ElMessage.success(`批量计算完成，共 ${result.total} 条规格`)
  } catch (error) {
    ElMessage.error(error.message || '批量计算失败')
  } finally {
    calculating.value = false
  }
}
</script>

<style scoped>
.wire-specs-page {
  padding: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.search-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.pagination-info {
  font-size: 13px;
  color: #606266;
  padding: 8px 0;
}

.column-config-header {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.column-config-list {
  max-height: 400px;
  overflow-y: auto;
}

.column-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.column-item:hover {
  background-color: #f5f7fa;
}

.column-item-fixed {
  cursor: not-allowed;
  opacity: 0.7;
}

.column-item-disabled {
  opacity: 0.5;
}

.column-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.column-label {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.ml-2 {
  margin-left: 8px;
}

.formula-detail {
  font-size: 13px;
  line-height: 1.6;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-1 {
  margin-top: 4px;
}

.mt-4 {
  margin-top: 16px;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.selected-actions {
  display: flex;
  gap: 12px;
}

.pagination-container {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.text-gray {
  color: #909399;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-info {
  color: #909399;
}

.text-sm {
  font-size: 13px;
}

.text-2xl {
  font-size: 24px;
}

.font-bold {
  font-weight: bold;
}

.font-semibold {
  font-weight: 600;
}

.text-lg {
  font-size: 18px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.gap-3 {
  gap: 12px;
}

.space-y-1 > * + * {
  margin-top: 4px;
}

.border-t {
  border-top: 1px solid #ebeef5;
}

.pt-1 {
  padding-top: 4px;
}

.text-center {
  text-align: center;
}

.grid {
  display: grid;
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

.gap-4 {
  gap: 16px;
}
</style>
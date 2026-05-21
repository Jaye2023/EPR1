<template>
  <div class="copper-price-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="toolbar-title">
            <h2>铜价管理</h2>
            <p class="subtitle">实时铜价数据，用于电线规格成本计算</p>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon>
              新增铜价
            </el-button>
            <el-button type="success" @click="handleSetCurrent">
              <el-icon><PriceTag /></el-icon>
              设为当前铜价
            </el-button>
            <el-button @click="loadData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 当前铜价展示 -->
      <div class="current-price-section">
        <el-alert
          v-if="currentCopperPrice"
          :title="`当前铜价: ¥${currentCopperPrice.price?.toLocaleString() || 0}/吨`"
          type="success"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="current-price-info">
              <span>更新时间: {{ formatDate(currentCopperPrice.updatedAt) }}</span>
              <span v-if="currentCopperPrice.supplier">供应商: {{ currentCopperPrice.supplier }}</span>
              <span v-if="currentCopperPrice.remark">备注: {{ currentCopperPrice.remark }}</span>
            </div>
          </template>
        </el-alert>
        <el-alert
          v-else
          title="暂未设置当前铜价"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            请添加铜价记录并设为当前铜价
          </template>
        </el-alert>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <el-input
          v-model="searchText"
          placeholder="搜索供应商/备注"
          style="width: 240px"
          clearable
          @change="loadData"
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
          value-format="YYYY-MM-DD"
          style="width: 280px"
          @change="loadData"
        />
        <el-button type="primary" @click="loadData">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button @click="handleReset">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>

      <!-- 铜价历史列表 -->
      <el-table :data="displayData" border v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="price" label="铜价(元/吨)" width="140">
          <template #default="{ row }">
            <span class="price-value">¥{{ (row.price || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="processFee" label="加工费(元/吨)" width="130">
          <template #default="{ row }">
            <span>¥{{ (row.processFee || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" width="150" />
        <el-table-column prop="effectiveDate" label="生效日期" width="110">
          <template #default="{ row }">
            {{ row.effectiveDate || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="记录日期" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="isCurrent" label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.isCurrent" type="success" size="small">当前</el-tag>
            <el-tag v-else type="info" size="small">历史</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="!row.isCurrent"
              type="success"
              link
              size="small"
              @click="setAsCurrent(row)"
            >
              设为当前
            </el-button>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="110px">
        <el-form-item label="铜价" prop="price">
          <el-input-number
            v-model="form.price"
            :min="0"
            :precision="0"
            :step="1000"
            style="width: 100%"
          />
          <span class="form-tip">单位: 元/吨</span>
        </el-form-item>
        <el-form-item label="加工费" prop="processFee">
          <el-input-number
            v-model="form.processFee"
            :min="0"
            :precision="0"
            :step="100"
            style="width: 100%"
          />
          <span class="form-tip">单位: 元/吨 (铜价+加工费=实际成本)</span>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier">
          <el-input v-model="form.supplier" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="生效日期" prop="effectiveDate">
          <el-date-picker
            v-model="form.effectiveDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Refresh, PriceTag } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()

const searchText = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

const allData = ref([])
const currentCopperPrice = ref(null)
const editingId = ref(null)

const form = ref({
  price: 0,
  processFee: 4000,
  supplier: '',
  effectiveDate: '',
  remark: ''
})

const rules = {
  price: [{ required: true, message: '请输入铜价', trigger: 'blur' }]
}

const total = computed(() => allData.value.length)

const displayData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return allData.value.slice(start, start + pageSize.value)
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (searchText.value) params.append('search', searchText.value)
    if (dateRange.value?.length === 2) {
      params.append('startDate', dateRange.value[0])
      params.append('endDate', dateRange.value[1])
    }

    const response = await fetch(`/api/copper-prices?${params.toString()}`)
    const result = await response.json()

    if (result.success) {
      allData.value = result.data || []
      currentCopperPrice.value = result.currentPrice || null
    }
  } catch (error) {
    console.error('加载铜价数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchText.value = ''
  dateRange.value = []
  currentPage.value = 1
  loadData()
}

function openAddDialog() {
  dialogTitle.value = '新增铜价'
  editingId.value = null
  form.value = {
    price: currentCopperPrice.value?.price || 70000,
    processFee: currentCopperPrice.value?.processFee || 4000,
    supplier: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    remark: ''
  }
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑铜价'
  editingId.value = row.id
  form.value = {
    price: row.price,
    processFee: row.processFee || 4000,
    supplier: row.supplier || '',
    effectiveDate: row.effectiveDate || '',
    remark: row.remark || ''
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const url = editingId.value ? `/api/copper-prices/${editingId.value}` : '/api/copper-prices'
    const method = editingId.value ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    const result = await response.json()
    if (result.success) {
      ElMessage.success(editingId.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条铜价记录吗？价格: ¥${row.price?.toLocaleString()}/吨`,
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )

    const response = await fetch(`/api/copper-prices/${row.id}`, { method: 'DELETE' })
    const result = await response.json()

    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function setAsCurrent(row) {
  try {
    await ElMessageBox.confirm(
      `确定要将 ¥${row.price?.toLocaleString()}/吨 设为当前铜价吗？`,
      '确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'info' }
    )

    const response = await fetch(`/api/copper-prices/${row.id}/set-current`, {
      method: 'PUT'
    })
    const result = await response.json()

    if (result.success) {
      ElMessage.success('已设为当前铜价')
      loadData()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

function handleSetCurrent() {
  openAddDialog()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.copper-price-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.toolbar-title h2 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.toolbar-title .subtitle {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.current-price-section {
  margin-bottom: 20px;
}

.current-price-info {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #606266;
}

.current-price-info span {
  margin-right: 15px;
}

.filter-section {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.price-value {
  font-weight: 600;
  color: #409eff;
  font-size: 15px;
}

.form-tip {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

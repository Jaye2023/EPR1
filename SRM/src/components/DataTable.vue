<template>
  <div class="data-table-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="filter-row">
        <template v-if="showDateFilter">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
            @change="handleSearch"
          />
        </template>
        
        <template v-if="showSearch">
          <el-input 
            v-model="searchText" 
            placeholder="搜索关键词" 
            style="width: 180px" 
            clearable 
            @change="handleSearch"
          />
        </template>

        <template v-if="filters && filters.length > 0">
          <el-select 
            v-for="filter in filters" 
            :key="filter.key"
            v-model="filterValues[filter.key]" 
            :placeholder="filter.label" 
            :style="{ width: filter.width || '140px' }"
            clearable 
            @change="handleSearch"
          >
            <el-option label="全部" value="" />
            <el-option 
              v-for="option in filter.options" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </template>
      </div>

      <div class="action-row">
        <slot name="actions">
          <el-button type="primary" @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="success" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </slot>
      </div>
    </div>

    <!-- 状态栏 -->
    <div v-if="statusStats && statusStats.length > 0" class="status-bar">
      <div 
        v-for="stat in statusStats" 
        :key="stat.key"
        class="status-item"
        :class="{ 'status-active': currentStatusFilter === stat.key }"
        @click="toggleStatusFilter(stat.key)"
      >
        <span class="status-count">{{ stat.count }}</span>
        <span class="status-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <div class="batch-actions">
        <slot name="batch-actions">
          <el-button 
            v-if="selectedRows.length > 0" 
            type="success" 
            size="small" 
            @click="handleBatchAction"
          >
            <el-icon><CircleCheck /></el-icon> 批量操作 ({{ selectedRows.length }})
          </el-button>
        </slot>
      </div>
      <div class="table-actions">
        <slot name="table-actions"></slot>
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table 
      :data="displayData" 
      :border="border"
      :stripe="stripe"
      style="width: 100%" 
      v-loading="loading"
      @selection-change="handleSelectionChange"
      :ref="tableRef"
    >
      <el-table-column 
        v-if="showSelection" 
        type="selection" 
        width="45" 
      />
      
      <template v-for="column in columns" :key="column.prop">
        <el-table-column 
          v-if="!column.slot"
          :prop="column.prop" 
          :label="column.label" 
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
          :align="column.align"
        >
          <template #default="{ row }">
            <span v-if="column.formatter" v-html="column.formatter(row)"></span>
            <template v-else-if="column.type === 'status'">
              <el-tag :type="column.statusMap[row[column.prop]]?.type || 'info'">
                {{ column.statusMap[row[column.prop]]?.label || row[column.prop] }}
              </el-tag>
            </template>
            <template v-else-if="column.type === 'money'">
              ¥{{ row[column.prop]?.toFixed(2) }}
            </template>
            <template v-else-if="column.type === 'link'">
              <span class="link" @click="handleLinkClick(row)">{{ row[column.prop] }}</span>
            </template>
            <span v-else>{{ row[column.prop] }}</span>
          </template>
        </el-table-column>
        
        <el-table-column 
          v-else
          :label="column.label" 
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
          :align="column.align"
        >
          <slot :name="column.slot" slot-scope="scope"></slot>
        </el-table-column>
      </template>

      <el-table-column 
        v-if="showOperation" 
        label="操作" 
        :width="operationWidth" 
        fixed="right"
      >
        <template #default="{ row }">
          <slot name="operation" :row="row">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          </slot>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <div class="pagination-info">
        共 {{ total }} 条记录
      </div>
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePageChange"
        @size-change="handlePageSizeChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      :width="dialogWidth" 
      destroy-on-close
    >
      <slot name="dialog-content" :data="currentRow"></slot>
      
      <template #footer>
        <slot name="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleDialogConfirm">确定</el-button>
        </slot>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, defineProps, defineEmits } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, CircleCheck } from '@element-plus/icons-vue'

const props = defineProps({
  apiUrl: {
    type: String,
    required: true
  },
  columns: {
    type: Array,
    required: true
  },
  showSelection: {
    type: Boolean,
    default: true
  },
  showOperation: {
    type: Boolean,
    default: true
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showDateFilter: {
    type: Boolean,
    default: false
  },
  filters: {
    type: Array,
    default: () => []
  },
  border: {
    type: Boolean,
    default: true
  },
  stripe: {
    type: Boolean,
    default: false
  },
  operationWidth: {
    type: Number,
    default: 150
  },
  dialogWidth: {
    type: String,
    default: '800px'
  }
})

const emit = defineEmits(['view', 'edit', 'delete', 'batch-action', 'row-click'])

const loading = ref(false)
const searchText = ref('')
const dateRange = ref([])
const currentStatusFilter = ref('')
const filterValues = reactive({})

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const total = ref(0)
const tableData = ref([])
const selectedRows = ref([])
const tableRef = ref(null)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const currentRow = ref({})

const displayData = computed(() => {
  let data = [...tableData.value]
  
  if (currentStatusFilter.value) {
    data = data.filter(item => item.status === currentStatusFilter.value)
  }
  
  return data
})

const statusStats = computed(() => {
  const statusMap = {
    pending: { label: '待确认', count: 0 },
    confirmed: { label: '已确认', count: 0 },
    shipped: { label: '已发货', count: 0 },
    received: { label: '已收货', count: 0 }
  }
  
  tableData.value.forEach(item => {
    if (statusMap[item.status]) {
      statusMap[item.status].count++
    }
  })
  
  return Object.entries(statusMap).map(([key, value]) => ({
    key,
    ...value
  }))
})

watch(() => props.filters, (newFilters) => {
  newFilters.forEach(filter => {
    if (!filterValues[filter.key]) {
      filterValues[filter.key] = ''
    }
  })
}, { immediate: true })

async function loadData() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    
    if (searchText.value) {
      params.set('search', searchText.value)
    }
    
    if (dateRange.value && dateRange.value.length === 2) {
      params.set('start_date', dateRange.value[0])
      params.set('end_date', dateRange.value[1])
    }
    
    Object.keys(filterValues).forEach(key => {
      if (filterValues[key]) {
        params.set(key, filterValues[key])
      }
    })
    
    const response = await fetch(`${props.apiUrl}?${params}`)
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        tableData.value = result.data
        total.value = result.total || 0
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadData()
}

function handleRefresh() {
  pagination.page = 1
  searchText.value = ''
  dateRange.value = []
  currentStatusFilter.value = ''
  Object.keys(filterValues).forEach(key => {
    filterValues[key] = ''
  })
  loadData()
  ElMessage.success('数据已刷新')
}

function handleExport() {
  const headers = props.columns.map(col => col.label)
  const rows = tableData.value.map(row => {
    return props.columns.map(col => {
      const value = row[col.prop]
      if (col.type === 'money') {
        return `¥${value?.toFixed(2)}`
      }
      return value || ''
    })
  })
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `数据导出_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  ElMessage.success('导出成功')
}

function handlePageChange(page) {
  pagination.page = page
  loadData()
}

function handlePageSizeChange(pageSize) {
  pagination.pageSize = pageSize
  pagination.page = 1
  loadData()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function toggleStatusFilter(status) {
  currentStatusFilter.value = currentStatusFilter.value === status ? '' : status
}

function handleView(row) {
  currentRow.value = { ...row }
  dialogTitle.value = '详情'
  dialogVisible.value = true
  emit('view', row)
}

function handleLinkClick(row) {
  emit('row-click', row)
}

function handleBatchAction() {
  emit('batch-action', selectedRows.value)
}

function handleDialogConfirm() {
  dialogVisible.value = false
}

defineExpose({
  loadData,
  selectedRows,
  tableRef
})
</script>

<style scoped>
.data-table-container {
  width: 100%;
}

.toolbar {
  margin-bottom: 16px;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.action-row {
  display: flex;
  gap: 8px;
}

.status-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 8px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e8f4ff;
  }
  
  &.status-active {
    background: #e8f4ff;
    border: 1px solid #3b82f6;
  }
}

.status-count {
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.status-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.table-wrapper {
  overflow-x: auto;
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 12px 0;
}

.pagination-info {
  font-size: 13px;
  color: #6b7280;
}

.link {
  color: #3b82f6;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
}

:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background: #f9fafb;
  font-weight: 500;
  color: #374151;
}

:deep(.el-table td) {
  padding: 10px 12px;
}

:deep(.el-table--border) {
  border-color: #e5e7eb;
}

:deep(.el-table__header-wrapper) {
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-pagination) {
  margin-top: 0;
}
</style>
<template>
  <div class="page-container">
    <div class="page-header">
      <h1>合同管理</h1>
      <p>管理供应商合同</p>
    </div>
    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索合同编号、名称、供应商"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <el-table :data="tableData" border style="width: 100%" @selection-change="handleSelectionChange" ref="tableRef" v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="contractNumber" label="合同编号" width="150" />
        <el-table-column prop="contractName" label="合同名称" min-width="180" />
        <el-table-column prop="supplierName" label="供应商" min-width="150" />
        <el-table-column prop="signDate" label="签订日期" width="120" />
        <el-table-column prop="expireDate" label="到期日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isExpiringSoon(row.expireDate) }">
              {{ row.expireDate }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="合同金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click.stop="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-4">
        <div class="flex gap-2">
          <el-button 
            v-if="selectedRows.length > 0" 
            type="danger" 
            @click="handleBatchDelete"
            :disabled="selectedRows.length === 0"
          >
            <el-icon><Box /></el-icon> 批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="total"
          class="pagination"
          @current-change="pagination.page = $event; loadContracts()"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Box } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const tableData = ref([])
const total = ref(0)
const searchKeyword = ref('')
const selectedRows = ref([])
const tableRef = ref(null)
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

function getStatusType(status) {
  const types = { active: 'success', expiring: 'warning', expired: 'danger' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { active: '生效中', expiring: '即将到期', expired: '已过期' }
  return texts[status] || status
}

function isExpiringSoon(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const diff = (date - now) / (1000 * 60 * 60 * 24)
  return diff <= 30 && diff > 0
}

async function loadContracts() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value || ''
    })
    const response = await fetch(`http://localhost:3001/api/contracts?${params}`)
    const data = await response.json()
    if (data.success) {
      tableData.value = data.data.map(item => ({
        ...item,
        contractNumber: item.contract_number,
        contractName: item.contract_name,
        supplierName: item.supplier_name,
        signDate: item.sign_date,
        expireDate: item.expire_date,
        amount: item.amount
      }))
      total.value = data.total
    }
  } catch (error) {
    console.error('加载合同数据失败:', error)
    ElMessage.error('加载合同数据失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadContracts()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleDelete(row) {
  if (!confirm(`确定要删除合同 ${row.contractNumber} 吗？`)) return

  loading.value = true
  try {
    const response = await fetch(`http://localhost:3001/api/contracts/${row.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.success) {
      tableData.value = tableData.value.filter(item => item.id !== row.id)
      ElMessage.success('删除成功')
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('删除合同失败:', error)
    ElMessage.error('删除失败')
  } finally {
    loading.value = false
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的合同')
    return
  }

  if (!confirm(`确定要删除选中的 ${selectedRows.value.length} 个合同吗？`)) return

  loading.value = true
  try {
    for (const row of selectedRows.value) {
      const response = await fetch(`http://localhost:3001/api/contracts/${row.id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }
    }
    ElMessage.success(`已成功删除 ${selectedRows.value.length} 个合同`)
    selectedRows.value = []
    loadContracts()
  } catch (error) {
    console.error('批量删除合同失败:', error)
    ElMessage.error('批量删除失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadContracts()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .search-input {
    width: 300px;
  }
}

.text-danger {
  color: #f56c6c;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>

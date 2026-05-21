<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>供应商管理</h1>
        <p>管理供应商信息与评级</p>
      </div>
      <el-button type="primary" icon="Plus" @click="showCreateModal = true">
        新增供应商信息
      </el-button>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索供应商编码、名称"
          class="search-input"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="categoryFilter" placeholder="类别筛选" class="status-select">
          <el-option label="全部" value="" />
          <el-option label="原材料" value="raw" />
          <el-option label="辅材" value="auxiliary" />
          <el-option label="设备" value="equipment" />
          <el-option label="服务" value="service" />
        </el-select>
        <el-select v-model="statusFilter" placeholder="状态筛选" class="status-select">
          <el-option label="全部" value="" />
          <el-option label="已认证" value="certified" />
          <el-option label="待审核" value="pending" />
          <el-option label="已禁用" value="disabled" />
        </el-select>
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>

      <el-table :data="filteredData" border style="width: 100%" @selection-change="handleSelectionChange" ref="tableRef" v-loading="loading">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="supplierCode" label="供应商编码" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="180" />
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag>{{ getCategoryText(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评级" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="certifiedAt" label="认证时间" width="160">
          <template #default="{ row }">{{ formatDate(row.certifiedAt) }}</template>
        </el-table-column>
        <el-table-column prop="expiryDate" label="有效期至" width="160">
          <template #default="{ row }">{{ formatDate(row.expiryDate) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click.stop="viewSupplier(row)">查看</el-button>
            <el-button size="small" type="primary" @click.stop="editSupplier(row)">编辑</el-button>
            <el-button size="small" type="info" @click.stop="goToAccount(row)">账户管理</el-button>
            <template v-if="row.status === 'certified'">
              <el-button size="small" type="warning" @click.stop="disableSupplier(row)">禁用</el-button>
            </template>
            <template v-else-if="row.status === 'disabled'">
              <el-button size="small" type="success" @click.stop="enableSupplier(row)">启用</el-button>
            </template>
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
          @current-change="pagination.page = $event; loadSuppliers()"
        />
      </div>
    </el-card>

    <el-dialog :title="selectedSupplier?.supplierCode ? '编辑供应商信息' : '新增供应商信息'" :visible.sync="showCreateModal" width="650px">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="供应商编码" prop="supplierCode">
          <el-input v-model="formData.supplierCode" placeholder="自动生成" disabled />
        </el-form-item>
        <el-form-item label="供应商名称" prop="supplierName">
          <el-input v-model="formData.supplierName" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="简称" prop="shortName">
          <el-input v-model="formData.shortName" placeholder="请输入供应商简称" />
        </el-form-item>
        <el-form-item label="类别" prop="category">
          <el-select v-model="formData.category" placeholder="请选择类别">
            <el-option label="原材料" value="raw" />
            <el-option label="辅材" value="auxiliary" />
            <el-option label="设备" value="equipment" />
            <el-option label="服务" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="经营范围" prop="businessScope">
          <el-input v-model="formData.businessScope" placeholder="请输入经营范围" />
        </el-form-item>
        <el-form-item label="注册资本" prop="registeredCapital">
          <el-input v-model="formData.registeredCapital" placeholder="请输入注册资本" />
        </el-form-item>
        <el-form-item label="员工人数" prop="employees">
          <el-input v-model.number="formData.employees" type="number" placeholder="请输入员工人数" />
        </el-form-item>
        <el-form-item label="成立年份" prop="establishedYear">
          <el-input v-model.number="formData.establishedYear" type="number" placeholder="请输入成立年份" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注信息" rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false; resetForm()">取消</el-button>
        <el-button type="primary" @click="createSupplier">确认{{ selectedSupplier?.supplierCode ? '更新' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Box } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSupplierProfiles, createSupplierProfile, updateSupplierProfile, deleteSupplierProfile, certifySupplierProfile } from '@/db/api'

const router = useRouter()

const tableData = ref([])
const total = ref(0)
const searchKeyword = ref('')
const categoryFilter = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const selectedSupplier = ref(null)
const selectedRows = ref([])
const tableRef = ref(null)
const loading = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const formData = reactive({
  supplierCode: '',
  supplierName: '',
  category: '',
  shortName: '',
  businessScope: '',
  registeredCapital: '',
  employees: '',
  establishedYear: new Date().getFullYear(),
  remark: ''
})

const filteredData = computed(() => {
  let result = tableData.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item =>
      item.supplierCode.toLowerCase().includes(keyword) ||
      item.supplierName.toLowerCase().includes(keyword)
    )
  }

  if (categoryFilter.value) {
    result = result.filter(item => item.category === categoryFilter.value)
  }

  if (statusFilter.value) {
    result = result.filter(item => item.status === statusFilter.value)
  }

  return result
})

function getCategoryText(category) {
  const texts = { raw: '原材料', auxiliary: '辅材', equipment: '设备', service: '服务' }
  return texts[category] || category
}

function getStatusType(status) {
  const types = { certified: 'success', pending: 'warning', disabled: 'info' }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = { certified: '已认证', pending: '待审核', disabled: '已禁用' }
  return texts[status] || status
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

async function loadSuppliers() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value || '',
      category: categoryFilter.value || '',
      status: statusFilter.value || ''
    }
    const data = await getSupplierProfiles(params)
    if (data.success) {
      tableData.value = data.data
      total.value = data.total
    }
  } catch (error) {
    console.error('加载供应商数据失败:', error)
    ElMessage.error('加载供应商数据失败')
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  loadSuppliers()
}

function viewSupplier(row) {
  selectedSupplier.value = row
  ElMessage.info(`查看供应商: ${row.supplierName}`)
}

function editSupplier(row) {
  selectedSupplier.value = row
  Object.assign(formData, {
    supplierCode: row.supplierCode,
    supplierName: row.supplierName,
    category: row.category,
    shortName: row.shortName || '',
    businessScope: row.businessScope || '',
    registeredCapital: row.registeredCapital || '',
    employees: row.employees || '',
    establishedYear: row.establishedYear || new Date().getFullYear(),
    remark: row.remark || ''
  })
  showCreateModal.value = true
}

function goToAccount(row) {
  router.push('/supplier-accounts')
}

async function createSupplier() {
  if (!formData.supplierName) {
    ElMessage.warning('请输入供应商名称')
    return
  }

  if (!formData.category) {
    ElMessage.warning('请选择类别')
    return
  }

  loading.value = true
  try {
    const isEdit = !!selectedSupplier.value?.id
    let data

    if (isEdit) {
      data = await updateSupplierProfile(selectedSupplier.value.id, {
        supplierName: formData.supplierName,
        category: formData.category,
        shortName: formData.shortName,
        businessScope: formData.businessScope,
        registeredCapital: formData.registeredCapital,
        employees: parseInt(formData.employees) || 0,
        establishedYear: parseInt(formData.establishedYear) || new Date().getFullYear(),
        remark: formData.remark
      })
    } else {
      const newCode = `SUP${String(tableData.value.length + 1).padStart(3, '0')}`
      data = await createSupplierProfile({
        supplierCode: newCode,
        supplierName: formData.supplierName,
        category: formData.category,
        shortName: formData.shortName,
        businessScope: formData.businessScope,
        registeredCapital: formData.registeredCapital,
        employees: parseInt(formData.employees) || 0,
        establishedYear: parseInt(formData.establishedYear) || new Date().getFullYear(),
        remark: formData.remark
      })
    }

    if (data.success) {
      ElMessage.success(isEdit ? '供应商信息更新成功' : '供应商信息创建成功')
      loadSuppliers()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('保存供应商失败:', error)
    ElMessage.error('保存供应商失败')
  } finally {
    loading.value = false
    showCreateModal.value = false
    resetForm()
  }
}

function resetForm() {
  formData.supplierCode = ''
  formData.supplierName = ''
  formData.category = ''
  formData.shortName = ''
  formData.businessScope = ''
  formData.registeredCapital = ''
  formData.employees = ''
  formData.establishedYear = new Date().getFullYear()
  formData.remark = ''
  selectedSupplier.value = null
}

async function disableSupplier(row) {
  loading.value = true
  try {
    const data = await updateSupplierProfile(row.id, { status: 'disabled' })
    if (data.success) {
      row.status = 'disabled'
      ElMessage.success('供应商已禁用')
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('禁用供应商失败:', error)
    ElMessage.error('禁用供应商失败')
  } finally {
    loading.value = false
  }
}

async function enableSupplier(row) {
  loading.value = true
  try {
    const expiryDate = new Date()
    expiryDate.setFullYear(expiryDate.getFullYear() + 1)
    const data = await certifySupplierProfile(row.id, row.auditScore || 80, expiryDate.toISOString().split('T')[0])
    if (data.success) {
      row.status = 'certified'
      ElMessage.success('供应商已启用')
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('启用供应商失败:', error)
    ElMessage.error('启用供应商失败')
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的供应商')
    return
  }

  if (!confirm(`确定要删除选中的 ${selectedRows.value.length} 个供应商吗？`)) return

  loading.value = true
  try {
    for (const row of selectedRows.value) {
      const data = await deleteSupplierProfile(row.id)
      if (!data.success) {
        throw new Error(data.error)
      }
    }
    ElMessage.success(`已成功删除 ${selectedRows.value.length} 个供应商`)
    selectedRows.value = []
    loadSuppliers()
  } catch (error) {
    console.error('批量删除供应商失败:', error)
    ElMessage.error('批量删除失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSuppliers()
})
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .header-content {
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
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;

  .search-input {
    width: 300px;
  }

  .status-select {
    width: 140px;
  }
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>
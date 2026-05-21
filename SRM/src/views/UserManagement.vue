<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>用户管理</h1>
        <p>管理供应商子账号与角色授权</p>
      </div>
      <div class="header-icon">
        <el-icon><Users /></el-icon>
      </div>
    </div>

    <el-card class="content-card">
      <div class="toolbar">
        <div class="toolbar-row">
          <div class="filter-row">
            <el-input v-model="filterName" placeholder="用户名" style="width: 160px" clearable @change="handleSearch" />
            <el-input v-model="filterPhone" placeholder="手机号" style="width: 140px" clearable @change="handleSearch" />
            <el-select v-model="filterRole" placeholder="角色" style="width: 140px" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="状态" style="width: 100px" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </div>
          <div class="action-row">
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="success" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <el-table :data="displayData" border style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="45" />
          <el-table-column prop="id" label="用户ID" width="80" />
          <el-table-column prop="username" label="用户名" width="120" />
          <el-table-column prop="realName" label="真实姓名" width="100" />
          <el-table-column prop="phone" label="手机号" width="120" />
          <el-table-column prop="email" label="邮箱" width="180" />
          <el-table-column prop="roleName" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.roleId)">{{ row.roleName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <el-switch :value="row.status === 'active'" @change="handleStatusChange(row)" />
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="140" />
          <el-table-column prop="lastLogin" label="最后登录" width="140">
            <template #default="{ row }">
              <span v-if="row.lastLogin">{{ row.lastLogin }}</span>
              <span v-else class="no-data">未登录</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
                <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" link size="small" @click="handleResetPwd(row)">重置密码</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <div class="selected-info" v-if="selectedRows.length > 0">
            <el-button type="danger" @click="handleBatchDelete" size="small">
              <el-icon><Delete /></el-icon> 批量删除 ({{ selectedRows.length }})
            </el-button>
          </div>
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="total"
            class="pagination"
            @current-change="pagination.page = $event; loadUsers()"
            @size-change="pagination.pageSize = $event; loadUsers()"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="formData" label-width="100px" class="form-container">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="formData.realName" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色">
            <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" v-if="dialogType === 'add'">
          <el-input type="password" v-model="formData.password" placeholder="请输入密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewDialogVisible" title="用户详情" width="500px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
        <el-descriptions-item label="用户名">{{ currentUser.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ currentUser.realName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ currentUser.email }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ currentUser.roleName }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentUser.status === 'active' ? 'success' : 'warning'">
            {{ currentUser.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentUser.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="最后登录" :span="2">
          <span v-if="currentUser.lastLogin">{{ currentUser.lastLogin }}</span>
          <span v-else>未登录</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Refresh, Plus, Delete } from '@element-plus/icons-vue'

const loading = ref(false)
const pagination = reactive({ page: 1, pageSize: 15 })
const total = ref(0)

const filterName = ref('')
const filterPhone = ref('')
const filterRole = ref('')
const filterStatus = ref('')

const tableData = ref([])
const selectedRows = ref([])

const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogType = ref('add')
const dialogTitle = ref('')

const formData = reactive({
  id: '',
  username: '',
  realName: '',
  phone: '',
  email: '',
  roleId: '',
  password: ''
})

const currentUser = reactive({
  id: '',
  username: '',
  realName: '',
  phone: '',
  email: '',
  roleId: '',
  roleName: '',
  status: '',
  createdAt: '',
  lastLogin: ''
})

const roleList = [
  { id: 'supplier_admin', name: '供应商主管理员' },
  { id: 'quotation_clerk', name: '报价员' },
  { id: 'order_clerk', name: '订单专员' },
  { id: 'finance_clerk', name: '财务对账员' },
  { id: 'quality_clerk', name: '质量专员' },
  { id: 'read_only', name: '只读用户' }
]

const mockUsers = [
  { id: 'U001', username: 'admin', realName: '张三', phone: '13800138001', email: 'zhangsan@company.com', roleId: 'supplier_admin', roleName: '供应商主管理员', status: 'active', createdAt: '2024-01-15 10:30:00', lastLogin: '2024-01-20 14:20:00' },
  { id: 'U002', username: 'quotation', realName: '李四', phone: '13800138002', email: 'lisi@company.com', roleId: 'quotation_clerk', roleName: '报价员', status: 'active', createdAt: '2024-01-16 09:15:00', lastLogin: '2024-01-19 16:45:00' },
  { id: 'U003', username: 'order', realName: '王五', phone: '13800138003', email: 'wangwu@company.com', roleId: 'order_clerk', roleName: '订单专员', status: 'active', createdAt: '2024-01-17 11:20:00', lastLogin: '2024-01-20 09:30:00' },
  { id: 'U004', username: 'finance', realName: '赵六', phone: '13800138004', email: 'zhaoliu@company.com', roleId: 'finance_clerk', roleName: '财务对账员', status: 'active', createdAt: '2024-01-18 14:00:00', lastLogin: '2024-01-19 11:15:00' },
  { id: 'U005', username: 'quality', realName: '孙七', phone: '13800138005', email: 'sunqi@company.com', roleId: 'quality_clerk', roleName: '质量专员', status: 'disabled', createdAt: '2024-01-19 08:30:00', lastLogin: '' },
  { id: 'U006', username: 'readonly', realName: '周八', phone: '13800138006', email: 'zhouba@company.com', roleId: 'read_only', roleName: '只读用户', status: 'active', createdAt: '2024-01-20 10:00:00', lastLogin: '2024-01-20 15:30:00' }
]

const displayData = computed(() => {
  return tableData.value.filter(item => {
    if (filterName.value && !item.username.includes(filterName.value) && !item.realName.includes(filterName.value)) return false
    if (filterPhone.value && !item.phone.includes(filterPhone.value)) return false
    if (filterRole.value && item.roleId !== filterRole.value) return false
    if (filterStatus.value && item.status !== filterStatus.value) return false
    return true
  })
})

onMounted(() => {
  loadUsers()
})

function loadUsers() {
  loading.value = true
  setTimeout(() => {
    tableData.value = mockUsers
    total.value = mockUsers.length
    loading.value = false
  }, 500)
}

function handleSearch() {
  pagination.page = 1
}

function handleRefresh() {
  pagination.page = 1
  loadUsers()
  ElMessage.success('数据已刷新')
}

function handleSelectionChange(val) {
  selectedRows.value = val
}

function handleAdd() {
  dialogType.value = 'add'
  dialogTitle.value = '新增用户'
  Object.assign(formData, { id: '', username: '', realName: '', phone: '', email: '', roleId: '', password: '' })
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑用户'
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    realName: row.realName,
    phone: row.phone,
    email: row.email,
    roleId: row.roleId,
    password: ''
  })
  dialogVisible.value = true
}

function handleView(row) {
  Object.assign(currentUser, row)
  viewDialogVisible.value = true
}

function handleResetPwd(row) {
  ElMessageBox.confirm(`确定要重置 ${row.username} 的密码吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('密码已重置为默认值：123456')
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

function handleStatusChange(row) {
  const newStatus = row.status === 'active' ? 'disabled' : 'active'
  ElMessage.success(`用户 ${row.username} 已${newStatus === 'active' ? '启用' : '禁用'}`)
  row.status = newStatus
}

function handleSubmit() {
  if (!formData.username || !formData.realName || !formData.roleId) {
    ElMessage.warning('请填写必填字段')
    return
  }
  
  if (dialogType.value === 'add') {
    if (!formData.password) {
      ElMessage.warning('请设置密码')
      return
    }
    const newUser = {
      id: `U${String(Date.now()).slice(-3)}`,
      ...formData,
      roleName: roleList.find(r => r.id === formData.roleId)?.name || '',
      status: 'active',
      createdAt: new Date().toLocaleString('zh-CN'),
      lastLogin: ''
    }
    tableData.value.unshift(newUser)
    total.value++
    ElMessage.success('用户创建成功')
  } else {
    const index = tableData.value.findIndex(u => u.id === formData.id)
    if (index !== -1) {
      tableData.value[index] = {
        ...tableData.value[index],
        username: formData.username,
        realName: formData.realName,
        phone: formData.phone,
        email: formData.email,
        roleId: formData.roleId,
        roleName: roleList.find(r => r.id === formData.roleId)?.name || ''
      }
      ElMessage.success('用户更新成功')
    }
  }
  dialogVisible.value = false
}

function handleBatchDelete() {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个用户吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    const ids = selectedRows.value.map(r => r.id)
    tableData.value = tableData.value.filter(u => !ids.includes(u.id))
    total.value = tableData.value.length
    selectedRows.value = []
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

function getRoleType(roleId) {
  const types = {
    supplier_admin: 'primary',
    quotation_clerk: 'success',
    order_clerk: 'warning',
    finance_clerk: 'info',
    quality_clerk: 'danger',
    read_only: 'default'
  }
  return types[roleId] || 'default'
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 1px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05) rotate(3deg);
    }

    .el-icon {
      font-size: 28px;
      color: #ffffff;
    }
  }
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }
}

.toolbar {
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 10px;
}

.table-wrapper {
  padding: 16px 20px;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    th {
      background: #fafafa !important;
      color: #303133;
      font-weight: 600;
      font-size: 13px;
    }

    td {
      padding: 12px 0;
    }
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
}

.pagination {
  text-align: right;
}

.no-data {
  color: #c0c4cc;
}

.action-buttons {
  display: flex;
  gap: 4px;
}

.form-container {
  padding: 20px 0;
}
</style>
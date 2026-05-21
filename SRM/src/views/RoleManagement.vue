<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>角色管理</h1>
        <p>管理供应商角色与权限配置</p>
      </div>
      <div class="header-icon">
        <el-icon><UserFilled /></el-icon>
      </div>
    </div>

    <div class="role-grid">
      <el-card v-for="role in roleList" :key="role.id" class="role-card" :class="{ 'role-card-active': selectedRole?.id === role.id }" @click="selectRole(role)">
        <div class="role-header">
          <div class="role-icon" :style="{ background: getRoleGradient(role.id) }">
            <el-icon :size="24">{{ getRoleIcon(role.id) }}</el-icon>
          </div>
          <div class="role-info">
            <h3>{{ role.name }}</h3>
            <p>{{ role.description }}</p>
          </div>
        </div>
        <div class="role-permissions">
          <div class="permission-tags">
            <el-tag v-for="perm in getRolePermissionNames(role)" :key="perm" size="small">{{ perm }}</el-tag>
          </div>
        </div>
        <div class="role-action">
          <el-button type="text" size="small" @click.stop="handleEdit(role)">编辑</el-button>
          <el-button type="text" size="small" @click.stop="handleDelete(role)" v-if="role.id !== 'supplier_admin'">删除</el-button>
        </div>
      </el-card>

      <el-card class="role-card role-card-add" @click="handleAdd">
        <div class="add-icon">
          <el-icon :size="48" color="#909399"><Plus /></el-icon>
        </div>
        <p class="add-text">创建新角色</p>
      </el-card>
    </div>

    <el-card class="content-card" v-if="selectedRole">
      <h3 class="section-title">权限详情</h3>
      <div class="permission-section">
        <el-table :data="permissionGroups" border style="width: 100%">
          <el-table-column prop="module" label="权限模块" width="150" />
          <el-table-column label="权限列表">
            <template #default="{ row }">
              <div class="permission-items">
                <el-checkbox-group v-model="selectedPermissions">
                  <el-checkbox v-for="perm in row.permissions" :key="perm.id" :label="perm.id">
                    {{ perm.name }}
                  </el-checkbox>
                </el-checkbox-group>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="permission-actions">
          <el-button type="primary" @click="savePermissions">保存权限</el-button>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="formData" label-width="100px" class="form-container">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-textarea v-model="formData.description" placeholder="请输入角色描述" :rows="3" />
        </el-form-item>
        <el-form-item label="权限配置">
          <el-checkbox-group v-model="formData.permissions">
            <el-row :gutter="20">
              <el-col v-for="perm in allPermissions" :key="perm.id" :span="12">
                <el-checkbox :label="perm.id">{{ perm.name }}</el-checkbox>
              </el-col>
            </el-row>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Plus, Star, Document, ShoppingCart, Wallet, CircleCheck, Grid } from '@element-plus/icons-vue'

const dialogVisible = ref(false)
const dialogType = ref('add')
const dialogTitle = ref('')
const selectedRole = ref(null)
const selectedPermissions = ref([])

const formData = reactive({
  id: '',
  name: '',
  description: '',
  permissions: []
})

const allPermissions = [
  { id: 'user_manage', name: '子账号管理', module: '用户管理' },
  { id: 'company_info', name: '企业信息修改', module: '企业管理' },
  { id: 'quotation', name: '报价/投标', module: '业务操作' },
  { id: 'order_confirm', name: '订单确认/发货', module: '业务操作' },
  { id: 'reconciliation', name: '对账/发票', module: '财务操作' },
  { id: 'contract_sign', name: '合同签署', module: '业务操作' },
  { id: 'quality_handle', name: '质量处理', module: '质量操作' },
  { id: 'view_order', name: '查看订单', module: '数据查看' },
  { id: 'view_contract', name: '查看合同', module: '数据查看' },
  { id: 'view_performance', name: '查看绩效', module: '数据查看' }
]

const roleList = ref([
  { id: 'supplier_admin', name: '供应商主管理员', description: '子账号增删改、角色分配、企业信息维护、全部待办', permissions: ['user_manage', 'company_info', 'quotation', 'order_confirm', 'reconciliation', 'contract_sign', 'quality_handle', 'view_order', 'view_contract', 'view_performance'] },
  { id: 'quotation_clerk', name: '报价员', description: '查看询价、报价、谈判、投标', permissions: ['quotation', 'view_order', 'view_contract'] },
  { id: 'order_clerk', name: '订单专员', description: '订单确认、交期回复、发货通知、物流跟踪', permissions: ['order_confirm', 'view_order'] },
  { id: 'finance_clerk', name: '财务对账员', description: '对账确认、发票上传/匹配、付款查询', permissions: ['reconciliation', 'view_contract'] },
  { id: 'quality_clerk', name: '质量专员', description: '质量整改、检验报告上传、异常反馈', permissions: ['quality_handle'] },
  { id: 'read_only', name: '只读用户', description: '查看订单/合同/绩效，无操作权', permissions: ['view_order', 'view_contract', 'view_performance'] }
])

const permissionGroups = computed(() => {
  const groups = {}
  allPermissions.forEach(perm => {
    if (!groups[perm.module]) {
      groups[perm.module] = []
    }
    groups[perm.module].push(perm)
  })
  return Object.keys(groups).map(module => ({
    module,
    permissions: groups[module]
  }))
})

function selectRole(role) {
  selectedRole.value = role
  selectedPermissions.value = [...role.permissions]
}

function handleAdd() {
  dialogType.value = 'add'
  dialogTitle.value = '创建新角色'
  Object.assign(formData, { id: '', name: '', description: '', permissions: [] })
  dialogVisible.value = true
}

function handleEdit(role) {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑角色'
  Object.assign(formData, { id: role.id, name: role.name, description: role.description, permissions: [...role.permissions] })
  dialogVisible.value = true
}

function handleDelete(role) {
  ElMessageBox.confirm(`确定要删除角色 "${role.name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    roleList.value = roleList.value.filter(r => r.id !== role.id)
    if (selectedRole.value?.id === role.id) {
      selectedRole.value = null
    }
    ElMessage.success('角色已删除')
  }).catch(() => {
    ElMessage.info('已取消')
  })
}

function handleSubmit() {
  if (!formData.name) {
    ElMessage.warning('请输入角色名称')
    return
  }
  
  if (dialogType.value === 'add') {
    const newRole = {
      id: `role_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      permissions: formData.permissions
    }
    roleList.value.push(newRole)
    ElMessage.success('角色创建成功')
  } else {
    const index = roleList.value.findIndex(r => r.id === formData.id)
    if (index !== -1) {
      roleList.value[index] = {
        ...roleList.value[index],
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      }
      if (selectedRole.value?.id === formData.id) {
        selectedRole.value = roleList.value[index]
        selectedPermissions.value = [...formData.permissions]
      }
      ElMessage.success('角色更新成功')
    }
  }
  dialogVisible.value = false
}

function savePermissions() {
  if (!selectedRole.value) return
  
  const index = roleList.value.findIndex(r => r.id === selectedRole.value.id)
  if (index !== -1) {
    roleList.value[index].permissions = [...selectedPermissions.value]
    selectedRole.value = roleList.value[index]
    ElMessage.success('权限配置已保存')
  }
}

function getRoleGradient(roleId) {
  const gradients = {
    supplier_admin: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    quotation_clerk: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    order_clerk: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    finance_clerk: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    quality_clerk: 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)',
    read_only: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  }
  return gradients[roleId] || gradients.supplier_admin
}

function getRoleIcon(roleId) {
  const icons = {
    supplier_admin: Star,
    quotation_clerk: Document,
    order_clerk: ShoppingCart,
    finance_clerk: Wallet,
    quality_clerk: CircleCheck,
    read_only: Grid
  }
  return icons[roleId] || Star
}

function getRolePermissionNames(role) {
  return role.permissions.map(permId => {
    const perm = allPermissions.find(p => p.id === permId)
    return perm ? perm.name : permId
  }).slice(0, 5)
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

    .el-icon {
      font-size: 28px;
      color: #ffffff;
    }
  }
}

.role-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.role-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  border-radius: 12px;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }

  &.role-card-active {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.05);
  }

  .role-header {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;

    .role-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
    }

    .role-info {
      flex: 1;

      h3 {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }

  .role-permissions {
    margin-bottom: 12px;

    .permission-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
  }

  .role-action {
    display: flex;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }
}

.role-card-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 2px dashed #d9d9d9;
  background: #fafafa;

  &:hover {
    border-color: #409eff;
    background: rgba(64, 158, 255, 0.05);

    .add-icon {
      background: rgba(64, 158, 255, 0.1);
    }

    .el-icon {
      color: #409eff;
    }
  }

  .add-icon {
    width: 70px;
    height: 70px;
    border-radius: 50%;
    background: #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
    transition: all 0.3s ease;
  }

  .add-text {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.permission-section {
  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .permission-items {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .permission-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.form-container {
  padding: 20px 0;
}
</style>
<template>
  <div class="settings-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>系统设置</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card v-loading="loading">
      <template #header>
        <span>系统设置</span>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础设置" name="basic" v-if="hasSystemSettingsPermission">
          <el-form ref="basicFormRef" :model="basicForm" label-width="160px" style="max-width: 600px">
            <el-form-item label="铜价(元/吨)">
              <el-input-number v-model="basicForm.copperPrice" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-form-item label="铜加工费(元/吨)">
              <el-input-number v-model="basicForm.copperProcessFee" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-form-item label="填充材料价格(元/吨)">
              <el-input-number v-model="basicForm.fillerPrice" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-divider>PVC线胶料价格(元/吨)</el-divider>

            <el-form-item label="欧/国/日/台规">
              <el-input-number v-model="basicForm.pvcMaterialPriceEU" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-form-item label="美规">
              <el-input-number v-model="basicForm.pvcMaterialPriceUS" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-divider>橡胶线胶料价格(元/吨)</el-divider>

            <el-form-item label="欧规">
              <el-input-number v-model="basicForm.rubberMaterialPriceEU" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-form-item label="美规">
              <el-input-number v-model="basicForm.rubberMaterialPriceUS" :min="0" :precision="0" style="width: 100%" />
            </el-form-item>

            <el-divider>EV电动汽车电缆材料价格(元/吨)</el-divider>

            <el-form-item label="XLPE (交联聚乙烯)">
              <el-input-number v-model="basicForm.xlpeMaterialPrice" :min="0" :precision="0" style="width: 100%" />
              <span class="text-gray text-sm ml-2">适用于: H01Z2Z2-K、EV HV、高压电缆</span>
            </el-form-item>

            <el-form-item label="XLPO (交联聚烯烃)">
              <el-input-number v-model="basicForm.xlpoMaterialPrice" :min="0" :precision="0" style="width: 100%" />
              <span class="text-gray text-sm ml-2">适用于: 电池电缆</span>
            </el-form-item>

            <el-form-item label="TPE (热塑性弹性体)">
              <el-input-number v-model="basicForm.tpeMaterialPrice" :min="0" :precision="0" style="width: 100%" />
              <span class="text-gray text-sm ml-2">适用于: 充电枪电缆</span>
            </el-form-item>

            <el-form-item label="EPDM (三元乙丙橡胶)">
              <el-input-number v-model="basicForm.epdmMaterialPrice" :min="0" :precision="0" style="width: 100%" />
              <span class="text-gray text-sm ml-2">适用于: H07BQ-F、H05BQ-F</span>
            </el-form-item>

            <el-form-item label="Silicone (硅橡胶)">
              <el-input-number v-model="basicForm.siliconeMaterialPrice" :min="0" :precision="0" style="width: 100%" />
              <span class="text-gray text-sm ml-2">适用于: 高温电缆、特种电缆</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="利润率设置" name="profit" v-if="hasSystemSettingsPermission">
          <el-form ref="profitFormRef" :model="profitForm" label-width="220px" style="max-width: 700px">
            <el-form-item label="默认利润率">
              <el-slider v-model="profitForm.profitMargin" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMargin) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-divider>传统电线利润率</el-divider>

            <el-form-item label="PVC线利润率">
              <el-slider v-model="profitForm.profitMarginPVC" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginPVC) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="橡胶线利润率">
              <el-slider v-model="profitForm.profitMarginRubber" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginRubber) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-divider>EV电动汽车电缆利润率</el-divider>

            <el-form-item label="XLPE材料利润率">
              <el-slider v-model="profitForm.profitMarginXLPE" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginXLPE) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="XLPO材料利润率">
              <el-slider v-model="profitForm.profitMarginXLPO" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginXLPO) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="TPE材料利润率">
              <el-slider v-model="profitForm.profitMarginTPE" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginTPE) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="EPDM材料利润率">
              <el-slider v-model="profitForm.profitMarginEPDM" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginEPDM) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="Silicone材料利润率">
              <el-slider v-model="profitForm.profitMarginSilicone" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginSilicone) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item label="EV通用利润率">
              <el-slider v-model="profitForm.profitMarginEV" :min="0.5" :max="0.95" :step="0.01" show-input :format-tooltip="formatProfitMargin" />
              <span class="text-gray ml-2">毛利率: {{ ((1 - profitForm.profitMarginEV) * 100).toFixed(1) }}%</span>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveProfitSettings" :loading="saving">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="角色管理" name="roles" v-if="hasRoleManagePermission">
          <div class="roles-section">
            <div class="flex justify-between items-center mb-4">
              <span>角色列表</span>
              <el-button type="primary" @click="openRoleAddDialog">
                <el-icon><Plus /></el-icon> 添加角色
              </el-button>
            </div>

            <el-table :data="roles" v-loading="rolesLoading" border>
              <el-table-column prop="id" label="角色ID" width="120" />
              <el-table-column prop="name" label="角色名称" width="140" />
              <el-table-column prop="description" label="角色描述" min-width="200" />
              <el-table-column label="权限数量" width="100">
                <template #default="{ row }">{{ row.permissions?.length || 0 }}</template>
              </el-table-column>
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openRoleEditDialog(row)" :disabled="row.id === 'admin'">编辑</el-button>
                  <el-button link type="danger" @click="handleRoleDelete(row)" :disabled="row.id === 'admin'">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户管理" name="users" v-if="hasUserManagePermission">
          <div class="users-section">
            <div class="flex justify-between items-center mb-4">
              <span>系统用户列表</span>
              <el-button type="primary" @click="openUserAddDialog">
                <el-icon><Plus /></el-icon> 添加用户
              </el-button>
            </div>

            <div class="flex gap-3 mb-4">
              <el-input
                v-model="userSearchKeyword"
                placeholder="搜索用户名、姓名、邮箱..."
                style="width: 300px"
                clearable
                @clear="loadUsers"
                @keyup.enter="loadUsers"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="userRoleFilter" placeholder="筛选角色" style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="超级管理员" value="admin" />
                <el-option label="报价人" value="salesperson" />
                <el-option label="查看员" value="viewer" />
              </el-select>
              <el-button @click="loadUsers">搜索</el-button>
            </div>

            <el-table :data="users" v-loading="usersLoading" @selection-change="handleUserSelectionChange" border>
              <el-table-column type="selection" width="50" />
              <el-table-column prop="username" label="用户名" width="120" />
              <el-table-column prop="name" label="姓名" width="100" />
              <el-table-column prop="phone" label="电话" width="130" />
              <el-table-column prop="department" label="部门" width="120" />
              <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
              <el-table-column prop="role" label="角色" width="100">
                <template #default="{ row }">
                  <el-tag :type="getRoleTagType(row.role)">{{ getRoleName(row.role) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'active' ? 'success' : 'warning'">
                    {{ row.status === 'active' ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="管理客户" width="100">
                <template #default="{ row }">
                  <el-tag type="info" v-if="!row.customerIds || row.customerIds.length === 0">全部</el-tag>
                  <el-tag type="success" v-else>{{ row.customerIds.length }}个</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="160">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" @click="openSystemUserEditDialog(row)">编辑</el-button>
                  <el-button link type="warning" @click="openResetPasswordDialog(row)">重置密码</el-button>
                  <el-button link type="danger" @click="handleSystemUserDelete(row)" :disabled="row.id === 1">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="flex justify-between items-center mt-4">
              <el-button v-if="selectedUsers.length > 0" type="danger" @click="handleUserBatchDelete">
                批量删除 ({{ selectedUsers.length }})
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleDialogTitle" width="700px">
      <el-form ref="roleFormRef" :model="roleForm" label-width="100px">
        <el-form-item label="角色ID">
          <el-input v-model="roleForm.id" placeholder="请输入角色ID" :disabled="!!roleForm.id" />
        </el-form-item>
        <el-form-item label="角色名称">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="roleForm.description" placeholder="请输入角色描述" />
        </el-form-item>
        <el-form-item label="权限列表">
          <el-checkbox-group v-model="roleForm.permissions">
            <el-checkbox v-for="perm in permissions" :key="perm.id" :label="perm.id">{{ perm.name }} - {{ perm.description }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRoleSubmit" :loading="roleSubmitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 系统用户添加/编辑对话框 -->
    <el-dialog v-model="systemUserDialogVisible" :title="systemUserDialogTitle" width="700px">
      <el-form ref="systemUserFormRef" :model="systemUserForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="systemUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="systemUserForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="systemUserForm.phone" placeholder="请输入电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="systemUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="systemUserForm.department" placeholder="请输入部门" />
        </el-form-item>
        <el-form-item label="密码" v-if="!systemUserForm.id">
          <el-input v-model="systemUserForm.password" type="password" placeholder="请输入密码（至少 6 位）" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="systemUserForm.role" placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="systemUserForm.status">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item label="管理客户权限">
          <el-select v-model="systemUserForm.customerIds" multiple placeholder="选择客户（不选则可管理所有客户）" style="width: 100%">
            <el-option 
              v-for="customer in customers" 
              :key="customer.id" 
              :label="customer.customerNo ? `${customer.name} (${customer.customerNo})` : customer.name" 
              :value="customer.id" 
            />
          </el-select>
          <div class="text-gray text-sm mt-1">提示：不选择任何客户表示该用户可以管理所有客户</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="systemUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSystemUserSubmit" :loading="systemUserSubmitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialogVisible" title="重置密码" width="400px">
      <el-form ref="resetPasswordFormRef" :model="resetPasswordForm" label-width="100px">
        <el-form-item label="新密码">
          <el-input v-model="resetPasswordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleResetPassword" :loading="resetPasswordSubmitting">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { settingsApi, authApi, customersApi, rolesApi, salespersonsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { useAuthStore } from '../stores/auth'

// 权限控制
const authStore = useAuthStore()

const hasSystemSettingsPermission = computed(() => authStore.hasPermission('system_settings'))
const hasRoleManagePermission = computed(() => authStore.hasPermission('role_manage'))
const hasUserManagePermission = computed(() => authStore.hasPermission('user_manage'))

// 基础设置
const activeTab = ref('basic')
const saving = ref(false)
const loading = ref(false)
const basicFormRef = ref()
const profitFormRef = ref()

const basicForm = reactive({
  copperPrice: 100000,
  copperProcessFee: 2000,
  fillerPrice: 8000,
  pvcMaterialPriceEU: 15000,
  pvcMaterialPriceUS: 18000,
  rubberMaterialPriceEU: 25000,
  rubberMaterialPriceUS: 28000,
  xlpeMaterialPrice: 18000,
  xlpoMaterialPrice: 20000,
  tpeMaterialPrice: 22000,
  epdmMaterialPrice: 16000,
  siliconeMaterialPrice: 35000
})

const profitForm = reactive({
  profitMargin: 0.85,
  profitMarginPVC: 0.85,
  profitMarginRubber: 0.8,
  profitMarginXLPE: 0.78,
  profitMarginXLPO: 0.75,
  profitMarginTPE: 0.76,
  profitMarginEPDM: 0.79,
  profitMarginSilicone: 0.72,
  profitMarginEV: 0.75
})

// 角色管理
const rolesLoading = ref(false)
const roleSubmitting = ref(false)
const roles = ref([])
const permissions = ref([])
const roleDialogVisible = ref(false)
const roleDialogTitle = ref('')
const roleFormRef = ref()

const roleForm = reactive({
  id: '',
  name: '',
  description: '',
  permissions: []
})

// 用户管理
const usersLoading = ref(false)
const systemUserSubmitting = ref(false)
const resetPasswordSubmitting = ref(false)
const users = ref([])
const selectedUsers = ref([])
const userSearchKeyword = ref('')
const userRoleFilter = ref('')
const systemUserDialogVisible = ref(false)
const systemUserDialogTitle = ref('')
const resetPasswordDialogVisible = ref(false)
const systemUserFormRef = ref()
const resetPasswordFormRef = ref()
const currentEditingUser = ref(null)
const customers = ref([])

const systemUserForm = reactive({
  id: null,
  username: '',
  name: '',
  phone: '',
  email: '',
  department: '',
  password: '',
  role: 'salesperson',
  status: 'active',
  customerIds: []
})

const resetPasswordForm = reactive({
  newPassword: '',
  confirmPassword: ''
})

// 报价人管理变量
const salespersonDialogVisible = ref(false)
const salespersonDialogTitle = ref('')
const salespersonSubmitting = ref(false)
const salespersons = ref([])
const selectedSalespersons = ref([])
const currentSalesperson = ref(null)

const salespersonForm = reactive({
  id: null,
  name: '',
  phone: '',
  email: '',
  department: '',
  customerIds: []
})

// 用户账户管理变量
const userDialogVisible = ref(false)
const userDialogTitle = ref('')
const userSubmitting = ref(false)

const userForm = reactive({
  username: '',
  password: '',
  role: 'salesperson',
  status: 'active'
})

// 加载系统设置
async function loadSettings() {
  loading.value = true
  try {
    const data = await settingsApi.get()
    if (data && typeof data === 'object') {
      Object.assign(basicForm, {
        copperPrice: data.copperPrice || 100000,
        copperProcessFee: data.copperProcessFee || 2000,
        fillerPrice: data.fillerPrice || 8000,
        pvcMaterialPriceEU: data.pvcMaterialPriceEU || 15000,
        pvcMaterialPriceUS: data.pvcMaterialPriceUS || 18000,
        rubberMaterialPriceEU: data.rubberMaterialPriceEU || 25000,
        rubberMaterialPriceUS: data.rubberMaterialPriceUS || 28000,
        xlpeMaterialPrice: data.xlpeMaterialPrice || 18000,
        xlpoMaterialPrice: data.xlpoMaterialPrice || 20000,
        tpeMaterialPrice: data.tpeMaterialPrice || 22000,
        epdmMaterialPrice: data.epdmMaterialPrice || 16000,
        siliconeMaterialPrice: data.siliconeMaterialPrice || 35000
      })
      Object.assign(profitForm, {
        profitMargin: data.profitMargin || 0.85,
        profitMarginPVC: data.profitMarginPVC || data.profitMargin || 0.85,
        profitMarginRubber: data.profitMarginRubber || data.profitMargin || 0.8,
        profitMarginXLPE: data.profitMarginXLPE || data.profitMargin || 0.78,
        profitMarginXLPO: data.profitMarginXLPO || data.profitMargin || 0.75,
        profitMarginTPE: data.profitMarginTPE || data.profitMargin || 0.76,
        profitMarginEPDM: data.profitMarginEPDM || data.profitMargin || 0.79,
        profitMarginSilicone: data.profitMarginSilicone || data.profitMargin || 0.72,
        profitMarginEV: data.profitMarginEV || data.profitMargin || 0.75
      })
    }
  } catch (error) {
    console.error('加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存基础设置
async function saveBasicSettings() {
  saving.value = true
  try {
    await settingsApi.update(basicForm)
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// 保存利润率设置
async function saveProfitSettings() {
  saving.value = true
  try {
    await settingsApi.update({
      profitMargin: profitForm.profitMargin,
      profitMarginPVC: profitForm.profitMarginPVC,
      profitMarginRubber: profitForm.profitMarginRubber,
      profitMarginXLPE: profitForm.profitMarginXLPE,
      profitMarginXLPO: profitForm.profitMarginXLPO,
      profitMarginTPE: profitForm.profitMarginTPE,
      profitMarginEPDM: profitForm.profitMarginEPDM,
      profitMarginSilicone: profitForm.profitMarginSilicone,
      profitMarginEV: profitForm.profitMarginEV
    })
    ElMessage.success('保存成功')
  } catch (error) {
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function formatProfitMargin(val) {
  return `成本占比：${(val * 100).toFixed(1)}% (毛利率：${((1 - val) * 100).toFixed(1)}%)`
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

// 用户管理函数

function openSalespersonAddDialog() {
  salespersonDialogTitle.value = '添加报价人'
  salespersonForm.id = null
  Object.assign(salespersonForm, {
    name: '',
    phone: '',
    email: '',
    department: '销售部',
    customerIds: []
  })
  salespersonDialogVisible.value = true
}

function openSalespersonEditDialog(row) {
  salespersonDialogTitle.value = '编辑报价人'
  salespersonForm.id = row.id
  Object.assign(salespersonForm, {
    name: row.name || '',
    phone: row.phone || '',
    email: row.email || '',
    department: row.department || '销售部',
    customerIds: row.customerIds || []
  })
  salespersonDialogVisible.value = true
}

function openUserDialog(row) {
  currentSalesperson.value = row
  userDialogTitle.value = row.user ? '修改登录账户' : '设置登录账户'
  Object.assign(userForm, {
    username: row.user?.username || '',
    password: '',
    role: row.user?.role || 'salesperson',
    status: row.user?.status || 'active'
  })
  userDialogVisible.value = true
}

async function handleSalespersonSubmit() {
  try {
    salespersonSubmitting.value = true
    if (salespersonForm.id) {
      await salespersonsApi.update(salespersonForm.id, salespersonForm)
      ElMessage.success('更新成功')
    } else {
      await salespersonsApi.create(salespersonForm)
      ElMessage.success('添加成功')
    }
    salespersonDialogVisible.value = false
    loadSalespersons()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    salespersonSubmitting.value = false
  }
}

async function handleUserSubmit() {
  try {
    userSubmitting.value = true
    if (!userForm.username) {
      ElMessage.error('请输入用户名')
      return
    }
    if (!currentSalesperson.value?.user && !userForm.password) {
      ElMessage.error('请输入密码')
      return
    }
    if (userForm.password && userForm.password.length < 6) {
      ElMessage.error('密码长度至少6位')
      return
    }

    if (currentSalesperson.value?.user) {
      await authApi.updateUser(currentSalesperson.value.user.id, {
        username: userForm.username,
        password: userForm.password || undefined,
        role: userForm.role,
        status: userForm.status
      })
      ElMessage.success('账户更新成功')
    } else {
      if (!currentSalesperson.value) {
        ElMessage.error('未选择报价人')
        return
      }
      const user = await authApi.createUser({
        username: userForm.username,
        password: userForm.password,
        name: currentSalesperson.value.name || '',
        email: currentSalesperson.value.email || '',
        role: userForm.role,
        status: userForm.status
      })
      await salespersonsApi.update(currentSalesperson.value.id, { userId: user.id })
      ElMessage.success('账户创建并关联成功')
    }
    userDialogVisible.value = false
    loadSalespersons()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    userSubmitting.value = false
  }
}

async function handleUnlinkUser() {
  try {
    if (!currentSalesperson.value) {
      ElMessage.error('未选择报价人')
      return
    }
    await ElMessageBox.confirm('确定取消该报价人的登录账户关联吗？账户本身不会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await salespersonsApi.update(currentSalesperson.value.id, { userId: null })
    ElMessage.success('取消关联成功')
    userDialogVisible.value = false
    loadSalespersons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

async function handleSalespersonDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除报价人 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await salespersonsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadSalespersons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleSalespersonBatchDelete() {
  if (selectedSalespersons.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedSalespersons.value.length} 个报价人吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const ids = selectedSalespersons.value.map(row => row.id)
    await salespersonsApi.batchDelete(ids)
    ElMessage.success('批量删除成功')
    selectedSalespersons.value = []
    loadSalespersons()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// 角色管理函数
async function loadRoles() {
  rolesLoading.value = true
  try {
    const [rolesResult, permissionsResult] = await Promise.all([
      rolesApi.getRoles(),
      rolesApi.getPermissions()
    ])
    roles.value = rolesResult.roles || []
    permissions.value = permissionsResult.permissions || []
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    rolesLoading.value = false
  }
}

function openRoleAddDialog() {
  roleDialogTitle.value = '添加角色'
  Object.assign(roleForm, {
    id: '',
    name: '',
    description: '',
    permissions: []
  })
  roleDialogVisible.value = true
}

function openRoleEditDialog(row) {
  roleDialogTitle.value = '编辑角色'
  Object.assign(roleForm, {
    id: row.id,
    name: row.name,
    description: row.description || '',
    permissions: [...(row.permissions || [])]
  })
  roleDialogVisible.value = true
}

async function handleRoleSubmit() {
  try {
    roleSubmitting.value = true
    if (!roleForm.id || !roleForm.name) {
      ElMessage.error('角色ID和名称为必填项')
      return
    }

    if (roleForm.id) {
      await rolesApi.updateRole(roleForm.id, {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
      })
      ElMessage.success('角色更新成功')
    } else {
      await rolesApi.createRole(roleForm)
      ElMessage.success('角色创建成功')
    }
    roleDialogVisible.value = false
    loadRoles()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    roleSubmitting.value = false
  }
}

async function handleRoleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除角色 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await rolesApi.deleteRole(row.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 用户管理函数
async function loadCustomers() {
  try {
    const result = await customersApi.list()
    customers.value = result.customers || result || []
  } catch (error) {
    console.error('加载客户列表失败:', error)
  }
}

async function loadUsers() {
  usersLoading.value = true
  try {
    let result = await authApi.getUsers()
    users.value = result.data || result || []
    
    if (userSearchKeyword.value) {
      const keyword = userSearchKeyword.value.toLowerCase()
      users.value = users.value.filter(item => 
        item.username?.toLowerCase().includes(keyword) ||
        item.name?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword)
      )
    }
    
    if (userRoleFilter.value) {
      users.value = users.value.filter(item => item.role === userRoleFilter.value)
    }
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    usersLoading.value = false
  }
}

function handleUserSelectionChange(rows) {
  selectedUsers.value = rows
}

function getRoleTagType(role) {
  const types = {
    admin: 'danger',
    salesperson: 'success',
    viewer: 'info'
  }
  return types[role] || 'default'
}

function getRoleName(role) {
  const names = {
    admin: '超级管理员',
    salesperson: '报价人',
    viewer: '查看员'
  }
  return names[role] || role
}

function openUserAddDialog() {
  systemUserDialogTitle.value = '添加用户'
  Object.assign(systemUserForm, {
    id: null,
    username: '',
    name: '',
    phone: '',
    email: '',
    department: '',
    password: '',
    role: 'salesperson',
    status: 'active',
    customerIds: []
  })
  systemUserDialogVisible.value = true
}

function openSystemUserEditDialog(row) {
  currentEditingUser.value = row
  systemUserDialogTitle.value = '编辑用户'
  Object.assign(systemUserForm, {
    id: row.id,
    username: row.username,
    name: row.name,
    phone: row.phone || '',
    email: row.email,
    department: row.department || '',
    password: '',
    role: row.role,
    status: row.status,
    customerIds: row.customerIds || []
  })
  systemUserDialogVisible.value = true
}

function openResetPasswordDialog(row) {
  currentEditingUser.value = row
  resetPasswordForm.newPassword = ''
  resetPasswordForm.confirmPassword = ''
  resetPasswordDialogVisible.value = true
}

async function handleSystemUserSubmit() {
  try {
    systemUserSubmitting.value = true
    if (!systemUserForm.username || !systemUserForm.name) {
      ElMessage.error('用户名和姓名为必填项')
      return
    }
    if (!systemUserForm.id && (!systemUserForm.password || systemUserForm.password.length < 6)) {
      ElMessage.error('新用户必须设置密码，且密码长度至少 6 位')
      return
    }

    if (systemUserForm.id) {
      await authApi.updateUser(systemUserForm.id, {
        name: systemUserForm.name,
        email: systemUserForm.email,
        phone: systemUserForm.phone,
        department: systemUserForm.department,
        role: systemUserForm.role,
        status: systemUserForm.status,
        customerIds: systemUserForm.customerIds
      })
      ElMessage.success('用户更新成功')
    } else {
      await authApi.createUser({
        username: systemUserForm.username,
        password: systemUserForm.password,
        name: systemUserForm.name,
        email: systemUserForm.email,
        phone: systemUserForm.phone,
        department: systemUserForm.department,
        role: systemUserForm.role,
        status: systemUserForm.status,
        customerIds: systemUserForm.customerIds
      })
      ElMessage.success('用户创建成功')
    }
    systemUserDialogVisible.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    systemUserSubmitting.value = false
  }
}

async function handleResetPassword() {
  try {
    resetPasswordSubmitting.value = true
    if (!resetPasswordForm.newPassword || resetPasswordForm.newPassword.length < 6) {
      ElMessage.error('新密码长度至少6位')
      return
    }
    if (resetPasswordForm.newPassword !== resetPasswordForm.confirmPassword) {
      ElMessage.error('两次输入的密码不一致')
      return
    }

    await authApi.resetPassword(currentEditingUser.value.id, resetPasswordForm.newPassword)
    ElMessage.success('密码重置成功')
    resetPasswordDialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    resetPasswordSubmitting.value = false
  }
}

async function handleSystemUserDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authApi.deleteUser(row.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleUserBatchDelete() {
  if (selectedUsers.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedUsers.value.length} 个用户吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    for (const user of selectedUsers.value) {
      await authApi.deleteUser(user.id)
    }
    ElMessage.success('批量删除成功')
    selectedUsers.value = []
    loadUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'salespersons') {
    loadSalespersons()
  } else if (newTab === 'roles') {
    loadRoles()
  } else if (newTab === 'users') {
    loadUsers()
    loadCustomers()
  }
})

onMounted(() => {
  loadSettings()
})
</script>

<style lang="scss" scoped>
.settings-page {
  .mb-4 {
    margin-bottom: 16px;
  }

  .salespersons-section, .roles-section, .users-section {
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
    .text-gray {
      color: #999;
    }
    .text-sm {
      font-size: 12px;
    }
    .mt-1 {
      margin-top: 4px;
    }
    .mt-4 {
      margin-top: 16px;
    }
    .ml-2 {
      margin-left: 8px;
    }
  }
}
</style>
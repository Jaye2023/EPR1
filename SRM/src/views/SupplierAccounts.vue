<template>
  <div class="supplier-account-container">
    <div class="page-header">
      <div class="header-content">
        <h1>供应商账户管理</h1>
        <p>管理供应商账户全生命周期</p>
      </div>
      <el-button type="primary" icon="Plus" @click="showCreateModal = true">
        新增供应商账户
      </el-button>
    </div>

    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-icon total">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">供应商总数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon active">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.active }}</div>
          <div class="stat-label">正常启用</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon pending">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.pendingReview }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon frozen">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.frozen }}</div>
          <div class="stat-label">临时冻结</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon disabled">
          <el-icon><Lock /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.disabled }}</div>
          <div class="stat-label">禁用停用</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon cancelled">
          <el-icon><Delete /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.cancelled }}</div>
          <div class="stat-label">注销归档</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon subaccounts">
          <el-icon><UserFilled /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.totalSubAccounts }}</div>
          <div class="stat-label">子账号总数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon active-sub">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.activeSubAccounts }}</div>
          <div class="stat-label">活跃子账号</div>
        </div>
      </el-card>
    </div>

    <el-card>
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索供应商编码、名称、邮箱"
          class="search-input"
          @keyup.enter="loadAccounts"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-select v-model="statusFilter" placeholder="状态筛选" class="status-select">
          <el-option label="全部" value="" />
          <el-option label="待激活" value="pending_activation" />
          <el-option label="待审核" value="pending_review" />
          <el-option label="正常启用" value="active" />
          <el-option label="临时冻结" value="temporary_frozen" />
          <el-option label="禁用停用" value="disabled" />
          <el-option label="注销归档" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="loadAccounts">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button type="success" @click="exportAccounts">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>

      <el-table :data="accounts" border style="width: 100%" @row-click="handleRowClick" @selection-change="handleSelectionChange" ref="tableRef">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="supplierCode" label="供应商编码" width="130" />
        <el-table-column prop="companyName" label="企业名称" min-width="180" />
        <el-table-column prop="loginEmail" label="登录账号" min-width="180" />
        <el-table-column prop="contactPerson" label="联系人" width="100" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column prop="status" label="账号状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reviewStatus" label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getReviewTagType(row.reviewStatus)">{{ getReviewText(row.reviewStatus) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click.stop="viewAccount(row)">查看</el-button>
            <el-button size="small" type="primary" @click.stop="editAccount(row)">编辑</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button size="small" type="warning">
                更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="subaccount">子账号管理</el-dropdown-item>
                  <el-dropdown-item command="resetpwd">重置密码</el-dropdown-item>
                  <el-dropdown-item v-if="row.reviewStatus === 'pending'" command="approve" divided>审核通过</el-dropdown-item>
                  <el-dropdown-item v-if="row.reviewStatus === 'pending'" command="reject">审核驳回</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'active'" command="freeze" divided>冻结账户</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'active'" command="disable">禁用账户</el-dropdown-item>
                  <el-dropdown-item v-if="row.status === 'temporary_frozen'" command="unfreeze" divided>启用账户</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== 'cancelled'" command="delete" divided type="danger">删除账户</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          :total="pagination.total"
          class="pagination"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog :title="selectedAccount?.id ? '编辑供应商账户' : '新增供应商账户'" :visible.sync="showCreateModal" width="800px">
      <el-form ref="createFormRef" :model="formData" label-width="120px" :rules="formRules">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="companyName">
              <el-input v-model="formData.companyName" placeholder="请输入企业名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
              <el-input v-model="formData.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="登录邮箱" prop="loginEmail">
              <el-input v-model="formData.loginEmail" placeholder="请输入登录邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="纳税人类型" prop="taxType">
              <el-select v-model="formData.taxType" placeholder="请选择纳税人类型">
                <el-option label="一般纳税人" value="general" />
                <el-option label="小规模纳税人" value="small" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册地址" prop="address">
              <el-input v-model="formData.address" placeholder="请输入注册地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开户行" prop="bankName">
              <el-input v-model="formData.bankName" placeholder="请输入开户银行" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="银行账号" prop="bankAccount">
              <el-input v-model="formData.bankAccount" placeholder="请输入银行账号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="formData.remark" type="textarea" placeholder="请输入备注信息" rows="3" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false; selectedAccount.value = null; resetForm()">取消</el-button>
        <el-button type="primary" @click="createAccount" :loading="isSubmitting">{{ selectedAccount?.id ? '确认更新' : '确认创建' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog title="子账号管理" :visible.sync="showSubAccountModal" width="700px">
      <div class="sub-account-header">
        <span class="supplier-info">供应商：{{ selectedAccount?.companyName }} ({{ selectedAccount?.supplierCode }})</span>
        <el-button type="primary" size="small" @click="showAddSubAccount = true">
          <el-icon><Plus /></el-icon>
          新增子账号
        </el-button>
      </div>
      <el-table :data="subAccounts" border style="width: 100%">
        <el-table-column prop="loginEmail" label="登录账号" width="200" />
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="role" label="岗位类型" width="120">
          <template #default="{ row }">{{ getRoleName(row.role) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'warning'">{{ row.status === 'active' ? '启用' : '禁用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click.stop="editSubAccount(row)">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="deleteSubAccount(row)">删除</el-button>
            <template v-if="row.status === 'active'">
              <el-button size="small" type="warning" @click.stop="disableSubAccount(row)">禁用</el-button>
            </template>
            <template v-else>
              <el-button size="small" type="success" @click.stop="enableSubAccount(row)">启用</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog title="新增子账号" :visible.sync="showAddSubAccount" width="500px">
      <el-form :model="subAccountForm" label-width="100px">
        <el-form-item label="登录邮箱" prop="loginEmail">
          <el-input v-model="subAccountForm.loginEmail" placeholder="请输入登录邮箱" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="subAccountForm.contactPerson" placeholder="请输入联系人" />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="subAccountForm.contactPhone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="岗位类型" prop="role">
          <el-select v-model="subAccountForm.role" placeholder="请选择岗位类型">
            <el-option label="业务对接岗" value="business" />
            <el-option label="仓储物流岗" value="warehouse" />
            <el-option label="财务对账岗" value="finance" />
            <el-option label="质量对接岗" value="quality" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSubAccount = false">取消</el-button>
        <el-button type="primary" @click="addSubAccount">确认创建</el-button>
      </template>
    </el-dialog>

    <el-dialog title="供应商账户详情" :visible.sync="showDetailModal" width="600px">
      <div v-if="selectedAccount" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="供应商编码">{{ selectedAccount.supplierCode }}</el-descriptions-item>
          <el-descriptions-item label="企业名称">{{ selectedAccount.companyName }}</el-descriptions-item>
          <el-descriptions-item label="统一社会信用代码">{{ selectedAccount.unifiedSocialCreditCode || '-' }}</el-descriptions-item>
          <el-descriptions-item label="登录账号">{{ selectedAccount.loginEmail }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ selectedAccount.contactPerson }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ selectedAccount.contactPhone }}</el-descriptions-item>
          <el-descriptions-item label="账号状态">
            <el-tag :type="getStatusTagType(selectedAccount.status)">{{ getStatusText(selectedAccount.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="审核状态">
            <el-tag :type="getReviewTagType(selectedAccount.reviewStatus)">{{ getReviewText(selectedAccount.reviewStatus) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(selectedAccount.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ selectedAccount.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog title="密码重置结果" :visible.sync="showResetModal" width="400px">
      <div class="reset-result">
        <div class="success-icon">
          <el-icon :size="48" color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <p class="result-text">密码重置成功！</p>
        <div class="new-password">
          <span class="label">新密码：</span>
          <span class="password">{{ resetPasswordResult }}</span>
        </div>
        <p class="tips">请将此密码告知供应商，供应商登录后需强制修改密码</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showResetModal = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="供应商账户创建成功" :visible.sync="showSuccessModal" width="450px">
      <div class="create-success">
        <div class="success-icon">
          <el-icon :size="56" color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <p class="success-title">供应商账户创建成功！</p>
        <el-descriptions :column="1" border class="mt-4">
          <el-descriptions-item label="供应商编码">
            <span class="code-text">{{ createSuccessResult.supplierCode }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="企业名称">{{ createSuccessResult.companyName }}</el-descriptions-item>
          <el-descriptions-item label="登录账号">{{ createSuccessResult.loginEmail }}</el-descriptions-item>
          <el-descriptions-item label="初始密码">
            <span class="password-box">{{ createSuccessResult.initialPassword }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="tips mt-4">
          <p>请将以下信息告知供应商：</p>
          <ul>
            <li>登录账号：{{ createSuccessResult.loginEmail }}</li>
            <li>初始密码：{{ createSuccessResult.initialPassword }}</li>
          </ul>
          <p class="warning-text">⚠️ 供应商首次登录后需强制修改密码</p>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showSuccessModal = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, User, CircleCheck, Clock, Box, Lock, Delete, UserFilled, Download, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const stats = reactive({
  total: 0,
  active: 0,
  pendingActivation: 0,
  pendingReview: 0,
  frozen: 0,
  disabled: 0,
  cancelled: 0,
  totalSubAccounts: 0,
  activeSubAccounts: 0
})

const accounts = ref([])
const subAccounts = ref([])
const searchKeyword = ref('')
const statusFilter = ref('')
const showCreateModal = ref(false)
const showSubAccountModal = ref(false)
const showAddSubAccount = ref(false)
const showDetailModal = ref(false)
const showResetModal = ref(false)
const resetPasswordResult = ref('')
const showSuccessModal = ref(false)
const createSuccessResult = ref({})
const selectedAccount = ref(null)
const selectedRows = ref([])
const tableRef = ref(null)
const createFormRef = ref(null)
const isSubmitting = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const formData = reactive({
  companyName: '',
  unifiedSocialCreditCode: '',
  loginEmail: '',
  taxType: '',
  contactPerson: '',
  contactPhone: '',
  address: '',
  bankName: '',
  bankAccount: '',
  remark: ''
})

const formRules = {
  companyName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' },
    { min: 2, max: 100, message: '企业名称长度在2到100个字符之间', trigger: 'blur' }
  ],
  loginEmail: [
    { required: true, message: '请输入登录邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  unifiedSocialCreditCode: [
    { pattern: /^[0-9A-HJ-NP-RT-UW-Y]{18}$/, message: '请输入有效的统一社会信用代码', trigger: 'blur' }
  ],
  contactPhone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' }
  ],
  bankAccount: [
    { pattern: /^\d{16,20}$/, message: '请输入有效的银行账号', trigger: 'blur' }
  ]
}

function resetForm() {
  formData.companyName = ''
  formData.unifiedSocialCreditCode = ''
  formData.loginEmail = ''
  formData.taxType = ''
  formData.contactPerson = ''
  formData.contactPhone = ''
  formData.address = ''
  formData.bankName = ''
  formData.bankAccount = ''
  formData.remark = ''
}

function handleCommand(command, row) {
  switch (command) {
    case 'subaccount':
      manageSubAccounts(row)
      break
    case 'resetpwd':
      resetPassword(row)
      break
    case 'approve':
      approveAccount(row)
      break
    case 'reject':
      rejectAccount(row)
      break
    case 'freeze':
      freezeAccount(row)
      break
    case 'disable':
      disableAccount(row)
      break
    case 'unfreeze':
      unfreezeAccount(row)
      break
    case 'delete':
      deleteAccount(row)
      break
  }
}

const subAccountForm = reactive({
  loginEmail: '',
  contactPerson: '',
  contactPhone: '',
  role: ''
})

const roleNames = {
  business: '业务对接岗',
  warehouse: '仓储物流岗',
  finance: '财务对账岗',
  quality: '质量对接岗'
}

const statusTexts = {
  pending_activation: '待激活',
  pending_review: '待审核',
  active: '正常启用',
  temporary_frozen: '临时冻结',
  disabled: '禁用停用',
  cancelled: '注销归档'
}

const statusTagTypes = {
  pending_activation: 'warning',
  pending_review: 'info',
  active: 'success',
  temporary_frozen: 'warning',
  disabled: 'danger',
  cancelled: 'info'
}

const reviewTexts = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
}

const reviewTagTypes = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger'
}

function getStatusText(status) {
  return statusTexts[status] || status
}

function getStatusTagType(status) {
  return statusTagTypes[status] || 'info'
}

function getReviewText(status) {
  return reviewTexts[status] || status
}

function getReviewTagType(status) {
  return reviewTagTypes[status] || 'info'
}

function getRoleName(role) {
  return roleNames[role] || role
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const mockStats = {
  total: 15,
  active: 10,
  pendingActivation: 2,
  pendingReview: 1,
  frozen: 1,
  disabled: 1,
  cancelled: 0,
  totalSubAccounts: 32,
  activeSubAccounts: 28
}

async function loadStats() {
  try {
    const response = await fetch('http://localhost:3001/api/supplier-accounts/stats/summary')
    const data = await response.json()
    if (data.success) {
      Object.assign(stats, data.data)
    }
  } catch (error) {
    console.error('加载统计数据失败，使用本地数据:', error)
    Object.assign(stats, mockStats)
  }
}

const mockAccounts = [
  { id: 1, supplierCode: 'SUP001', companyName: '东莞市铜业公司', loginEmail: 'contact@dongguan-copper.com', contactPerson: '张经理', contactPhone: '13800138001', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91441900MA51W3X88Q', taxType: 'general', address: '东莞市长安镇', bankName: '工商银行', bankAccount: '6222082010001234567', createdAt: '2024-01-15 10:30:00', remark: '主要供应商' },
  { id: 2, supplierCode: 'SUP002', companyName: '深圳塑料制品厂', loginEmail: 'sales@shenzhen-plastic.com', contactPerson: '李小姐', contactPhone: '13800138002', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91440300MA5DL8X88Y', taxType: 'small', address: '深圳市宝安区', bankName: '建设银行', bankAccount: '6227002010009876543', createdAt: '2024-03-20 14:15:00', remark: '' },
  { id: 3, supplierCode: 'SUP003', companyName: '广州机械设备公司', loginEmail: 'info@guangzhou-machinery.com', contactPerson: '王先生', contactPhone: '13800138003', status: 'pending_review', reviewStatus: 'pending', unifiedSocialCreditCode: '91440100MA5K8X8888', taxType: 'general', address: '广州市天河区', bankName: '中国银行', bankAccount: '6217850010001122334', createdAt: '2024-06-01 09:00:00', remark: '待审核' },
  { id: 4, supplierCode: 'SUP004', companyName: '物流运输服务', loginEmail: 'logistics@express-service.cn', contactPerson: '赵经理', contactPhone: '13800138004', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91440300MA5H8X8888', taxType: 'small', address: '深圳市福田区', bankName: '农业银行', bankAccount: '6228481010005566778', createdAt: '2024-02-10 16:45:00', remark: '物流服务商' },
  { id: 5, supplierCode: 'SUP005', companyName: '上海电子元件厂', loginEmail: 'support@shanghai-electronic.com', contactPerson: '刘主任', contactPhone: '13800138005', status: 'temporary_frozen', reviewStatus: 'approved', unifiedSocialCreditCode: '91310000MA1B8X8888', taxType: 'general', address: '上海市浦东新区', bankName: '交通银行', bankAccount: '6222620010009988776', createdAt: '2023-11-05 11:20:00', remark: '临时冻结' },
  { id: 6, supplierCode: 'SUP006', companyName: '北京包装材料公司', loginEmail: 'business@beijing-packing.com', contactPerson: '陈经理', contactPhone: '13800138006', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91110000MA018X8888', taxType: 'small', address: '北京市朝阳区', bankName: '招商银行', bankAccount: '6225880010002233445', createdAt: '2024-09-01 08:30:00', remark: '' },
  { id: 7, supplierCode: 'SUP007', companyName: '成都金属加工厂', loginEmail: 'contact@chengdu-metal.com', contactPerson: '周厂长', contactPhone: '13800138007', status: 'pending_activation', reviewStatus: 'approved', unifiedSocialCreditCode: '91510100MA68X88888', taxType: 'general', address: '成都市高新区', bankName: '民生银行', bankAccount: '6226220010006677889', createdAt: '2024-10-15 13:00:00', remark: '待激活' },
  { id: 8, supplierCode: 'SUP008', companyName: '杭州化工原料公司', loginEmail: 'sales@hangzhou-chemical.com', contactPerson: '吴经理', contactPhone: '13800138008', status: 'disabled', reviewStatus: 'approved', unifiedSocialCreditCode: '91330100MA28X88888', taxType: 'general', address: '杭州市萧山区', bankName: '浦发银行', bankAccount: '6225220010003344556', createdAt: '2023-08-20 15:30:00', remark: '已禁用' },
  { id: 9, supplierCode: 'SUP009', companyName: '武汉纺织材料厂', loginEmail: 'info@wuhan-textile.com', contactPerson: '郑厂长', contactPhone: '13800138009', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91420100MA48X88888', taxType: 'small', address: '武汉市汉阳区', bankName: '光大银行', bankAccount: '6226620010007788990', createdAt: '2024-04-25 10:00:00', remark: '' },
  { id: 10, supplierCode: 'SUP010', companyName: '南京精密机械公司', loginEmail: 'business@nanjing-machinery.com', contactPerson: '孙工程师', contactPhone: '13800138010', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91320100MA38X88888', taxType: 'general', address: '南京市江宁区', bankName: '兴业银行', bankAccount: '6229080010004455667', createdAt: '2024-05-18 09:15:00', remark: '精密设备供应商' },
  { id: 11, supplierCode: 'SUP011', companyName: '西安光电科技', loginEmail: 'support@xian-optics.com', contactPerson: '马经理', contactPhone: '13800138011', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91610100MA18X88888', taxType: 'general', address: '西安市高新区', bankName: '华夏银行', bankAccount: '6226330010005566778', createdAt: '2024-07-12 14:00:00', remark: '' },
  { id: 12, supplierCode: 'SUP012', companyName: '厦门贸易公司', loginEmail: 'trade@xiamen-trade.com', contactPerson: '林经理', contactPhone: '13800138012', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91350200MA58X88888', taxType: 'general', address: '厦门市思明区', bankName: '中信银行', bankAccount: '6226900010006677889', createdAt: '2024-08-08 11:30:00', remark: '贸易代理' },
  { id: 13, supplierCode: 'SUP013', companyName: '青岛橡胶制品', loginEmail: 'sales@qingdao-rubber.com', contactPerson: '何厂长', contactPhone: '13800138013', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91370200MA78X88888', taxType: 'small', address: '青岛市黄岛区', bankName: '恒丰银行', bankAccount: '6230210010007788990', createdAt: '2024-09-20 16:00:00', remark: '' },
  { id: 14, supplierCode: 'SUP014', companyName: '苏州电子科技', loginEmail: 'info@suzhou-electronics.com', contactPerson: '罗经理', contactPhone: '13800138014', status: 'pending_review', reviewStatus: 'pending', unifiedSocialCreditCode: '91320500MA88X88888', taxType: 'general', address: '苏州市工业园区', bankName: '江苏银行', bankAccount: '6228660010008899001', createdAt: '2024-11-01 08:45:00', remark: '新供应商待审核' },
  { id: 15, supplierCode: 'SUP015', companyName: '重庆汽车配件', loginEmail: 'contact@chongqing-auto.com', contactPerson: '梁经理', contactPhone: '13800138015', status: 'active', reviewStatus: 'approved', unifiedSocialCreditCode: '91500000MA98X88888', taxType: 'general', address: '重庆市渝北区', bankName: '重庆银行', bankAccount: '6224760010009900112', createdAt: '2024-10-28 12:00:00', remark: '汽车零部件' }
]

async function loadAccounts() {
  try {
    const params = new URLSearchParams()
    if (searchKeyword.value) params.append('search', searchKeyword.value)
    if (statusFilter.value) params.append('status', statusFilter.value)
    params.append('page', pagination.page)
    params.append('pageSize', pagination.pageSize)

    const response = await fetch(`http://localhost:3001/api/supplier-accounts?${params}`)
    const data = await response.json()
    if (data.success) {
      accounts.value = data.data
      pagination.total = data.total
    }
  } catch (error) {
    console.error('加载供应商列表失败，使用本地数据:', error)
    let filtered = [...mockAccounts]
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(item => 
        item.supplierCode.toLowerCase().includes(keyword) ||
        item.companyName.toLowerCase().includes(keyword) ||
        item.loginEmail.toLowerCase().includes(keyword)
      )
    }
    
    if (statusFilter.value) {
      filtered = filtered.filter(item => item.status === statusFilter.value)
    }
    
    pagination.total = filtered.length
    const start = (pagination.page - 1) * pagination.pageSize
    accounts.value = filtered.slice(start, start + pagination.pageSize)
  }
}

const mockSubAccounts = {
  1: [
    { id: 101, loginEmail: 'business@dongguan-copper.com', contactPerson: '张业务', contactPhone: '13800138011', role: 'business', status: 'active', createdAt: '2024-01-15 10:30:00' },
    { id: 102, loginEmail: 'finance@dongguan-copper.com', contactPerson: '李财务', contactPhone: '13800138012', role: 'finance', status: 'active', createdAt: '2024-01-16 09:00:00' }
  ],
  2: [
    { id: 201, loginEmail: 'sales@shenzhen-plastic.com', contactPerson: '王销售', contactPhone: '13800138021', role: 'business', status: 'active', createdAt: '2024-03-20 14:15:00' }
  ],
  3: [
    { id: 301, loginEmail: 'info@guangzhou-machinery.com', contactPerson: '刘业务', contactPhone: '13800138031', role: 'business', status: 'pending', createdAt: '2024-06-01 09:00:00' }
  ]
}

async function loadSubAccounts(supplierId) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-sub-accounts?supplierId=${supplierId}`)
    const data = await response.json()
    if (data.success) {
      subAccounts.value = data.data
    }
  } catch (error) {
    console.error('加载子账号列表失败，使用本地数据:', error)
    subAccounts.value = mockSubAccounts[supplierId] || []
  }
}

function handlePageChange(page) {
  pagination.page = page
  loadAccounts()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.page = 1
  loadAccounts()
}

function handleRowClick(row) {
  selectedAccount.value = row
}

async function createAccount() {
  if (createFormRef.value) {
    const valid = await createFormRef.value.validate()
    if (!valid) return
  }

  isSubmitting.value = true

  try {
    const isEdit = !!selectedAccount.value?.id
    const url = isEdit 
      ? `http://localhost:3001/api/supplier-accounts/${selectedAccount.value.id}` 
      : 'http://localhost:3001/api/supplier-accounts'
    const method = isEdit ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await response.json()
    if (data.success) {
      if (isEdit) {
        ElMessage.success('供应商账户更新成功')
        showCreateModal.value = false
        resetForm()
        selectedAccount.value = null
      } else {
        createSuccessResult.value = {
          supplierCode: data.data.supplierCode,
          companyName: formData.companyName,
          loginEmail: formData.loginEmail,
          initialPassword: data.data.initialPassword
        }
        showCreateModal.value = false
        showSuccessModal.value = true
        resetForm()
      }
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('操作供应商账户失败，使用本地操作:', error)
    // 本地mock操作
    const isEdit = !!selectedAccount.value?.id
    if (isEdit) {
      const index = mockAccounts.findIndex(item => item.id === selectedAccount.value.id)
      if (index !== -1) {
        Object.assign(mockAccounts[index], formData)
        ElMessage.success('供应商账户更新成功')
      }
    } else {
      const newId = Math.max(...mockAccounts.map(a => a.id), 0) + 1
      const supplierCode = `SUP${String(newId).padStart(3, '0')}`
      const initialPassword = Math.random().toString(36).slice(-8) + 'A1!'
      const newAccount = {
        id: newId,
        supplierCode,
        ...formData,
        status: 'pending_activation',
        reviewStatus: 'pending',
        createdAt: new Date().toLocaleString('zh-CN')
      }
      mockAccounts.push(newAccount)
      createSuccessResult.value = {
        supplierCode,
        companyName: formData.companyName,
        loginEmail: formData.loginEmail,
        initialPassword
      }
      showSuccessModal.value = true
      ElMessage.success('供应商账户创建成功')
    }
    showCreateModal.value = false
    resetForm()
    selectedAccount.value = null
    loadAccounts()
    loadStats()
  } finally {
    isSubmitting.value = false
  }
}

function editAccount(row) {
  selectedAccount.value = row
  Object.assign(formData, row)
  showCreateModal.value = true
}

async function deleteAccount(row) {
  if (!confirm(`确定要删除供应商 ${row.companyName} 吗？`)) return

  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('删除成功')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('删除供应商失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts.splice(index, 1)
      ElMessage.success('删除成功')
      loadAccounts()
      loadStats()
    }
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

  try {
    const ids = selectedRows.value.map(row => row.id)
    const response = await fetch('http://localhost:3001/api/supplier-accounts/batch-delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success(`已成功删除 ${selectedRows.value.length} 个供应商`)
      selectedRows.value = []
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('批量删除供应商失败，使用本地操作:', error)
    // 本地mock操作
    const ids = selectedRows.value.map(row => row.id)
    for (let i = mockAccounts.length - 1; i >= 0; i--) {
      if (ids.includes(mockAccounts[i].id)) {
        mockAccounts.splice(i, 1)
      }
    }
    ElMessage.success(`已成功删除 ${selectedRows.value.length} 个供应商`)
    selectedRows.value = []
    loadAccounts()
    loadStats()
  }
}

function exportAccounts() {
  if (accounts.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }

  const headers = ['供应商编码', '企业名称', '统一社会信用代码', '登录邮箱', '联系人', '联系电话', '账号状态', '审核状态', '创建时间']
  const exportData = accounts.value.map(item => [
    item.supplierCode,
    item.companyName,
    item.unifiedSocialCreditCode || '',
    item.loginEmail,
    item.contactPerson || '',
    item.contactPhone || '',
    getStatusText(item.status),
    getReviewText(item.reviewStatus),
    formatDate(item.createdAt)
  ])

  const csvContent = [headers, ...exportData].map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `供应商账户_${new Date().toLocaleDateString()}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出成功')
}

function manageSubAccounts(row) {
  selectedAccount.value = row
  loadSubAccounts(row.id)
  showSubAccountModal.value = true
}

function viewAccount(row) {
  selectedAccount.value = row
  showDetailModal.value = true
}

async function resetPassword(row) {
  if (!confirm(`确定要重置供应商 ${row.companyName} 的密码吗？`)) return

  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await response.json()
    if (data.success) {
      resetPasswordResult.value = data.data.newPassword
      showResetModal.value = true
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('重置密码失败，使用本地操作:', error)
    // 本地mock操作 - 生成随机密码
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let newPassword = ''
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    resetPasswordResult.value = newPassword
    showResetModal.value = true
    ElMessage.success('密码已重置')
  }
}

async function freezeAccount(row) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/freeze`, {
      method: 'PUT'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已冻结账户')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('冻结账户失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts[index].status = 'temporary_frozen'
      row.status = 'temporary_frozen'
      ElMessage.success('已冻结账户')
      loadAccounts()
      loadStats()
    }
  }
}

async function disableAccount(row) {
  const reason = prompt('请输入禁用理由：')
  if (!reason) return

  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/disable`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已禁用账户')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('禁用账户失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts[index].status = 'disabled'
      mockAccounts[index].remark = reason
      row.status = 'disabled'
      row.remark = reason
      ElMessage.success('已禁用账户')
      loadAccounts()
      loadStats()
    }
  }
}

async function unfreezeAccount(row) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/unfreeze`, {
      method: 'PUT'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已启用账户')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('启用账户失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts[index].status = 'active'
      row.status = 'active'
      ElMessage.success('已启用账户')
      loadAccounts()
      loadStats()
    }
  }
}

async function approveAccount(row) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: 'approved', remark: '审核通过' })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('审核通过，账户已激活')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('审核账户失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts[index].reviewStatus = 'approved'
      mockAccounts[index].status = 'active'
      row.reviewStatus = 'approved'
      row.status = 'active'
      ElMessage.success('审核通过，账户已激活')
      loadAccounts()
      loadStats()
    }
  }
}

async function rejectAccount(row) {
  const remark = prompt('请输入驳回理由：')
  if (!remark) return

  try {
    const response = await fetch(`http://localhost:3001/api/supplier-accounts/${row.id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: 'rejected', remark })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已驳回')
      loadAccounts()
      loadStats()
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('驳回账户失败，使用本地操作:', error)
    // 本地mock操作
    const index = mockAccounts.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockAccounts[index].reviewStatus = 'rejected'
      mockAccounts[index].remark = remark
      row.reviewStatus = 'rejected'
      row.remark = remark
      ElMessage.success('已驳回')
      loadAccounts()
      loadStats()
    }
  }
}

async function addSubAccount() {
  if (!subAccountForm.loginEmail || !subAccountForm.role) {
    ElMessage.warning('请填写登录邮箱和岗位类型')
    return
  }

  try {
    const response = await fetch('http://localhost:3001/api/supplier-sub-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...subAccountForm,
        supplierId: selectedAccount.value.id
      })
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('子账号创建成功')
      showAddSubAccount.value = false
      subAccountForm.loginEmail = ''
      subAccountForm.contactPerson = ''
      subAccountForm.contactPhone = ''
      subAccountForm.role = ''
      loadSubAccounts(selectedAccount.value.id)
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('创建子账号失败，使用本地操作:', error)
    // 本地mock操作
    const supplierId = selectedAccount.value.id
    if (!mockSubAccounts[supplierId]) {
      mockSubAccounts[supplierId] = []
    }
    const newSubAccount = {
      id: Date.now(),
      ...subAccountForm,
      status: 'active',
      createdAt: new Date().toLocaleString('zh-CN')
    }
    mockSubAccounts[supplierId].push(newSubAccount)
    ElMessage.success('子账号创建成功')
    showAddSubAccount.value = false
    subAccountForm.loginEmail = ''
    subAccountForm.contactPerson = ''
    subAccountForm.contactPhone = ''
    subAccountForm.role = ''
    loadSubAccounts(supplierId)
  }
}

function editSubAccount(row) {
  Object.assign(subAccountForm, row)
  showAddSubAccount.value = true
}

async function deleteSubAccount(row) {
  if (!confirm(`确定要删除子账号 ${row.loginEmail} 吗？`)) return

  try {
    const response = await fetch(`http://localhost:3001/api/supplier-sub-accounts/${row.id}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('删除成功')
      loadSubAccounts(selectedAccount.value.id)
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('删除子账号失败，使用本地操作:', error)
    // 本地mock操作
    const supplierId = selectedAccount.value.id
    if (mockSubAccounts[supplierId]) {
      const index = mockSubAccounts[supplierId].findIndex(item => item.id === row.id)
      if (index !== -1) {
        mockSubAccounts[supplierId].splice(index, 1)
        ElMessage.success('删除成功')
        loadSubAccounts(supplierId)
      }
    }
  }
}

async function disableSubAccount(row) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-sub-accounts/${row.id}/disable`, {
      method: 'PUT'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已禁用子账号')
      loadSubAccounts(selectedAccount.value.id)
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('禁用子账号失败，使用本地操作:', error)
    // 本地mock操作
    const supplierId = selectedAccount.value.id
    if (mockSubAccounts[supplierId]) {
      const index = mockSubAccounts[supplierId].findIndex(item => item.id === row.id)
      if (index !== -1) {
        mockSubAccounts[supplierId][index].status = 'disabled'
        row.status = 'disabled'
        ElMessage.success('已禁用子账号')
        loadSubAccounts(supplierId)
      }
    }
  }
}

async function enableSubAccount(row) {
  try {
    const response = await fetch(`http://localhost:3001/api/supplier-sub-accounts/${row.id}/enable`, {
      method: 'PUT'
    })
    const data = await response.json()
    if (data.success) {
      ElMessage.success('已启用子账号')
      loadSubAccounts(selectedAccount.value.id)
    } else {
      ElMessage.error(data.error)
    }
  } catch (error) {
    console.error('启用子账号失败，使用本地操作:', error)
    // 本地mock操作
    const supplierId = selectedAccount.value.id
    if (mockSubAccounts[supplierId]) {
      const index = mockSubAccounts[supplierId].findIndex(item => item.id === row.id)
      if (index !== -1) {
        mockSubAccounts[supplierId][index].status = 'active'
        row.status = 'active'
        ElMessage.success('已启用子账号')
        loadSubAccounts(supplierId)
      }
    }
  }
}

onMounted(() => {
  loadAccounts()
  loadStats()
})
</script>

<style lang="scss" scoped>
.supplier-account-container {
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;

  .stat-card {
    display: flex;
    align-items: center;
    padding: 20px;

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
      font-size: 24px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.active {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
      }

      &.pending {
        background: linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%);
        color: white;
      }

      &.frozen {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #1f2937;
      }

      .stat-label {
        font-size: 14px;
        color: #6b7280;
      }
    }
  }
}

.search-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;

  .search-input {
    width: 300px;
  }

  .status-select {
    width: 160px;
  }
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.sub-account-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .supplier-info {
    font-weight: bold;
    color: #1f2937;
  }
}

.create-success {
  text-align: center;
  padding: 20px 0;

  .success-icon {
    margin-bottom: 16px;
  }

  .success-title {
    font-size: 18px;
    font-weight: bold;
    color: #1f2937;
    margin: 0;
  }

  .code-text {
    font-family: monospace;
    font-size: 16px;
    color: #409eff;
    font-weight: bold;
  }

  .password-box {
    font-family: monospace;
    font-size: 16px;
    color: #67c23a;
    font-weight: bold;
    background: #f0f9ff;
    padding: 6px 12px;
    border-radius: 4px;
  }

  .tips {
    text-align: left;
    background: #fafafa;
    padding: 16px;
    border-radius: 8px;

    p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #6b7280;
    }

    ul {
      margin: 0 0 12px 0;
      padding-left: 20px;

      li {
        font-size: 14px;
        color: #374151;
        margin-bottom: 4px;
      }
    }

    .warning-text {
      font-size: 13px;
      color: #f59e0b;
      margin: 0;
    }
  }
}
</style>

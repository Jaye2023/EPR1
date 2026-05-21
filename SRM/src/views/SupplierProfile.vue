<template>
  <div class="profile-container">
    <div class="page-header">
      <h1>个人中心</h1>
      <p>管理您的账户信息</p>
    </div>

    <div class="tabs-container">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="基本信息" name="basic">
          <el-card class="profile-card">
            <div class="profile-header">
              <div class="avatar-wrapper">
                <el-avatar :size="100" icon="User" />
              </div>
              <div class="profile-info">
                <h2>{{ userInfo.companyName }}</h2>
                <p class="supplier-code">供应商编码：{{ userInfo.supplierCode }}</p>
                <p class="account-type">{{ isMainAccount ? '主管理员账号' : '子账号' }}</p>
              </div>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>登录邮箱</label>
                <span>{{ userInfo.loginEmail }}</span>
              </div>
              <div class="info-item">
                <label>联系人</label>
                <span>{{ userInfo.contactPerson }}</span>
              </div>
              <div class="info-item">
                <label>联系电话</label>
                <span>{{ userInfo.contactPhone }}</span>
              </div>
              <div class="info-item">
                <label>账户状态</label>
                <el-tag :type="getStatusType(userInfo.status)">{{ getStatusText(userInfo.status) }}</el-tag>
              </div>
              <div class="info-item">
                <label>注册时间</label>
                <span>{{ formatDate(userInfo.createdAt) }}</span>
              </div>
              <div class="info-item">
                <label>最后登录</label>
                <span>{{ formatDate(userInfo.lastLoginAt) }}</span>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="企业信息" name="company">
          <el-card class="profile-card">
            <el-form :model="companyForm" label-width="140px">
              <el-form-item label="企业名称" prop="companyName">
                <el-input v-model="companyForm.companyName" :disabled="!canEditCompanyInfo" />
              </el-form-item>
              <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
                <el-input v-model="companyForm.unifiedSocialCreditCode" :disabled="!canEditCompanyInfo" />
              </el-form-item>
              <el-form-item label="注册地址" prop="registeredAddress">
                <el-input v-model="companyForm.registeredAddress" :disabled="!canEditCompanyInfo" />
              </el-form-item>
              <el-form-item label="银行名称" prop="bankName">
                <el-input v-model="companyForm.bankName" />
              </el-form-item>
              <el-form-item label="银行账户" prop="bankAccount">
                <el-input v-model="companyForm.bankAccount" />
              </el-form-item>
              <el-form-item label="税务登记号" prop="taxIdentificationNumber">
                <el-input v-model="companyForm.taxIdentificationNumber" />
              </el-form-item>
              <el-form-item label="营业执照" prop="businessLicenseUrl">
                <el-upload
                  class="upload-demo"
                  action="#"
                  :show-file-list="false"
                  :disabled="!canEditCompanyInfo"
                >
                  <el-button size="small" type="primary">上传营业执照</el-button>
                </el-upload>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveCompanyInfo" :disabled="!canEditCompanyInfo">
                  保存信息
                </el-button>
                <span v-if="!canEditCompanyInfo" class="edit-hint">企业名称、信用代码等核心信息修改需审核</span>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="修改密码" name="password">
          <el-card class="profile-card">
            <el-form :model="passwordForm" label-width="140px" :rules="passwordRules" ref="passwordFormRef">
              <el-form-item label="原密码" prop="oldPassword">
                <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" />
              </el-form-item>
              <el-form-item label="新密码" prop="newPassword">
                <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（8位以上，含数字和字母）" />
              </el-form-item>
              <el-form-item label="确认新密码" prop="confirmPassword">
                <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="changePassword" :loading="passwordLoading">
                  修改密码
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="子账号管理" name="subaccounts" v-if="isMainAccount">
          <el-card class="profile-card">
            <div class="subaccount-header">
              <span>管理您的子账号</span>
              <el-button type="primary" size="small" @click="showAddSubAccount = true">
                <el-icon><Plus /></el-icon>
                新增子账号
              </el-button>
            </div>
            <el-table :data="subAccounts" border style="width: 100%">
              <el-table-column prop="loginEmail" label="登录账号" width="200" />
              <el-table-column prop="name" label="联系人" width="120" />
              <el-table-column prop="phone" label="联系电话" width="130" />
              <el-table-column prop="accountType" label="岗位类型" width="120">
                <template #default="{ row }">{{ getRoleName(row.accountType) }}</template>
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
                  <el-button size="small" @click.stop="resetSubAccountPassword(row)">重置密码</el-button>
                  <template v-if="row.status === 'active'">
                    <el-button size="small" type="warning" @click.stop="disableSubAccount(row)">禁用</el-button>
                  </template>
                  <template v-else>
                    <el-button size="small" type="success" @click.stop="enableSubAccount(row)">启用</el-button>
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog title="新增子账号" :visible.sync="showAddSubAccount" width="500px">
      <el-form :model="subAccountForm" label-width="120px">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')
const passwordLoading = ref(false)
const showAddSubAccount = ref(false)

const userInfo = reactive({
  supplierCode: 'SUP000001',
  companyName: '测试供应商公司',
  loginEmail: 'test@supplier.com',
  contactPerson: '张三',
  contactPhone: '13800138001',
  status: 'active',
  createdAt: '2026-05-18T02:04:12.920Z',
  lastLoginAt: '2026-05-18T10:30:00.000Z',
  isMainAccount: true
})

const isMainAccount = ref(true)
const canEditCompanyInfo = ref(true)

const companyForm = reactive({
  companyName: '测试供应商公司',
  unifiedSocialCreditCode: '91440300MA5F8R8T8L',
  registeredAddress: '广东省深圳市南山区科技园',
  bankName: '中国工商银行',
  bankAccount: '6222021234567890123',
  taxIdentificationNumber: '91440300MA5F8R8T8L',
  businessLicenseUrl: ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordFormRef = ref()

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少为8位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, message: '密码需包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value !== passwordForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

const subAccounts = ref([
  { id: 1, loginEmail: 'business@supplier.com', name: '李四', phone: '13800138002', accountType: 'business', status: 'active', createdAt: '2026-05-18T03:00:00.000Z' },
  { id: 2, loginEmail: 'finance@supplier.com', name: '王五', phone: '13800138003', accountType: 'finance', status: 'active', createdAt: '2026-05-18T04:00:00.000Z' }
])

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

function getStatusText(status) {
  const texts = {
    pending_activation: '待激活',
    pending_review: '待审核',
    active: '正常启用',
    temporary_frozen: '临时冻结',
    disabled: '禁用停用',
    cancelled: '注销归档'
  }
  return texts[status] || status
}

function getStatusType(status) {
  const types = {
    pending_activation: 'warning',
    pending_review: 'info',
    active: 'success',
    temporary_frozen: 'warning',
    disabled: 'danger',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

function getRoleName(role) {
  return roleNames[role] || role
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function saveCompanyInfo() {
  ElMessage.success('企业信息保存成功')
}

async function changePassword() {
  if (!passwordFormRef.value) return
  
  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      passwordLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        ElMessage.success('密码修改成功，请重新登录')
        passwordForm.oldPassword = ''
        passwordForm.newPassword = ''
        passwordForm.confirmPassword = ''
      } catch (error) {
        ElMessage.error('密码修改失败')
      } finally {
        passwordLoading.value = false
      }
    }
  })
}

function addSubAccount() {
  if (!subAccountForm.loginEmail || !subAccountForm.role) {
    ElMessage.warning('请填写登录邮箱和岗位类型')
    return
  }

  const newSubAccount = {
    id: subAccounts.value.length + 1,
    loginEmail: subAccountForm.loginEmail,
    name: subAccountForm.contactPerson || '-',
    phone: subAccountForm.contactPhone || '-',
    accountType: subAccountForm.role,
    status: 'active',
    createdAt: new Date().toISOString()
  }

  subAccounts.value.push(newSubAccount)
  ElMessage.success('子账号创建成功')
  showAddSubAccount.value = false
  subAccountForm.loginEmail = ''
  subAccountForm.contactPerson = ''
  subAccountForm.contactPhone = ''
  subAccountForm.role = ''
}

function resetSubAccountPassword(row) {
  ElMessage.info(`已重置账号 ${row.loginEmail} 的密码，新密码已发送至邮箱`)
}

function disableSubAccount(row) {
  row.status = 'disabled'
  ElMessage.success('子账号已禁用')
}

function enableSubAccount(row) {
  row.status = 'active'
  ElMessage.success('子账号已启用')
}

onMounted(() => {
  const storedUser = localStorage.getItem('supplierUser')
  if (storedUser) {
    const user = JSON.parse(storedUser)
    userInfo.supplierCode = user.supplierCode
    userInfo.companyName = user.companyName
    userInfo.loginEmail = user.loginEmail
    userInfo.isMainAccount = user.type === 'main'
    isMainAccount.value = user.type === 'main'
  }
})
</script>

<style lang="scss" scoped>
.profile-container {
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

.tabs-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.profile-card {
  margin-top: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 24px;

  .avatar-wrapper {
    padding: 20px;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    border-radius: 50%;
  }

  .profile-info {
    h2 {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin: 0 0 8px 0;
    }

    .supplier-code {
      font-size: 14px;
      color: #6b7280;
      margin: 0 0 4px 0;
    }

    .account-type {
      font-size: 14px;
      color: #3b82f6;
      margin: 0;
    }
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  .info-item {
    padding: 16px;
    background: #f9fafb;
    border-radius: 8px;

    label {
      display: block;
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    span {
      font-size: 14px;
      color: #1f2937;
      font-weight: 500;
    }
  }
}

.edit-hint {
  margin-left: 12px;
  font-size: 13px;
  color: #f59e0b;
}

.subaccount-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  span {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
  }
}
</style>

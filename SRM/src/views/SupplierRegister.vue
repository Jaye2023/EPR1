<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-header">
        <el-icon :size="48" color="#10b981"><OfficeBuilding /></el-icon>
        <h1>供应商注册</h1>
        <p>Supplier Registration</p>
      </div>

      <el-steps :active="activeStep" simple class="steps">
        <el-step title="基本信息" />
        <el-step title="验证信息" />
        <el-step title="提交审核" />
      </el-steps>

      <div v-show="activeStep === 0" class="step-content">
        <el-form :model="formData" :rules="basicRules" ref="basicFormRef" class="register-form">
          <el-form-item label="企业名称" prop="companyName">
            <el-input v-model="formData.companyName" placeholder="请输入企业全称" size="large" prefix-icon="Building" />
          </el-form-item>
          <el-form-item label="统一社会信用代码" prop="unifiedSocialCreditCode">
            <el-input v-model="formData.unifiedSocialCreditCode" placeholder="请输入统一社会信用代码" size="large" prefix-icon="FileText" />
          </el-form-item>
          <el-form-item label="联系人" prop="contactPerson">
            <el-input v-model="formData.contactPerson" placeholder="请输入联系人姓名" size="large" prefix-icon="User" />
          </el-form-item>
          <el-form-item label="联系电话" prop="contactPhone">
            <el-input v-model="formData.contactPhone" placeholder="请输入手机号码" size="large" prefix-icon="Phone" />
          </el-form-item>
          <el-form-item label="登录邮箱" prop="loginEmail">
            <el-input v-model="formData.loginEmail" placeholder="请输入企业邮箱" size="large" prefix-icon="Mail" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="nextStep" class="submit-btn">
              下一步
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="activeStep === 1" class="step-content">
        <el-form :model="verifyData" :rules="verifyRules" ref="verifyFormRef" class="register-form">
          <el-form-item label="手机验证码" prop="phoneCode">
            <el-input v-model="verifyData.phoneCode" placeholder="请输入手机验证码" size="large" prefix-icon="Message" />
          </el-form-item>
          <el-form-item label="邮箱验证码" prop="emailCode">
            <el-input v-model="verifyData.emailCode" placeholder="请输入邮箱验证码" size="large" prefix-icon="Mail" />
          </el-form-item>
          <div class="verify-buttons">
            <el-button type="primary" :disabled="phoneCountdown > 0" @click="sendPhoneCode">
              {{ phoneCountdown > 0 ? `${phoneCountdown}秒后重发` : '发送手机验证码' }}
            </el-button>
            <el-button type="primary" :disabled="emailCountdown > 0" @click="sendEmailCode">
              {{ emailCountdown > 0 ? `${emailCountdown}秒后重发` : '发送邮箱验证码' }}
            </el-button>
          </div>
          <el-form-item>
            <el-button size="large" @click="prevStep" class="prev-btn">上一步</el-button>
            <el-button type="primary" size="large" :loading="loading" @click="submitRegistration" class="submit-btn">
              提交注册
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-show="activeStep === 2" class="success-content">
        <div class="success-icon">
          <el-icon :size="64" color="#10b981"><CircleCheck /></el-icon>
        </div>
        <h2>注册提交成功</h2>
        <p class="success-message">您的注册信息已提交，我们将在1-3个工作日内完成审核</p>
        <div class="success-info">
          <p>供应商编码：{{ supplierCode }}</p>
          <p>登录账号：{{ formData.loginEmail }}</p>
        </div>
        <el-button type="primary" size="large" @click="goToLogin" class="submit-btn">
          返回登录
        </el-button>
      </div>

      <div class="register-footer">
        <p>已有账号？<a href="/login" class="login-link">立即登录</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Building, FileText, User, Phone, Mail, Message, CircleCheck, OfficeBuilding } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const activeStep = ref(0)
const phoneCountdown = ref(0)
const emailCountdown = ref(0)
const supplierCode = ref('')

const basicFormRef = ref()
const verifyFormRef = ref()

const formData = reactive({
  companyName: '',
  unifiedSocialCreditCode: '',
  contactPerson: '',
  contactPhone: '',
  loginEmail: ''
})

const verifyData = reactive({
  phoneCode: '',
  emailCode: ''
})

const basicRules = {
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  loginEmail: [
    { required: true, message: '请输入登录邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const verifyRules = {
  phoneCode: [{ required: true, message: '请输入手机验证码', trigger: 'blur' }],
  emailCode: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }]
}

function nextStep() {
  if (!basicFormRef.value) return
  basicFormRef.value.validate((valid) => {
    if (valid) {
      activeStep.value = 1
    }
  })
}

function prevStep() {
  activeStep.value = 0
}

function sendPhoneCode() {
  if (!formData.contactPhone) {
    ElMessage.warning('请先填写联系电话')
    return
  }
  
  phoneCountdown.value = 60
  ElMessage.success('验证码已发送')
  
  const timer = setInterval(() => {
    phoneCountdown.value--
    if (phoneCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

function sendEmailCode() {
  if (!formData.loginEmail) {
    ElMessage.warning('请先填写登录邮箱')
    return
  }
  
  emailCountdown.value = 60
  ElMessage.success('验证码已发送')
  
  const timer = setInterval(() => {
    emailCountdown.value--
    if (emailCountdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function submitRegistration() {
  if (!verifyFormRef.value) return
  verifyFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('http://localhost:3001/api/supplier-accounts/supplier-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            ...verifyData
          })
        })
        const data = await response.json()
        if (data.success) {
          supplierCode.value = data.data.supplierCode
          activeStep.value = 2
        } else {
          ElMessage.error(data.error)
        }
      } catch (error) {
        ElMessage.error('注册失败，请稍后重试')
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

function goToLogin() {
  router.push('/supplier-login')
}
</script>

<style lang="scss" scoped>
.register-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
}

.register-card {
  width: 500px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.register-header {
  text-align: center;
  margin-bottom: 24px;

  h1 {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin: 16px 0 8px;
  }

  p {
    font-size: 14px;
    color: #909399;
  }
}

.steps {
  margin-bottom: 24px;
}

.step-content {
  min-height: 300px;
}

.register-form {
  .submit-btn {
    width: 100%;
    margin-top: 16px;
  }

  .prev-btn {
    width: 48%;
    margin-right: 4%;
  }
}

.verify-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.success-content {
  text-align: center;
  padding: 20px 0;

  .success-icon {
    margin-bottom: 20px;
  }

  h2 {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
    margin-bottom: 12px;
  }

  .success-message {
    color: #606266;
    margin-bottom: 24px;
  }

  .success-info {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    text-align: left;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;

  p {
    font-size: 14px;
    color: #909399;
  }

  .login-link {
    color: #10b981;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>

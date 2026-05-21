<template>
  <div class="login-page">
    <div class="login-background">
      <div class="bg-grid"></div>
      <div class="bg-circle circle1"></div>
      <div class="bg-circle circle2"></div>
      <div class="bg-circle circle3"></div>
    </div>
    
    <div class="login-container">
      <div class="login-card" :class="{ 'is-loading': loading }">
        <div class="login-header">
          <div class="logo-wrapper">
            <el-icon :size="56" color="#fff"><OfficeBuilding /></el-icon>
          </div>
          <h1>ERP企业资源计划系统</h1>
          <p class="subtitle">Enterprise Resource Planning System</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          size="large"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名 / 手机号 / 邮箱"
              clearable
              autofocus
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><User /></el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"
            >
              <template #prefix>
                <el-icon><Lock /></el-icon>
              </template>
              <template #suffix>
                <el-icon class="password-toggle" @click="showPassword = !showPassword">
                  <View v-if="!showPassword" />
                  <Hide v-else />
                </el-icon>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <div class="form-row">
              <el-checkbox v-model="form.remember">记住我</el-checkbox>
              <el-link type="primary" :underline="false" @click="handleForgotPassword">忘记密码？</el-link>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="loading"
              class="login-btn"
              @click="handleLogin"
            >
              <span v-if="!loading">登 录</span>
              <span v-else>登录中...</span>
            </el-button>
          </el-form-item>

          <el-form-item>
            <div class="divider">
              <span>或</span>
            </div>
          </el-form-item>

          <el-form-item>
            <div class="quick-login">
              <el-tooltip content="企业微信登录" placement="top">
                <div class="quick-login-btn wework">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
              </el-tooltip>
              <el-tooltip content="钉钉登录" placement="top">
                <div class="quick-login-btn dingtalk">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                  </svg>
                </div>
              </el-tooltip>
              <el-tooltip content="飞书登录" placement="top">
                <div class="quick-login-btn feishu">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                </div>
              </el-tooltip>
            </div>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p class="copyright">
            © 2024 电线电缆ERP系统 v1.0.0 · 
            <el-link type="info" :underline="false">用户协议</el-link> · 
            <el-link type="info" :underline="false">隐私政策</el-link>
          </p>
        </div>
      </div>

      <div class="login-tips">
        <el-card shadow="never" class="tips-card">
          <template #header>
            <div class="tips-header">
              <el-icon><InfoFilled /></el-icon>
              <span>登录提示</span>
            </div>
          </template>
          <div class="tips-content">
            <div class="tip-item">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <span>支持用户名、手机号或邮箱登录</span>
            </div>
            <div class="tip-item">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <span>密码需包含字母和数字，长度8-20位</span>
            </div>
            <div class="tip-item">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <span>连续5次登录失败将被锁定30分钟</span>
            </div>
            <div class="tip-item">
              <el-icon color="#67c23a"><CircleCheck /></el-icon>
              <span>如有问题请联系系统管理员</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="contact-card">
          <div class="contact-content">
            <div class="contact-item">
              <el-icon color="#409eff"><Phone /></el-icon>
              <span>400-888-8888</span>
            </div>
            <div class="contact-item">
              <el-icon color="#409eff"><Message /></el-icon>
              <span>support@erp.example.com</span>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 忘记密码对话框 -->
    <el-dialog
      v-model="forgotDialogVisible"
      title="找回密码"
      width="450px"
      :close-on-click-modal="false"
    >
      <el-steps :active="forgotStep" finish-status="success" class="forgot-steps">
        <el-step title="验证身份" />
        <el-step title="重置密码" />
        <el-step title="完成" />
      </el-steps>

      <el-form v-if="forgotStep === 0" :model="forgotForm" class="forgot-form">
        <el-form-item label="用户名">
          <el-input v-model="forgotForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="注册手机">
          <el-input v-model="forgotForm.phone" placeholder="请输入注册手机号">
            <template #append>
              <el-button :disabled="forgotCooldown > 0" @click="sendVerifyCode">
                {{ forgotCooldown > 0 ? `${forgotCooldown}s` : '获取验证码' }}
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="验证码">
          <el-input v-model="forgotForm.code" placeholder="请输入短信验证码" />
        </el-form-item>
      </el-form>

      <el-form v-else-if="forgotStep === 1" :model="forgotForm" class="forgot-form">
        <el-form-item label="新密码">
          <el-input
            v-model="forgotForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="forgotForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>

      <div v-else class="forgot-success">
        <el-icon :size="64" color="#67c23a"><CircleCheck /></el-icon>
        <p>密码重置成功！</p>
      </div>

      <template #footer>
        <div v-if="forgotStep < 2">
          <el-button @click="forgotDialogVisible = false">取消</el-button>
          <el-button v-if="forgotStep === 0" type="primary" @click="nextForgotStep">下一步</el-button>
          <el-button v-else type="primary" @click="confirmResetPassword">确认重置</el-button>
        </div>
        <el-button v-else type="primary" @click="goToLogin">去登录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, OfficeBuilding, View, Hide, InfoFilled, CircleCheck, Phone, Message } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const formRef = ref()
const showPassword = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false
})

const forgotDialogVisible = ref(false)
const forgotStep = ref(0)
const forgotCooldown = ref(0)

const forgotForm = reactive({
  username: '',
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 20, message: '密码长度在 8 到 20 个字符', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, message: '密码需包含字母和数字', trigger: 'blur' }
  ]
}

async function handleLogin() {
  if (!formRef.value) return
  
  try {
    const valid = await formRef.value.validate()
    if (!valid) return
    
    loading.value = true
    
    // 模拟登录请求
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // 保存登录状态
    if (form.remember) {
      localStorage.setItem('erp_rememberedUsername', form.username)
    } else {
      localStorage.removeItem('erp_rememberedUsername')
    }
    
    ElMessage.success('登录成功，欢迎回来！')
    router.push('/')
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

function handleForgotPassword() {
  forgotDialogVisible.value = true
  forgotStep.value = 0
  Object.assign(forgotForm, {
    username: '',
    phone: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
}

function sendVerifyCode() {
  if (!forgotForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(forgotForm.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }
  
  ElMessage.success('验证码已发送')
  forgotCooldown.value = 60
  
  const timer = setInterval(() => {
    forgotCooldown.value--
    if (forgotCooldown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

function nextForgotStep() {
  if (!forgotForm.username) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!forgotForm.phone) {
    ElMessage.warning('请输入手机号')
    return
  }
  if (!forgotForm.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  
  forgotStep.value = 1
}

function confirmResetPassword() {
  if (!forgotForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (forgotForm.newPassword.length < 8) {
    ElMessage.warning('密码长度不能少于8位')
    return
  }
  if (forgotForm.newPassword !== forgotForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  ElMessage.success('密码重置成功')
  forgotStep.value = 2
}

function goToLogin() {
  forgotDialogVisible.value = false
  form.username = forgotForm.username
}

// 恢复记住的用户名
const rememberedUsername = localStorage.getItem('erp_rememberedUsername')
if (rememberedUsername) {
  form.username = rememberedUsername
  form.remember = true
}
</script>

<style lang="scss" scoped>
.login-page {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
  overflow: hidden;
}

.login-background {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.bg-grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  animation: float 8s ease-in-out infinite;
  
  &.circle1 {
    width: 450px;
    height: 450px;
    top: -150px;
    left: -150px;
    animation-delay: 0s;
  }
  
  &.circle2 {
    width: 350px;
    height: 350px;
    bottom: -100px;
    right: -100px;
    animation-delay: -3s;
  }
  
  &.circle3 {
    width: 250px;
    height: 250px;
    top: 40%;
    right: 20%;
    animation-delay: -5s;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }
  50% {
    transform: translateY(-40px) rotate(10deg) scale(1.05);
  }
}

.login-container {
  position: relative;
  display: flex;
  gap: 40px;
  z-index: 1;
}

.login-card {
  width: 420px;
  padding: 48px 40px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  
  &.is-loading {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 36px;
  
  .logo-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 88px;
    height: 88px;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border-radius: 20px;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
  }
  
  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #1e3a8a;
    margin: 0 0 8px;
  }
  
  .subtitle {
    font-size: 13px;
    color: #64748b;
    letter-spacing: 1px;
  }
}

.login-form {
  :deep(.el-form-item) {
    margin-bottom: 24px;
  }
  
  :deep(.el-input) {
    .el-input__wrapper {
      padding: 4px 16px;
      border-radius: 10px;
      box-shadow: 0 0 0 1px #e2e8f0 inset;
      transition: all 0.3s;
      
      &:hover {
        box-shadow: 0 0 0 1px #cbd5e1 inset;
      }
      
      &.is-focus {
        box-shadow: 0 0 0 2px #3b82f6 inset;
      }
    }
  }
  
  .password-toggle {
    cursor: pointer;
    color: #64748b;
    transition: color 0.3s;
    
    &:hover {
      color: #3b82f6;
    }
  }
  
  .form-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .login-btn {
    width: 100%;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 10px;
    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
    border: none;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    }
  }
  
  .divider {
    position: relative;
    text-align: center;
    
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e2e8f0;
    }
    
    span {
      position: relative;
      padding: 0 16px;
      background: #fff;
      color: #64748b;
      font-size: 13px;
    }
  }
  
  .quick-login {
    display: flex;
    justify-content: center;
    gap: 20px;
    
    .quick-login-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #f1f5f9;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      }
      
      &.wework:hover {
        background: #07c160;
        color: #fff;
      }
      
      &.dingtalk:hover {
        background: #1677ff;
        color: #fff;
      }
      
      &.feishu:hover {
        background: #3370ff;
        color: #fff;
      }
    }
  }
}

.login-footer {
  margin-top: 32px;
  text-align: center;
  
  .copyright {
    font-size: 12px;
    color: #94a3b8;
  }
}

.login-tips {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 320px;
}

.tips-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  
  .tips-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 600;
    color: #1e3a8a;
  }
  
  .tips-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .tip-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: #64748b;
    }
  }
}

.contact-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  
  .contact-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      color: #334155;
    }
  }
}

.forgot-steps {
  margin-bottom: 32px;
}

.forgot-form {
  padding: 20px 0;
}

.forgot-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  
  p {
    margin-top: 16px;
    font-size: 16px;
    color: #334155;
  }
}

@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    align-items: center;
  }
  
  .login-tips {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    width: 100%;
    padding: 32px 24px;
    border-radius: 16px;
  }
}
</style>
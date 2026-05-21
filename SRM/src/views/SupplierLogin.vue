<template>
  <div class="supplier-login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <el-icon :size="48" color="#3b82f6"><Box /></el-icon>
          <h1>供应商登录</h1>
          <p>Supplier Login</p>
        </div>

        <el-form :model="loginForm" :rules="loginRules" ref="loginFormRef" class="login-form">
          <el-form-item prop="email">
            <el-input 
              v-model="loginForm.email" 
              placeholder="请输入登录邮箱" 
              size="large" 
              prefix-icon="Mail"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码" 
              size="large" 
              prefix-icon="Lock" 
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          <el-form-item class="remember-me">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <a href="#" class="forget-link" @click.prevent="showForgetModal = true">忘记密码？</a>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="loading" @click="handleLogin" class="login-btn">
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <p>还没有账号？<a href="/supplier-register" class="register-link">立即注册</a></p>
        </div>
      </div>
    </div>

    <el-dialog title="忘记密码" :visible.sync="showForgetModal" width="400px">
      <el-form :model="forgetForm" :rules="forgetRules" ref="forgetFormRef">
        <el-form-item label="注册邮箱" prop="email">
          <el-input v-model="forgetForm.email" placeholder="请输入注册邮箱" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input">
            <el-input v-model="forgetForm.code" placeholder="请输入验证码" />
            <el-button type="primary" :disabled="countdown > 0" @click="sendForgetCode">
              {{ countdown > 0 ? `${countdown}秒` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showForgetModal = false">取消</el-button>
        <el-button type="primary" @click="handleForget">确认重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Box, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)
const showForgetModal = ref(false)
const countdown = ref(0)

const loginFormRef = ref()
const forgetFormRef = ref()

const loginForm = reactive({
  email: '',
  password: '',
  remember: false
})

const forgetForm = reactive({
  email: '',
  code: ''
})

const loginRules = {
  email: [
    { required: true, message: '请输入登录邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const forgetRules = {
  email: [
    { required: true, message: '请输入注册邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

async function handleLogin() {
  if (!loginFormRef.value) return
  
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await fetch('http://localhost:3001/api/supplier-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginForm.email,
            password: loginForm.password
          })
        })
        const data = await response.json()
        
        if (data.success) {
          ElMessage.success('登录成功')
          localStorage.setItem('supplierUser', JSON.stringify(data.data))
          router.push('/')
        } else {
          ElMessage.error(data.error)
        }
      } catch (error) {
        ElMessage.error('登录失败，请稍后重试')
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

function sendForgetCode() {
  if (!forgetForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  
  countdown.value = 60
  ElMessage.success('验证码已发送')
  
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

async function handleForget() {
  if (!forgetFormRef.value) return
  
  forgetFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await fetch('http://localhost:3001/api/supplier-auth/forget-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgetForm.email })
        })
        const data = await response.json()
        
        if (data.success) {
          ElMessage.success(data.message)
          showForgetModal.value = false
          forgetForm.email = ''
          forgetForm.code = ''
        } else {
          ElMessage.error(data.error)
        }
      } catch (error) {
        ElMessage.error('操作失败，请稍后重试')
        console.error('忘记密码失败:', error)
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.supplier-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;

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

.login-form {
  .remember-me {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;

    .forget-link {
      color: #3b82f6;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .login-btn {
    width: 100%;
    margin-top: 16px;
  }
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;

  p {
    font-size: 14px;
    color: #909399;
  }

  .register-link {
    color: #3b82f6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.code-input {
  display: flex;
  gap: 12px;

  .el-input {
    flex: 1;
  }
}
</style>

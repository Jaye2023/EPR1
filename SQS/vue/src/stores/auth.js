import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, rolesApi } from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))
  const permissions = ref([])

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const userName = computed(() => currentUser.value?.name || '未登录')

  async function login(username, password) {
    try {
      const res = await authApi.login(username, password)
      
      if (res.token) {
        token.value = res.token
        currentUser.value = res.user
        localStorage.setItem('token', res.token)
        localStorage.setItem('currentUser', JSON.stringify(res.user))
        await loadPermissions()
        return true
      }
      
      if (res.success === false) {
        throw new Error(res.error || '用户名或密码错误')
      }
      
      throw new Error('登录响应格式错误')
    } catch (error) {
      if (error.response) {
        // HTTP 错误响应
        const status = error.response.status
        if (status === 401) {
          throw new Error('用户名或密码错误')
        } else if (status === 403) {
          throw new Error('用户已被禁用')
        } else {
          throw new Error('登录失败，请稍后重试')
        }
      } else if (!error.message) {
        throw new Error('网络连接失败，请检查服务器')
      }
      throw error
    }
  }

  function logout() {
    token.value = ''
    currentUser.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
  }

  async function validateToken() {
    try {
      await authApi.validate()
      await loadPermissions()
      return true
    } catch {
      logout()
      return false
    }
  }

  async function loadPermissions() {
    if (!token.value) return
    
    try {
      const res = await rolesApi.getRoles()
      if (res && res.roles) {
        const userRole = res.roles.find(r => r.id === currentUser.value?.role)
        if (userRole) {
          permissions.value = userRole.permissions || []
        }
      }
    } catch (error) {
      console.error('加载权限失败:', error)
    }
  }

  function hasPermission(permission) {
    if (!permission) return true
    if (currentUser.value?.role === 'admin') return true
    return permissions.value.includes(permission)
  }

  return {
    token,
    currentUser,
    permissions,
    isAuthenticated,
    isAdmin,
    userName,
    login,
    logout,
    validateToken,
    hasPermission,
    loadPermissions
  }
})

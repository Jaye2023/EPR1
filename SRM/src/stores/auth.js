import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const currentUser = ref(JSON.parse(localStorage.getItem('currentUser') || '{"name":"SRM用户"}'))

  const userName = computed(() => currentUser.value?.name || 'SRM用户')

  function login(username, password) {
    if (username && password) {
      currentUser.value = { name: username, role: 'user' }
      return true
    }
    return false
  }

  function logout() {
    token.value = ''
    currentUser.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('currentUser')
  }

  return {
    token,
    currentUser,
    userName,
    login,
    logout
  }
})
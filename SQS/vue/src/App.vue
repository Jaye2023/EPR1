<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { useAuthStore } from './stores/auth'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  const currentRouteName = router.currentRoute.value.name
  
  if (currentRouteName === 'login') {
    return
  }
  
  if (!authStore.token) {
    router.push('/login')
    return
  }
  
  try {
    await authStore.validateToken()
  } catch {
    router.push('/login')
  }
})
</script>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

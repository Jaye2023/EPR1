<template>
  <div class="srm-layout">
    <aside class="srm-sidebar">
      <div class="sidebar-header">
        <el-icon><User /></el-icon>
        <span>SRM系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/suppliers">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>供应商管理</template>
        </el-menu-item>
        <el-menu-item index="/purchase">
          <el-icon><ShoppingCart /></el-icon>
          <template #title>采购订单</template>
        </el-menu-item>
        <el-menu-item index="/contracts">
          <el-icon><Document /></el-icon>
          <template #title>合同管理</template>
        </el-menu-item>
        <el-menu-item index="/performance">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>绩效评估</template>
        </el-menu-item>
        <el-divider />
        <el-menu-item index="/login">
          <el-icon><SwitchButton /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="srm-main">
      <header class="srm-header">
        <div class="header-left">
          <el-button text @click="toggleSidebar">
            <el-icon size="20"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <span class="page-title">SRM供应商关系管理</span>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">SRM用户</span>
          </span>
        </div>
      </header>

      <main class="srm-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  User, Odometer, OfficeBuilding, ShoppingCart, Document,
  DataAnalysis, Fold, Expand, SwitchButton
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapsed = ref(false)
const activeMenu = computed(() => route.path)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
.srm-layout {
  display: flex;
  height: 100vh;
}

.srm-sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  transition: width 0.3s;

  &.is-collapsed {
    width: 64px;
  }
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
  font-size: 18px;
  font-weight: bold;

  .is-collapsed & {
    justify-content: center;
    padding: 0;
  }
}

.sidebar-menu {
  flex: 1;
  border-right: none;
}

.srm-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.srm-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.username {
  font-size: 14px;
  color: #606266;
}

.srm-content {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}
</style>
<template>
  <div class="erp-layout">
    <aside class="erp-sidebar">
      <div class="sidebar-header">
        <el-icon><Box /></el-icon>
        <span>ERP系统</span>
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
        <el-menu-item index="/inventory">
          <el-icon><Goods /></el-icon>
          <template #title>库存管理</template>
        </el-menu-item>
        <el-menu-item index="/hr">
          <el-icon><User /></el-icon>
          <template #title>人力资源</template>
        </el-menu-item>
        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <template #title>财务管理</template>
        </el-menu-item>
        <el-menu-item index="/production">
          <el-icon><Setting /></el-icon>
          <template #title>生产工单</template>
        </el-menu-item>
        <el-menu-item index="/orders">
          <el-icon><Tickets /></el-icon>
          <template #title>订单管理</template>
        </el-menu-item>
        <el-menu-item index="/finance">
          <el-icon><Money /></el-icon>
          <template #title>财务管理</template>
        </el-menu-item>
        <el-menu-item index="/hr">
          <el-icon><User /></el-icon>
          <template #title>人力资源</template>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><OfficeBuilding /></el-icon>
          <template #title>客户管理</template>
        </el-menu-item>
        <el-menu-item index="/prices">
          <el-icon><PriceTag /></el-icon>
          <template #title>价格管理</template>
        </el-menu-item>
        <el-menu-item index="/alerts">
          <el-icon><Bell /></el-icon>
          <template #title>预警中心</template>
        </el-menu-item>
        <el-divider />
        <el-menu-item index="/settings">
          <el-icon><Tools /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
        <el-menu-item index="/login">
          <el-icon><SwitchButton /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="erp-main">
      <header class="erp-header">
        <div class="header-left">
          <el-button text @click="toggleSidebar">
            <el-icon size="20"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <span class="page-title">ERP企业资源计划</span>
        </div>
        <div class="header-right">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">ERP用户</span>
          </span>
        </div>
      </header>

      <main class="erp-content">
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
  Box, Odometer, Goods, Tickets, Money, User,
  Fold, Expand, SwitchButton, OfficeBuilding, PriceTag, Bell, Setting, Tools
} from '@element-plus/icons-vue'

const route = useRoute()
const isCollapsed = ref(false)
const activeMenu = computed(() => route.path)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style lang="scss" scoped>
.erp-layout {
  display: flex;
  height: 100vh;
}

.erp-sidebar {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.erp-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.erp-header {
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

.erp-content {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}
</style>
<template>
  <div class="app-wrapper">
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-show="!isCollapsed">
          <el-icon><Box /></el-icon>
          <span>ERP系统</span>
        </div>
        <el-icon v-show="isCollapsed" class="logo-icon"><Box /></el-icon>
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

        <el-menu-item index="/prices">
          <el-icon><PriceTag /></el-icon>
          <template #title>价格管理</template>
        </el-menu-item>

        <el-menu-item index="/copper-price">
          <el-icon><Coin /></el-icon>
          <template #title>铜价管理</template>
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

        <el-divider />

        <el-menu-item index="/login">
          <el-icon><SwitchButton /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="main-wrapper">
      <header class="main-header">
        <div class="header-left">
          <el-button text @click="toggleSidebar">
            <el-icon size="20"><Fold v-if="!isCollapsed" /><Expand v-else /></el-icon>
          </el-button>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" icon="UserFilled" />
              <span class="username">ERP用户</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <div class="tabs-bar">
        <div
          v-for="tab in tabsStore.tabs"
          :key="tab.path"
          class="tab-item"
          :class="{ 'is-active': tabsStore.activeTab === tab.path }"
          @click="handleTabClick(tab)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <el-icon
            v-if="tabsStore.tabs.length > 1"
            class="tab-close"
            @click.stop="handleTabClose(tab)"
          >
            <Close />
          </el-icon>
        </div>
      </div>

      <main class="main-content">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </router-view>
      </main>
      <StatusBar />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useTabsStore } from '../stores/tabs'
import StatusBar from '../components/StatusBar.vue'
import {
  Box, Odometer, Goods, Tickets, Money, User,
  Fold, Expand, SwitchButton, ArrowDown, Close,
  PriceTag, Coin
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const tabsStore = useTabsStore()

const isCollapsed = ref(false)
const activeMenu = computed(() => route.path)

onMounted(() => {
  tabsStore.addTab(route)
})

watch(
  () => route.path,
  (newPath) => {
    tabsStore.addTab(route)
  }
)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

function handleTabClick(tab) {
  router.push(tab.path)
}

function handleTabClose(tab) {
  const newPath = tabsStore.removeTab(tab.path)
  if (newPath) {
    router.push(newPath)
  }
}

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      tabsStore.closeAllTabs()
      router.push('/login')
    } catch {
      // cancelled
    }
  }
}
</script>

<style lang="scss" scoped>
.app-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1f2d3d 0%, #2d3e50 100%);
  transition: width 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);

  &.is-collapsed {
    width: 64px;
    box-shadow: 1px 0 8px rgba(0, 0, 0, 0.1);
  }

  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%);

    .logo {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: opacity 0.2s ease;

      .el-icon {
        font-size: 22px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    .logo-icon {
      color: #fff;
      font-size: 26px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }

  .sidebar-menu {
    flex: 1;
    border-right: none;
    background: transparent;
    overflow-y: auto;
    overflow-x: hidden;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #4a5568;
      border-radius: 2px;

      &:hover {
        background: #5a6578;
      }
    }

    :deep(.el-menu-item) {
      color: #e4e7ed;
      font-size: 14px;
      height: 48px;
      line-height: 48px;
      margin: 0 4px;
      border-radius: 4px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(102, 126, 234, 0.15);
        color: #fff;
      }

      &.is-active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
      }

      .el-icon {
        font-size: 18px;
      }
    }

    :deep(.el-divider) {
      margin: 12px 16px;
      border-color: #3d4a5c;
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f5f7fa;
}

.main-header {
  height: 60px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  flex-shrink: 0;

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    .username {
      font-size: 14px;
      color: #333;
    }
  }
}

.tabs-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 8px;
  overflow-x: auto;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d9d9d9;
    border-radius: 2px;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 16px;
    height: 40px;
    cursor: pointer;
    color: #606266;
    font-size: 14px;
    transition: all 0.2s ease;
    border-bottom: 2px solid transparent;

    &:hover {
      background: #f5f7fa;
    }

    &.is-active {
      color: #667eea;
      border-bottom-color: #667eea;
      background: #f5f7fa;
    }

    .tab-title {
      white-space: nowrap;
    }

    .tab-close {
      width: 16px;
      height: 16px;
      line-height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: #909399;

      &:hover {
        background: #f56c6c;
        color: #fff;
      }
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;
}
</style>
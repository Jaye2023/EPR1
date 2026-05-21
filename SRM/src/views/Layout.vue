<template>
  <div class="app-wrapper">
    <aside class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
      <div class="sidebar-header">
        <div class="logo" v-show="!isCollapsed">
          <div class="logo-icon-wrapper">
            <el-icon><User /></el-icon>
          </div>
          <div class="logo-text">
            <span class="logo-title">SRM系统</span>
            <span class="logo-subtitle">供应商关系管理</span>
          </div>
        </div>
        <el-icon v-show="isCollapsed" class="logo-icon"><User /></el-icon>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :collapse-transition="false"
        router
        class="sidebar-menu"
        mode="vertical"
      >
        <el-menu-item index="/">
          <el-icon><Odometer /></el-icon>
          <template #title>首页</template>
          <template v-if="isCollapsed" #title>
            <span class="tooltip-title">首页</span>
          </template>
        </el-menu-item>

        <el-sub-menu index="supplier">
          <template #title>
            <el-icon><User /></el-icon>
            <span>供应商管理</span>
          </template>
          <el-menu-item index="/supplier-accounts">供应商账户</el-menu-item>
          <el-menu-item index="/suppliers">供应商信息</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="order">
          <template #title>
            <el-icon><ShoppingCart /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/purchase">采购订单管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/contracts">
          <el-icon><Document /></el-icon>
          <template #title>合同管理</template>
        </el-menu-item>

        <el-sub-menu index="material">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>物料管理</span>
          </template>
          <el-menu-item index="/materials">物料信息</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="finance">
          <template #title>
            <el-icon><Wallet /></el-icon>
            <span>财务管理</span>
          </template>
          <el-menu-item index="/finance-payments">付款管理</el-menu-item>
          <el-menu-item index="/finance-invoices">发票管理</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/performance">
          <el-icon><TrendCharts /></el-icon>
          <template #title>绩效评估</template>
        </el-menu-item>

        <el-sub-menu index="permission">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>权限管理</span>
          </template>
          <el-menu-item index="/user-management">用户管理</el-menu-item>
          <el-menu-item index="/role-management">角色管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="logistics">
          <template #title>
            <el-icon><Van /></el-icon>
            <span>物流管理</span>
          </template>
          <el-menu-item index="/asn-management">ASN 管理</el-menu-item>
          <el-menu-item index="/delivery-appointment">发货预约</el-menu-item>
          <el-menu-item index="/in-transit-tracking">在途跟踪</el-menu-item>
          <el-menu-item index="/logistics-report">物流报表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="sync">
          <template #title>
            <el-icon><Refresh /></el-icon>
            <span>数据同步</span>
          </template>
          <el-menu-item index="/sync-monitor">同步监控</el-menu-item>
          <el-menu-item index="/sync-config">单据配置</el-menu-item>
          <el-menu-item index="/reconciliation">数据对账</el-menu-item>
        </el-sub-menu>

        <el-divider />

        <el-menu-item index="/system">
          <el-icon><Setting /></el-icon>
          <template #title>管理维护</template>
        </el-menu-item>

        <el-menu-item index="/login">
          <el-icon><TopRight /></el-icon>
          <template #title>退出登录</template>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <div class="version-info" v-show="!isCollapsed">
          <span class="version-label">v1.0.0</span>
          <span class="version-text">SRM System</span>
        </div>
        <div class="collapse-hint" v-show="isCollapsed">
          <el-icon><Expand /></el-icon>
        </div>
      </div>
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
              <span class="username">SRM用户</span>
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
  User, Odometer, ShoppingCart, Document, DataAnalysis,
  Fold, Expand, SwitchButton, ArrowDown, Close, 
  Box, Wallet, TrendCharts, Setting, TopRight, UserFilled, Refresh, Van
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
  background: #1e293b;
  transition: width 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.2);
  border-right: 1px solid #334155;

  &.is-collapsed {
    width: 64px;
    box-shadow: 1px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #334155;
    flex-shrink: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent 0%, #3b82f6 50%, transparent 100%);
      opacity: 0.5;
    }

    .logo {
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
      transition: opacity 0.2s ease;
      padding: 0 16px;

      .logo-icon-wrapper {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);
        animation: logoGlow 3s ease-in-out infinite;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover::before {
          opacity: 1;
        }

        .el-icon {
          font-size: 22px;
          color: #fff;
          transition: transform 0.3s ease;
        }

        &:hover .el-icon {
          transform: rotate(15deg) scale(1.1);
        }
      }

      .logo-text {
        display: flex;
        flex-direction: column;

        .logo-title {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          letter-spacing: 0.5px;
          text-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .logo-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          line-height: 1.2;
        }
      }
    }

    .logo-icon {
      color: #fff;
      font-size: 26px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
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
    padding: 12px 8px;

    &::-webkit-scrollbar {
      width: 5px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: #475569;
      border-radius: 3px;

      &:hover {
        background: #64748b;
      }
    }

    :deep(.el-menu-item) {
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 500;
      height: 44px;
      line-height: 44px;
      margin: 2px 4px;
      border-radius: 8px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      padding-left: 20px !important;
      background: transparent;
      position: relative;
      overflow: hidden;
      letter-spacing: 0.3px;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 0;
        background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 0 2px 2px 0;
        transition: height 0.25s ease;
      }

      &:hover {
        background: rgba(59, 130, 246, 0.2);
        color: #ffffff;
        transform: translateX(4px);

        &::before {
          height: 20px;
        }
      }

      &.is-active {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(139, 92, 246, 0.35) 100%);
        color: #ffffff;
        box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
        border: 1px solid rgba(59, 130, 246, 0.4);
        font-weight: 600;

        &::before {
          height: 24px;
        }

        .el-icon {
          color: #60a5fa;
        }
      }

      .el-icon {
        font-size: 18px;
        margin-right: 12px;
        color: #94a3b8;
        transition: transform 0.2s ease, color 0.2s ease;
        
        &.is-active {
          color: #60a5fa;
        }
      }

      &:hover .el-icon {
        transform: scale(1.1);
        color: #ffffff;
      }
    }

    :deep(.el-sub-menu) {
      .el-sub-menu__title {
        color: #e2e8f0;
        font-size: 14px;
        font-weight: 500;
        height: 44px;
        line-height: 44px;
        margin: 2px 4px;
        border-radius: 8px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        padding-left: 20px !important;
        background: transparent;
        position: relative;
        overflow: hidden;
        letter-spacing: 0.3px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 3px;
          height: 0;
          background: linear-gradient(180deg, #8b5cf6 0%, #ec4899 100%);
          border-radius: 0 2px 2px 0;
          transition: height 0.25s ease;
        }

        &:hover {
          background: rgba(139, 92, 246, 0.2);
          color: #ffffff;
          transform: translateX(4px);

          &::before {
            height: 20px;
          }

          .el-icon {
            transform: scale(1.1);
            color: #ffffff;
          }
        }

        &.is-active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.35) 0%, rgba(236, 72, 153, 0.35) 100%);
          color: #ffffff;
          font-weight: 600;

          &::before {
            height: 24px;
          }

          .el-icon {
            color: #c4b5fd;
          }
        }

        .el-icon {
          font-size: 18px;
          margin-right: 12px;
          color: #94a3b8;
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .el-sub-menu__icon-arrow {
          font-size: 14px;
          color: #94a3b8;
          transition: transform 0.3s ease, color 0.2s ease;
        }

        &.is-active .el-sub-menu__icon-arrow {
          color: #c4b5fd;
        }

        &:hover .el-sub-menu__icon-arrow {
          color: #ffffff;
        }
      }

      .el-menu-item {
        padding-left: 48px !important;
        height: 40px;
        line-height: 40px;
        font-size: 13px;
        font-weight: 500;
        margin: 1px 4px;
        border-radius: 6px;
        transition: all 0.2s ease;
        position: relative;
        color: #cbd5e1;
        letter-spacing: 0.2px;

        &::before {
          content: '';
          position: absolute;
          left: 36px;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 0;
          background: #3b82f6;
          border-radius: 0 2px 2px 0;
          transition: height 0.2s ease;
        }

        &:hover {
          background: rgba(59, 130, 246, 0.15);
          color: #f1f5f9;
          padding-left: 52px !important;

          &::before {
            height: 16px;
          }
        }

        &.is-active {
          background: rgba(59, 130, 246, 0.25);
          color: #93c5fd;
          font-weight: 600;
          padding-left: 52px !important;

          &::before {
            height: 20px;
          }
        }

        .el-icon {
          font-size: 15px;
          margin-right: 8px;
        }
      }
    }

    :deep(.el-divider) {
      margin: 12px 8px;
      border-color: #334155;
      background: #334155;
    }
  }

  .sidebar-footer {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #334155;
    flex-shrink: 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);

    .version-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 16px;

      .version-label {
        font-size: 11px;
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.15);
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: 600;
      }

      .version-text {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
      }
    }

    .collapse-hint {
      color: #64748b;
      font-size: 16px;
      cursor: pointer;
      transition: color 0.2s ease;

      &:hover {
        color: #3b82f6;
      }
    }
  }
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f8fafc;
}

.main-header {
  height: 64px;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  border-bottom: 1px solid #e2e8f0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;

    :deep(.el-button) {
      color: #64748b;
      font-size: 18px;

      &:hover {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
      }
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: background 0.2s ease;

    &:hover {
      background: #f1f5f9;
    }

    .username {
      font-size: 14px;
      color: #334155;
      font-weight: 500;
    }

    :deep(.el-avatar) {
      --el-avatar-bg-color: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      border: 2px solid #e2e8f0;
    }

    :deep(.el-icon) {
      font-size: 14px;
      color: #94a3b8;
    }
  }
}

.tabs-bar {
  display: flex;
  align-items: center;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 4px 12px;
  overflow-x: auto;
  flex-shrink: 0;
  gap: 4px;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 2px;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    height: 36px;
    cursor: pointer;
    color: #64748b;
    font-size: 13.5px;
    transition: all 0.2s ease;
    border-radius: 6px;
    white-space: nowrap;

    &:hover {
      background: #f1f5f9;
    }

    &.is-active {
      color: #1e293b;
      background: #f1f5f9;
      font-weight: 500;
      box-shadow: inset 0 -2px 0 0 #3b82f6;
    }

    .tab-title {
      white-space: nowrap;
    }

    .tab-close {
      width: 18px;
      height: 18px;
      line-height: 18px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      color: #94a3b8;
      opacity: 0;

      &:hover {
        background: #ef4444;
        color: #fff;
      }
    }

    &:hover .tab-close {
      opacity: 1;
    }
  }
}

.main-content {
  flex: 1;
  overflow-y: auto;
  background: #f8fafc;
  padding: 16px;
}
</style>

<style lang="scss">
@keyframes logoGlow {
  0%, 100% {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.4);
  }
}
</style>
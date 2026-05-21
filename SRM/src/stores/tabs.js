import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTabsStore = defineStore('tabs', () => {
  const tabs = ref([])
  const activeTab = ref('')

  const tabTitleMap = {
    '/': '仪表盘',
    '/suppliers': '供应商信息',
    '/supplier-accounts': '供应商账户',
    '/purchase': '采购订单',
    '/contracts': '合同管理',
    '/performance': '绩效评估'
  }

  function getTabTitle(path) {
    return tabTitleMap[path] || path
  }

  function addTab(route) {
    const exists = tabs.value.find(tab => tab.path === route.path)
    if (!exists) {
      tabs.value.push({
        path: route.path,
        title: getTabTitle(route.path),
        name: route.name
      })
    }
    activeTab.value = route.path
  }

  function removeTab(path) {
    const index = tabs.value.findIndex(tab => tab.path === path)
    if (index > -1) {
      tabs.value.splice(index, 1)
      if (activeTab.value === path && tabs.value.length > 0) {
        const newIndex = Math.min(index, tabs.value.length - 1)
        activeTab.value = tabs.value[newIndex].path
        return activeTab.value
      }
    }
    return null
  }

  function setActiveTab(path) {
    activeTab.value = path
  }

  function closeOtherTabs(path) {
    tabs.value = tabs.value.filter(tab => tab.path === path)
    activeTab.value = path
  }

  function closeAllTabs() {
    tabs.value = []
    activeTab.value = ''
  }

  return {
    tabs,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
    closeOtherTabs,
    closeAllTabs
  }
})
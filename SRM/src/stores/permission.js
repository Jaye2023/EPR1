import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePermissionStore = defineStore('permission', () => {
  const roles = ref([])
  const permissions = ref([])
  const currentUserRoles = ref([])
  const currentUserPermissions = ref([])

  const roleTemplates = [
    { id: 'supplier_admin', name: '供应商主管理员', description: '子账号增删改、角色分配、企业信息维护、全部待办' },
    { id: 'quotation_clerk', name: '报价员', description: '查看询价、报价、谈判、投标' },
    { id: 'order_clerk', name: '订单专员', description: '订单确认、交期回复、发货通知、物流跟踪' },
    { id: 'finance_clerk', name: '财务对账员', description: '对账确认、发票上传/匹配、付款查询' },
    { id: 'quality_clerk', name: '质量专员', description: '质量整改、检验报告上传、异常反馈' },
    { id: 'read_only', name: '只读用户', description: '查看订单/合同/绩效，无操作权' }
  ]

  const permissionList = [
    { id: 'user_manage', name: '子账号管理', module: '用户管理' },
    { id: 'company_info', name: '企业信息修改', module: '企业管理' },
    { id: 'quotation', name: '报价/投标', module: '业务操作' },
    { id: 'order_confirm', name: '订单确认/发货', module: '业务操作' },
    { id: 'reconciliation', name: '对账/发票', module: '财务操作' },
    { id: 'contract_sign', name: '合同签署', module: '业务操作' },
    { id: 'quality_handle', name: '质量处理', module: '质量操作' },
    { id: 'view_order', name: '查看订单', module: '数据查看' },
    { id: 'view_contract', name: '查看合同', module: '数据查看' },
    { id: 'view_performance', name: '查看绩效', module: '数据查看' }
  ]

  const rolePermissions = {
    supplier_admin: ['user_manage', 'company_info', 'quotation', 'order_confirm', 'reconciliation', 'contract_sign', 'quality_handle', 'view_order', 'view_contract', 'view_performance'],
    quotation_clerk: ['quotation', 'view_order', 'view_contract'],
    order_clerk: ['order_confirm', 'view_order'],
    finance_clerk: ['reconciliation', 'view_contract'],
    quality_clerk: ['quality_handle'],
    read_only: ['view_order', 'view_contract', 'view_performance']
  }

  function initRoles() {
    roles.value = roleTemplates.map(r => ({
      ...r,
      permissions: rolePermissions[r.id] || []
    }))
  }

  function setCurrentUserRoles(userRoles) {
    currentUserRoles.value = userRoles
    const allPermissions = new Set()
    userRoles.forEach(roleId => {
      const perms = rolePermissions[roleId] || []
      perms.forEach(p => allPermissions.add(p))
    })
    currentUserPermissions.value = Array.from(allPermissions)
  }

  function hasPermission(permissionId) {
    return currentUserPermissions.value.includes(permissionId)
  }

  function hasRole(roleId) {
    return currentUserRoles.value.includes(roleId)
  }

  function getRoleById(roleId) {
    return roles.value.find(r => r.id === roleId)
  }

  function addRole(role) {
    const newRole = { ...role, id: role.id || `role_${Date.now()}`, permissions: role.permissions || [] }
    roles.value.push(newRole)
    rolePermissions[newRole.id] = newRole.permissions
    return newRole
  }

  function updateRole(roleId, updates) {
    const index = roles.value.findIndex(r => r.id === roleId)
    if (index !== -1) {
      roles.value[index] = { ...roles.value[index], ...updates }
      if (updates.permissions) {
        rolePermissions[roleId] = updates.permissions
      }
    }
  }

  function deleteRole(roleId) {
    roles.value = roles.value.filter(r => r.id !== roleId)
    delete rolePermissions[roleId]
  }

  return {
    roles,
    permissions: permissionList,
    currentUserRoles,
    currentUserPermissions,
    roleTemplates,
    rolePermissions,
    initRoles,
    setCurrentUserRoles,
    hasPermission,
    hasRole,
    getRoleById,
    addRole,
    updateRole,
    deleteRole
  }
})
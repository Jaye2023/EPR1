import axios from 'axios'
import { handleApiError } from '../utils/errorHandler'

const unifiedApi = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

unifiedApi.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    return { success: true, data: response.data }
  },
  error => {
    const normalized = handleApiError(error)
    return Promise.reject(normalized)
  }
)

export async function getSupplierAccounts(params = {}) {
  try {
    const response = await unifiedApi.get('/supplier-accounts', { params })
    return response
  } catch (error) {
    console.error('获取供应商账户列表失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getSupplierAccountById(id) {
  try {
    const response = await unifiedApi.get(`/supplier-accounts/${id}`)
    return response
  } catch (error) {
    console.error('获取供应商账户详情失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getSupplierAccountByEmail(email) {
  try {
    const response = await unifiedApi.get(`/supplier-accounts/email/${encodeURIComponent(email)}`)
    return response
  } catch (error) {
    console.error('获取供应商账户详情失败:', error)
    return { success: false, error: error.message }
  }
}

export async function createSupplierAccount(data) {
  try {
    const response = await unifiedApi.post('/supplier-accounts', data)
    return response
  } catch (error) {
    console.error('创建供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSupplierAccount(id, data) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}`, data)
    return response
  } catch (error) {
    console.error('更新供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteSupplierAccount(id) {
  try {
    const response = await unifiedApi.delete(`/supplier-accounts/${id}`)
    return response
  } catch (error) {
    console.error('删除供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function batchDeleteSupplierAccounts(ids) {
  try {
    const response = await unifiedApi.delete(`/supplier-accounts/batch/${ids.join(',')}`)
    return response
  } catch (error) {
    console.error('批量删除供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function reviewSupplierAccount(id, action, remark) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}/review`, { action, remark })
    return response
  } catch (error) {
    console.error('审核供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function freezeSupplierAccount(id, remark) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}/freeze`, { remark })
    return response
  } catch (error) {
    console.error('冻结供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function unfreezeSupplierAccount(id) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}/unfreeze`)
    return response
  } catch (error) {
    console.error('解冻供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function disableSupplierAccount(id, remark) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}/disable`, { remark })
    return response
  } catch (error) {
    console.error('禁用供应商账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function resetSupplierAccountPassword(id, newPassword) {
  try {
    const response = await unifiedApi.put(`/supplier-accounts/${id}/password`, { newPassword })
    return response
  } catch (error) {
    console.error('重置供应商账户密码失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getSupplierAccountStats() {
  try {
    const response = await unifiedApi.get('/supplier-accounts/stats')
    return response
  } catch (error) {
    console.error('获取供应商账户统计失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getSupplierSubAccounts(supplierAccountId) {
  try {
    const response = await unifiedApi.get(`/supplier-accounts/${supplierAccountId}/sub-accounts`)
    return response
  } catch (error) {
    console.error('获取供应商子账户列表失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getSupplierSubAccountById(id) {
  try {
    const response = await unifiedApi.get(`/supplier-sub-accounts/${id}`)
    return response
  } catch (error) {
    console.error('获取供应商子账户详情失败:', error)
    return { success: false, error: error.message }
  }
}

export async function createSupplierSubAccount(supplierAccountId, data) {
  try {
    const response = await unifiedApi.post(`/supplier-accounts/${supplierAccountId}/sub-accounts`, data)
    return response
  } catch (error) {
    console.error('创建供应商子账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSupplierSubAccount(id, data) {
  try {
    const response = await unifiedApi.put(`/supplier-sub-accounts/${id}`, data)
    return response
  } catch (error) {
    console.error('更新供应商子账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteSupplierSubAccount(id) {
  try {
    const response = await unifiedApi.delete(`/supplier-sub-accounts/${id}`)
    return response
  } catch (error) {
    console.error('删除供应商子账户失败:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSupplierSubAccountStatus(id, status) {
  try {
    const response = await unifiedApi.put(`/supplier-sub-accounts/${id}/status`, { status })
    return response
  } catch (error) {
    console.error('更新供应商子账户状态失败:', error)
    return { success: false, error: error.message }
  }
}

export async function checkUnifiedApi() {
  try {
    const response = await unifiedApi.get('/health')
    return response.success
  } catch (error) {
    return false
  }
}

export async function getSupplierProfiles(params = {}) {
  try {
    const response = await unifiedApi.get('/suppliers', { params })
    return response
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    return { success: false, error: error.message }
  }
}

export async function createSupplierProfile(data) {
  try {
    const response = await unifiedApi.post('/suppliers', data)
    return response
  } catch (error) {
    console.error('创建供应商失败:', error)
    return { success: false, error: error.message }
  }
}

export async function updateSupplierProfile(id, data) {
  try {
    const response = await unifiedApi.put(`/suppliers/${id}`, data)
    return response
  } catch (error) {
    console.error('更新供应商失败:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteSupplierProfile(id) {
  try {
    const response = await unifiedApi.delete(`/suppliers/${id}`)
    return response
  } catch (error) {
    console.error('删除供应商失败:', error)
    return { success: false, error: error.message }
  }
}

export async function certifySupplierProfile(id, data) {
  try {
    const response = await unifiedApi.put(`/suppliers/${id}/certify`, data)
    return response
  } catch (error) {
    console.error('认证供应商失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getPurchaseOrders(params = {}) {
  try {
    const response = await unifiedApi.get('/purchase-orders', { params })
    return response
  } catch (error) {
    console.error('获取采购订单失败:', error)
    return { success: false, error: error.message }
  }
}

export async function getMaterialsFromSQS(params = {}) {
  try {
    const response = await unifiedApi.get('/materials', { params })
    return response
  } catch (error) {
    console.error('获取 SQS 物料失败:', error)
    return { success: false, error: error.message }
  }
}

export default {
  getSupplierAccounts,
  getSupplierAccountById,
  getSupplierAccountByEmail,
  createSupplierAccount,
  updateSupplierAccount,
  deleteSupplierAccount,
  batchDeleteSupplierAccounts,
  reviewSupplierAccount,
  freezeSupplierAccount,
  unfreezeSupplierAccount,
  disableSupplierAccount,
  resetSupplierAccountPassword,
  getSupplierAccountStats,
  getSupplierSubAccounts,
  getSupplierSubAccountById,
  createSupplierSubAccount,
  updateSupplierSubAccount,
  deleteSupplierSubAccount,
  updateSupplierSubAccountStatus,
  checkUnifiedApi,
  getSupplierProfiles,
  createSupplierProfile,
  updateSupplierProfile,
  deleteSupplierProfile,
  certifySupplierProfile,
  getPurchaseOrders,
  getMaterialsFromSQS
}
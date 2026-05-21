import axios from 'axios'
import { normalizeError, getErrorMessage } from '../utils/errorHandler'

const unifiedApi = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

let dbAvailable = false

unifiedApi.interceptors.response.use(
  response => {
    if (response.data && typeof response.data === 'object') {
      return response.data
    }
    return { success: true, data: response.data }
  },
  error => {
    const normalized = normalizeError(error)
    console.warn('统一API请求失败:', getErrorMessage(normalized))
    return Promise.reject(normalized)
  }
)

export async function checkUnifiedApi() {
  try {
    const response = await unifiedApi.get('/health')
    dbAvailable = response.success
    return dbAvailable
  } catch (error) {
    dbAvailable = false
    return false
  }
}

export function isDbAvailable() {
  return dbAvailable
}

export function getUnifiedApi() {
  return unifiedApi
}

export default { checkUnifiedApi, isDbAvailable, getUnifiedApi }
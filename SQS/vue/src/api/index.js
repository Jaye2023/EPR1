import axios from 'axios'

const createApi = () => {
  const api = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })

  api.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    error => {
      return Promise.reject(error)
    }
  )

  api.interceptors.response.use(
    response => response.data,
    error => {
      const message = error.response?.data?.error || error.response?.data?.message || error.message || '请求失败'
      
      if (message.includes('会话已过期') || message.includes('登录') || error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('currentUser')
        window.location.href = '/login'
        return Promise.reject(new Error('会话已过期，请重新登录'))
      }
      
      return Promise.reject(new Error(message))
    }
  )

  return api
}

export const api = createApi()

export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  validate: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  getUsers: () => api.get('/auth/users'),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`),
  resetPassword: (id, newPassword) => api.put(`/auth/users/${id}/password`, { newPassword }),
  getCurrentUser: async () => {
    try {
      const cached = localStorage.getItem('currentUser')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {
          localStorage.removeItem('currentUser')
        }
      }
      const user = await api.get('/auth/me')
      if (user && typeof user === 'object') {
        localStorage.setItem('currentUser', JSON.stringify(user))
      }
      return user
    } catch (error) {
      console.error('获取当前用户失败:', error)
      return null
    }
  }
}

export const productsApi = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  getByItemNumber: (materialCode) => api.get(`/products/item/${encodeURIComponent(materialCode)}`),
  search: (keyword) => api.get('/products/search', { params: { q: keyword } }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  batchDelete: (ids) => api.delete(`/products/batch/${ids.join(',')}`),
  parse: (description) => api.post('/products/parse', { description }),
  calculatePrice: (params) => api.post('/products/calculate-price', params),
  calculate: (id) => api.post(`/products/${id}/calculate`),
  calculateAll: () => api.post('/products/calculate-all'),
  generateCode: (params) => api.post('/products/generate-code', params)
}

export const quotesApi = {
  list: (params) => api.get('/quotes', { params }),
  get: (id) => api.get(`/quotes/${id}?_=${Date.now()}`),
  create: (data) => api.post('/quotes', data),
  update: (id, data) => api.put(`/quotes/${id}`, data),
  delete: (id) => api.delete(`/quotes/${id}`),
  batchDelete: (ids) => api.delete(`/quotes/batch/${ids.join(',')}`),
  copy: (id) => api.post(`/quotes/${id}/copy`),
  getNextNumber: () => api.get('/quotes/next-number'),
  getQuoteItems: (quoteId) => api.get(`/quotes/${quoteId}/items`),
  updateQuoteItems: (quoteId, items) => api.put(`/quotes/${quoteId}/items`, { items })
}

export const customersApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  batchDelete: (ids) => api.delete(`/customers/batch/${ids.join(',')}`),
  search: (keyword) => api.get('/customers/search', { params: { keyword } })
}

export const wireSpecsApi = {
  list: (params) => api.get('/wire-specs', { params }),
  get: (spec) => api.get(`/wire-specs/${encodeURIComponent(spec)}`),
  create: (data) => api.post('/wire-specs', data),
  update: (spec, data) => api.put(`/wire-specs/${encodeURIComponent(spec)}`, data),
  delete: (spec) => api.delete(`/wire-specs/${encodeURIComponent(spec)}`),
  batchDelete: (specs) => api.delete(`/wire-specs/batch/${specs.map(s => encodeURIComponent(s)).join(',')}`),
  batchUpdate: (data) => api.post('/wire-specs/batch-update', data),
  calculate: (spec, wireType, materialType) => api.post('/wire-specs/calculate', { spec, copperWeight: 0, materialWeight: 0, fillerWeight: 0, wireType, materialType }),
  calculateAll: () => api.post('/wire-specs/calculate-all'),
  syncCopperPrice: () => api.post('/wire-specs/sync-copper-price'),
  getCopperPriceInfo: () => api.get('/wire-specs/copper-price-info'),
  exportCsv: () => api.get('/wire-specs/export/csv', { responseType: 'text' }),
  import: (formData) => api.post('/wire-specs/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const plugsApi = {
  list: (params) => api.get('/plugs', { params }),
  getAll: () => api.get('/plugs/all'),
  get: (id) => api.get(`/plugs/${id}`),
  create: (data) => api.post('/plugs', data),
  update: (id, data) => api.put(`/plugs/${id}`, data),
  delete: (id) => api.delete(`/plugs/${id}`),
  batchDelete: (ids) => api.delete(`/plugs/batch/${ids.join(',')}`),
  import: (formData) => api.post('/plugs/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const tailProcessingsApi = {
  list: (params) => api.get('/tail-processings', { params }),
  get: (id) => api.get(`/tail-processings/${id}`),
  create: (data) => api.post('/tail-processings', data),
  update: (id, data) => api.put(`/tail-processings/${id}`, data),
  delete: (id) => api.delete(`/tail-processings/${id}`),
  batchDelete: (ids) => api.delete(`/tail-processings/batch/${ids.join(',')}`),
  exportCsv: () => api.get('/tail-processings/export/csv', { responseType: 'blob' }),
  import: (formData) => api.post('/tail-processings/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data)
}

export const rolesApi = {
  getPermissions: () => api.get('/roles/permissions'),
  getRoles: () => api.get('/roles/roles'),
  createRole: (data) => api.post('/roles/roles', data),
  updateRole: (id, data) => api.put(`/roles/roles/${id}`, data),
  deleteRole: (id) => api.delete(`/roles/roles/${id}`)
}

export const salespersonsApi = {
  list: (params) => api.get('/salespersons', { params }),
  get: (id) => api.get(`/salespersons/${id}`),
  create: (data) => api.post('/salespersons', data),
  update: (id, data) => api.put(`/salespersons/${id}`, data),
  delete: (id) => api.delete(`/salespersons/${id}`),
  batchDelete: (ids) => api.delete(`/salespersons/batch/${ids.join(',')}`)
}

import axios from 'axios'

const unifiedApi = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

unifiedApi.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.error || error.message || '统一API请求失败'
    return Promise.reject(new Error(message))
  }
)

export const unifiedMaterialsApi = {
  list: (params) => unifiedApi.get('/materials', { params }),
  get: (code) => unifiedApi.get(`/materials/${code}`),
  create: (data) => unifiedApi.post('/materials', data),
  update: (id, data) => unifiedApi.put(`/materials/${id}`, data),
  delete: (id) => unifiedApi.delete(`/materials/${id}`)
}

export const unifiedCustomersApi = {
  list: (params) => unifiedApi.get('/customers', { params }),
  get: (id) => unifiedApi.get(`/customers/${id}`),
  create: (data) => unifiedApi.post('/customers', data),
  update: (id, data) => unifiedApi.put(`/customers/${id}`, data),
  delete: (id) => unifiedApi.delete(`/customers/${id}`)
}

export const unifiedSuppliersApi = {
  list: (params) => unifiedApi.get('/suppliers', { params }),
  get: (id) => unifiedApi.get(`/suppliers/${id}`),
  create: (data) => unifiedApi.post('/suppliers', data),
  update: (id, data) => unifiedApi.put(`/suppliers/${id}`, data),
  delete: (id) => unifiedApi.delete(`/suppliers/${id}`)
}

export const unifiedWireSpecsApi = {
  list: (params) => unifiedApi.get('/wire-specs', { params })
}

export const unifiedPlugsApi = {
  list: (params) => unifiedApi.get('/plugs', { params })
}

export const unifiedTailProcessingsApi = {
  list: (params) => unifiedApi.get('/tail-processings', { params })
}

export const unifiedInventoryApi = {
  list: (params) => unifiedApi.get('/inventory', { params })
}

export const unifiedQuotesApi = {
  list: (params) => unifiedApi.get('/quotes', { params }),
  get: (id) => unifiedApi.get(`/quotes/${id}`)
}

export default {
  materials: unifiedMaterialsApi,
  customers: unifiedCustomersApi,
  suppliers: unifiedSuppliersApi,
  wireSpecs: unifiedWireSpecsApi,
  plugs: unifiedPlugsApi,
  tailProcessings: unifiedTailProcessingsApi,
  inventory: unifiedInventoryApi,
  quotes: unifiedQuotesApi
}
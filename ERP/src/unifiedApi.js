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

export const unifiedApiMaterials = {
  list: (params) => unifiedApi.get('/materials', { params }),
  get: (code) => unifiedApi.get(`/materials/${code}`),
  create: (data) => unifiedApi.post('/materials', data),
  update: (id, data) => unifiedApi.put(`/materials/${id}`, data),
  delete: (id) => unifiedApi.delete(`/materials/${id}`)
}

export const unifiedApiCustomers = {
  list: (params) => unifiedApi.get('/customers', { params }),
  get: (id) => unifiedApi.get(`/customers/${id}`),
  create: (data) => unifiedApi.post('/customers', data),
  update: (id, data) => unifiedApi.put(`/customers/${id}`, data),
  delete: (id) => unifiedApi.delete(`/customers/${id}`)
}

export const unifiedApiSuppliers = {
  list: (params) => unifiedApi.get('/suppliers', { params }),
  get: (id) => unifiedApi.get(`/suppliers/${id}`),
  create: (data) => unifiedApi.post('/suppliers', data),
  update: (id, data) => unifiedApi.put(`/suppliers/${id}`, data),
  delete: (id) => unifiedApi.delete(`/suppliers/${id}`)
}

export const unifiedApiInventory = {
  list: (params) => unifiedApi.get('/inventory', { params })
}

export const unifiedApiWireSpecs = {
  list: (params) => unifiedApi.get('/wire-specs', { params })
}

export const unifiedApiPlugs = {
  list: (params) => unifiedApi.get('/plugs', { params })
}

export const unifiedApiTailProcessings = {
  list: (params) => unifiedApi.get('/tail-processings', { params })
}

export default {
  api: unifiedApi,
  materials: unifiedApiMaterials,
  customers: unifiedApiCustomers,
  suppliers: unifiedApiSuppliers,
  inventory: unifiedApiInventory,
  wireSpecs: unifiedApiWireSpecs,
  plugs: unifiedApiPlugs,
  tailProcessings: unifiedApiTailProcessings
}
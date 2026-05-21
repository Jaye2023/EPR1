import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, permission: null }
  },
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { permission: null }
      },
      {
        path: 'materials',
        name: 'materials',
        component: () => import('../views/Products.vue'),
        meta: { permission: 'product_view' }
      },
      {
        path: 'quotes',
        name: 'quotes',
        component: () => import('../views/Quotes.vue'),
        meta: { permission: 'quote_view' }
      },
      {
        path: 'quotes/new',
        name: 'quote-new',
        component: () => import('../views/QuoteCreate.vue'),
        meta: { permission: 'quote_create' }
      },
      {
        path: 'quotes/:id',
        name: 'quote-detail',
        component: () => import('../views/QuoteDetail.vue'),
        meta: { permission: 'quote_view' }
      },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('../views/Customers.vue'),
        meta: { permission: 'customer_view' }
      },
      {
        path: 'wire-specs',
        name: 'wire-specs',
        component: () => import('../views/WireSpecs.vue'),
        meta: { permission: 'wire_spec_view' }
      },
      {
        path: 'plugs',
        name: 'plugs',
        component: () => import('../views/Plugs.vue'),
        meta: { permission: 'plug_view' }
      },
      {
        path: 'tail-processings',
        name: 'tail-processings',
        component: () => import('../views/TailProcessings.vue'),
        meta: { permission: 'tail_processing_view' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/Settings.vue'),
        meta: { permission: ['system_settings', 'salesperson_manage', 'role_manage', 'user_manage'] }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    const isValid = await authStore.validateToken()
    if (!isValid && to.meta.requiresAuth !== false) {
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'dashboard' })
    return
  }

  if (to.meta.permission && authStore.isAuthenticated) {
    const permissions = Array.isArray(to.meta.permission) ? to.meta.permission : [to.meta.permission]
    const hasAnyPermission = permissions.some(p => authStore.hasPermission(p))
    if (!hasAnyPermission) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router

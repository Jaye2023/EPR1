import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: '/',
        name: 'home',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: '/inventory',
        name: 'inventory',
        component: () => import('../views/Inventory.vue')
      },
      {
        path: '/orders',
        name: 'orders',
        component: () => import('../views/Orders.vue')
      },
      {
        path: '/finance',
        name: 'finance',
        component: () => import('../views/Finance.vue')
      },
      {
        path: '/hr',
        name: 'hr',
        component: () => import('../views/HR.vue')
      },
      {
        path: '/settings',
        name: 'settings',
        component: () => import('../views/Settings.vue')
      },
      {
        path: '/hr',
        name: 'hr',
        component: () => import('../views/HR.vue')
      },
      {
        path: '/customers',
        name: 'customers',
        component: () => import('../views/Customers.vue')
      },
      {
        path: '/prices',
        name: 'prices',
        component: () => import('../views/Prices.vue')
      },
      {
        path: '/copper-price',
        name: 'copperPrice',
        component: () => import('../views/CopperPrice.vue')
      },
      {
        path: '/alerts',
        name: 'alerts',
        component: () => import('../views/Alerts.vue')
      },
      {
        path: '/production',
        name: 'production',
        component: () => import('../views/Production.vue')
      },
      {
        path: '/finance',
        name: 'finance',
        component: () => import('../views/Finance.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
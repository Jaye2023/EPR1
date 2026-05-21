import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/supplier-login',
    name: 'supplierLogin',
    component: () => import('../views/SupplierLogin.vue')
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: '/supplier-accounts',
        name: 'supplierAccounts',
        component: () => import('../views/SupplierAccounts.vue')
      },
      {
        path: '/suppliers',
        name: 'suppliers',
        component: () => import('../views/Suppliers.vue')
      },
      {
        path: '/supplier-profile',
        name: 'supplierProfile',
        component: () => import('../views/SupplierProfile.vue')
      },
      {
        path: '/supplier-orders',
        name: 'supplierOrders',
        component: () => import('../views/SupplierOrders.vue')
      },
      {
        path: '/purchase',
        name: 'purchase',
        component: () => import('../views/Purchase.vue')
      },
      {
        path: '/contracts',
        name: 'contracts',
        component: () => import('../views/Contracts.vue')
      },
      {
        path: '/performance',
        name: 'performance',
        component: () => import('../views/Performance.vue')
      },
      {
        path: '/table-demo',
        name: 'tableDemo',
        component: () => import('../views/TableDemo.vue')
      },
      {
        path: '/user-management',
        name: 'userManagement',
        component: () => import('../views/UserManagement.vue')
      },
      {
        path: '/role-management',
        name: 'roleManagement',
        component: () => import('../views/RoleManagement.vue')
      },
      {
        path: '/sync-monitor',
        name: 'syncMonitor',
        component: () => import('../views/SyncMonitor.vue')
      },
      {
        path: '/sync-config',
        name: 'syncConfig',
        component: () => import('../views/SyncConfig.vue')
      },
      {
        path: '/reconciliation',
        name: 'reconciliation',
        component: () => import('../views/Reconciliation.vue')
      },
      {
        path: '/asn-management',
        name: 'asnManagement',
        component: () => import('../views/AsnManagement.vue')
      },
      {
        path: '/delivery-appointment',
        name: 'deliveryAppointment',
        component: () => import('../views/DeliveryAppointment.vue')
      },
      {
        path: '/in-transit-tracking',
        name: 'inTransitTracking',
        component: () => import('../views/InTransitTracking.vue')
      },
      {
        path: '/logistics-report',
        name: 'logisticsReport',
        component: () => import('../views/LogisticsReport.vue')
      },
      {
        path: '/system',
        name: 'systemManagement',
        component: () => import('../views/SystemManagement.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
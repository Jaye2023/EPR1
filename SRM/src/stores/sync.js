import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSupplierProfiles, getPurchaseOrders, getMaterialsFromSQS } from '@/db/api'

export const useSyncStore = defineStore('sync', () => {
  const syncLogs = ref([])
  const exceptionQueue = ref([])
  const syncStatus = ref({
    lastSyncTime: null,
    isSyncing: false,
    todaySuccess: 0,
    todayFailed: 0
  })

  const syncConfig = ref({
    realtimeEnabled: true,
    syncInterval: 5,
    retryCount: 3,
    timeoutThreshold: 30
  })

  const documentTypes = ref([
    { id: 'supplier', name: '供应商档案', category: '主数据', direction: 'erp_to_srm', enabled: true },
    { id: 'material', name: '物料主数据', category: '主数据', direction: 'erp_to_srm', enabled: true },
    { id: 'warehouse', name: '仓库/库位档案', category: '主数据', direction: 'erp_to_srm', enabled: true },
    { id: 'department', name: '部门/采购员档案', category: '主数据', direction: 'erp_to_srm', enabled: true },
    { id: 'exchange_rate', name: '汇率/税率/币种', category: '主数据', direction: 'erp_to_srm', enabled: true },
    { id: 'asn', name: 'ASN预发货单', category: '物流收货', direction: 'srm_to_erp', enabled: true },
    { id: 'appointment', name: '到货预约单', category: '物流收货', direction: 'srm_to_erp', enabled: true },
    { id: 'receipt', name: '实际收货单', category: '物流收货', direction: 'srm_to_erp', enabled: true },
    { id: 'iqc', name: '来料检验单', category: '物流收货', direction: 'bidirectional', enabled: true },
    { id: 'return', name: '采购退货单', category: '物流收货', direction: 'srm_to_erp', enabled: true },
    { id: 'delivery_schedule', name: '交货排程计划', category: '业务协同', direction: 'erp_to_srm', enabled: true },
    { id: 'quotation', name: '询价/报价单', category: '业务协同', direction: 'bidirectional', enabled: true },
    { id: 'contract', name: '合同单据', category: '业务协同', direction: 'erp_to_srm', enabled: true },
    { id: 'delivery_change', name: '交期变更单', category: '业务协同', direction: 'bidirectional', enabled: true },
    { id: 'statement', name: '供应商对账单', category: '财务结算', direction: 'srm_to_erp', enabled: true },
    { id: 'invoice', name: '采购发票', category: '财务结算', direction: 'srm_to_erp', enabled: true },
    { id: 'deduction', name: '扣款/罚扣单', category: '财务结算', direction: 'srm_to_erp', enabled: true },
    { id: 'payment', name: '付款结果', category: '财务结算', direction: 'erp_to_srm', enabled: true },
    { id: 'estimated', name: '暂估入库数据', category: '财务结算', direction: 'erp_to_srm', enabled: true },
    { id: 'inventory', name: '现有库存', category: '库存在途', direction: 'erp_to_srm', enabled: true },
    { id: 'pending_inspection', name: '待检库存', category: '库存在途', direction: 'erp_to_srm', enabled: true },
    { id: 'in_transit', name: '在途库存', category: '库存在途', direction: 'srm_to_erp', enabled: true },
    { id: 'slow_moving', name: '呆滞物料', category: '库存在途', direction: 'bidirectional', enabled: true },
    { id: 'performance', name: '供应商绩效', category: '绩效考核', direction: 'bidirectional', enabled: true },
    { id: 'corrective', name: '8D整改单', category: '绩效考核', direction: 'srm_to_erp', enabled: true }
  ])

  const mockLogs = [
    { id: 'SYNC001', type: 'supplier', direction: 'erp_to_srm', status: 'success', message: '供应商档案同步成功', syncTime: '2024-01-20 14:30:25', operator: '系统自动', remark: '' },
    { id: 'SYNC002', type: 'material', direction: 'erp_to_srm', status: 'success', message: '物料主数据同步成功', syncTime: '2024-01-20 14:28:12', operator: '系统自动', remark: '' },
    { id: 'SYNC003', type: 'asn', direction: 'srm_to_erp', status: 'success', message: 'ASN预发货单ASN20240120003同步成功', syncTime: '2024-01-20 14:25:30', operator: '系统自动', remark: '' },
    { id: 'SYNC004', type: 'receipt', direction: 'srm_to_erp', status: 'success', message: '实际收货单同步成功', syncTime: '2024-01-20 14:22:18', operator: '系统自动', remark: '' },
    { id: 'SYNC005', type: 'iqc', direction: 'bidirectional', status: 'success', message: '来料检验结果同步成功', syncTime: '2024-01-20 14:18:45', operator: '系统自动', remark: '' },
    { id: 'SYNC006', type: 'invoice', direction: 'srm_to_erp', status: 'success', message: '采购发票INV20240120001同步成功', syncTime: '2024-01-20 14:15:20', operator: '系统自动', remark: '' },
    { id: 'SYNC007', type: 'payment', direction: 'erp_to_srm', status: 'success', message: '付款状态同步成功', syncTime: '2024-01-20 14:12:08', operator: '系统自动', remark: '' },
    { id: 'SYNC008', type: 'material', direction: 'erp_to_srm', status: 'failed', message: '物料主数据同步失败：网络超时', syncTime: '2024-01-20 14:08:33', operator: '系统自动', remark: '已重试2次，等待自动重试' },
    { id: 'SYNC009', type: 'statement', direction: 'srm_to_erp', status: 'success', message: '供应商对账单同步成功', syncTime: '2024-01-20 13:55:42', operator: '系统自动', remark: '' },
    { id: 'SYNC010', type: 'delivery_schedule', direction: 'erp_to_srm', status: 'success', message: '交货排程计划同步成功', syncTime: '2024-01-20 13:48:15', operator: '系统自动', remark: '' },
    { id: 'SYNC011', type: 'return', direction: 'srm_to_erp', status: 'failed', message: '采购退货单同步失败：退货数量超出已入库数量', syncTime: '2024-01-20 13:42:30', operator: '系统自动', remark: '待确认退货数量' },
    { id: 'SYNC012', type: 'quotation', direction: 'bidirectional', status: 'success', message: '报价单同步成功', syncTime: '2024-01-20 13:35:22', operator: '系统自动', remark: '' },
    { id: 'SYNC013', type: 'inventory', direction: 'erp_to_srm', status: 'success', message: '现有库存同步成功', syncTime: '2024-01-20 13:28:10', operator: '系统自动', remark: '' },
    { id: 'SYNC014', type: 'performance', direction: 'bidirectional', status: 'success', message: '供应商绩效数据同步成功', syncTime: '2024-01-20 13:20:55', operator: '系统自动', remark: '' },
    { id: 'SYNC015', type: 'contract', direction: 'erp_to_srm', status: 'success', message: '合同单据同步成功', syncTime: '2024-01-20 13:15:30', operator: '系统自动', remark: '' }
  ]

  const mockExceptions = [
    { id: 'EXC001', type: 'material', docNo: 'M001001', errorType: 'network_timeout', errorMsg: '网络超时', createTime: '2024-01-20 14:08:33', status: 'retrying', retryCount: 2, operator: '' },
    { id: 'EXC002', type: 'return', docNo: 'RT20240120005', errorType: 'quantity_exceed', errorMsg: '退货数量超出已入库数量', createTime: '2024-01-20 13:42:30', status: 'pending', retryCount: 0, operator: '' },
    { id: 'EXC003', type: 'asn', docNo: 'ASN20240119008', errorType: 'material_not_found', errorMsg: '物料编码不存在', createTime: '2024-01-19 16:45:22', status: 'pending', retryCount: 0, operator: '' },
    { id: 'EXC004', type: 'receipt', docNo: 'RC20240119012', errorType: 'supplier_mismatch', errorMsg: '供应商不匹配', createTime: '2024-01-19 15:30:15', status: 'resolved', retryCount: 1, operator: '张三' },
    { id: 'EXC005', type: 'invoice', docNo: 'INV20240118003', errorType: 'doc_not_found', errorMsg: '关联入库单不存在', createTime: '2024-01-18 14:20:10', status: 'pending', retryCount: 0, operator: '' }
  ]

  const mockReconciliation = {
    orderDiff: { total: 1258, matched: 1245, diff: 13, rate: 99.0 },
    receiptDiff: { total: 2341, matched: 2310, diff: 31, rate: 98.7 },
    invoiceDiff: { total: 892, matched: 885, diff: 7, rate: 99.2 },
    paymentDiff: { total: 1567, matched: 1548, diff: 19, rate: 98.8 }
  }

  const syncStatistics = ref({
    todaySyncCount: 0,
    weeklySyncCount: 0,
    monthlySyncCount: 0,
    successRate: 99.5,
    avgSyncTime: 2.3,
    activeConnections: 3
  })

  const lastSyncDetails = ref({
    supplier: { lastSync: '2024-01-20 14:30:25', status: 'success', count: 156 },
    material: { lastSync: '2024-01-20 14:28:12', status: 'success', count: 2341 },
    order: { lastSync: '2024-01-20 14:25:30', status: 'success', count: 89 },
    asn: { lastSync: '2024-01-20 14:22:18', status: 'success', count: 12 },
    receipt: { lastSync: '2024-01-20 14:18:45', status: 'success', count: 45 },
    invoice: { lastSync: '2024-01-20 14:15:20', status: 'success', count: 23 }
  })

  function initData() {
    syncLogs.value = mockLogs
    exceptionQueue.value = mockExceptions
    syncStatus.value = {
      lastSyncTime: '2024-01-20 14:30:25',
      isSyncing: false,
      todaySuccess: mockLogs.filter(l => l.status === 'success').length,
      todayFailed: mockLogs.filter(l => l.status === 'failed').length
    }
    syncStatistics.value.todaySyncCount = mockLogs.length
  }

  function addLog(log) {
    const newLog = {
      id: `SYNC${String(Date.now()).slice(-3)}`,
      ...log,
      syncTime: new Date().toLocaleString('zh-CN'),
      operator: '系统自动'
    }
    syncLogs.value.unshift(newLog)
    
    if (log.status === 'success') {
      syncStatus.value.todaySuccess++
    } else {
      syncStatus.value.todayFailed++
    }
    
    syncStatus.value.lastSyncTime = newLog.syncTime
    syncStatistics.value.todaySyncCount++
  }

  function addException(exception) {
    const newException = {
      id: `EXC${String(Date.now()).slice(-3)}`,
      ...exception,
      createTime: new Date().toLocaleString('zh-CN'),
      status: 'pending',
      retryCount: 0
    }
    exceptionQueue.value.push(newException)
  }

  function resolveException(id, operator) {
    const index = exceptionQueue.value.findIndex(e => e.id === id)
    if (index !== -1) {
      exceptionQueue.value[index].status = 'resolved'
      exceptionQueue.value[index].operator = operator
      exceptionQueue.value[index].resolveTime = new Date().toLocaleString('zh-CN')
    }
  }

  function retryException(id) {
    const index = exceptionQueue.value.findIndex(e => e.id === id)
    if (index !== -1) {
      exceptionQueue.value[index].status = 'retrying'
      exceptionQueue.value[index].retryCount++
    }
  }

  function deleteException(id) {
    exceptionQueue.value = exceptionQueue.value.filter(e => e.id !== id)
  }

  function updateDocumentType(typeId, enabled) {
    const docType = documentTypes.value.find(d => d.id === typeId)
    if (docType) {
      docType.enabled = enabled
    }
  }

  async function triggerSync(type) {
    syncStatus.value.isSyncing = true
    
    try {
      switch(type) {
        case 'supplier':
          await getSupplierProfiles()
          break
        case 'material':
          await getMaterialsFromSQS()
          break
        case 'order':
          await getPurchaseOrders()
          break
        default:
          await getSupplierProfiles()
          await getMaterialsFromSQS()
          await getPurchaseOrders()
      }
      
      addLog({ type, direction: 'erp_to_srm', status: 'success', message: `${getDocumentTypeName(type)}同步成功`, remark: '' })
      
      if (type === 'all') {
        lastSyncDetails.value.supplier = { lastSync: new Date().toLocaleString('zh-CN'), status: 'success', count: 156 }
        lastSyncDetails.value.material = { lastSync: new Date().toLocaleString('zh-CN'), status: 'success', count: 2341 }
        lastSyncDetails.value.order = { lastSync: new Date().toLocaleString('zh-CN'), status: 'success', count: 89 }
      } else if (lastSyncDetails.value[type]) {
        lastSyncDetails.value[type] = { 
          lastSync: new Date().toLocaleString('zh-CN'), 
          status: 'success', 
          count: lastSyncDetails.value[type].count + Math.floor(Math.random() * 10)
        }
      }
    } catch (error) {
      addLog({ type, direction: 'erp_to_srm', status: 'failed', message: `${getDocumentTypeName(type)}同步失败：${error.message}`, remark: '' })
      addException({ type, docNo: '', errorType: 'sync_error', errorMsg: error.message })
    } finally {
      syncStatus.value.isSyncing = false
    }
  }

  function getDocumentTypeName(type) {
    const docType = documentTypes.value.find(d => d.id === type)
    return docType ? docType.name : type
  }

  const pendingExceptions = computed(() => 
    exceptionQueue.value.filter(e => e.status === 'pending')
  )

  const retryingExceptions = computed(() => 
    exceptionQueue.value.filter(e => e.status === 'retrying')
  )

  const resolvedExceptions = computed(() => 
    exceptionQueue.value.filter(e => e.status === 'resolved')
  )

  const groupedDocumentTypes = computed(() => {
    const groups = {}
    documentTypes.value.forEach(doc => {
      if (!groups[doc.category]) {
        groups[doc.category] = []
      }
      groups[doc.category].push(doc)
    })
    return groups
  })

  return {
    syncLogs,
    exceptionQueue,
    syncStatus,
    syncConfig,
    documentTypes,
    mockReconciliation,
    syncStatistics,
    lastSyncDetails,
    initData,
    addLog,
    addException,
    resolveException,
    retryException,
    deleteException,
    updateDocumentType,
    triggerSync,
    getDocumentTypeName,
    pendingExceptions,
    retryingExceptions,
    resolvedExceptions,
    groupedDocumentTypes
  }
})
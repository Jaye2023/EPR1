<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>数据同步监控</h1>
        <p>SRM与ERP数据同步状态实时监控</p>
      </div>
      <div class="header-icon">
        <el-icon><Refresh /></el-icon>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card success">
        <div class="stat-icon">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ syncStatus.todaySuccess }}</p>
          <p class="stat-label">今日成功</p>
        </div>
      </el-card>
      <el-card class="stat-card warning">
        <div class="stat-icon">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ syncStatus.todayFailed }}</p>
          <p class="stat-label">今日失败</p>
        </div>
      </el-card>
      <el-card class="stat-card info">
        <div class="stat-icon">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ syncStatus.lastSyncTime || '--' }}</p>
          <p class="stat-label">最后同步时间</p>
        </div>
      </el-card>
      <el-card class="stat-card danger">
        <div class="stat-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ pendingExceptions.length }}</p>
          <p class="stat-label">待处理异常</p>
        </div>
      </el-card>
    </div>

    <el-card class="content-card">
      <div class="card-header">
        <h3>同步日志</h3>
        <div class="filter-bar">
          <el-select v-model="logFilter.type" placeholder="单据类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="供应商档案" value="supplier" />
            <el-option label="物料主数据" value="material" />
            <el-option label="仓库/库位档案" value="warehouse" />
            <el-option label="部门/采购员档案" value="department" />
            <el-option label="汇率/税率/币种" value="exchange_rate" />
            <el-option label="ASN预发货单" value="asn" />
            <el-option label="到货预约单" value="appointment" />
            <el-option label="实际收货单" value="receipt" />
            <el-option label="来料检验单" value="iqc" />
            <el-option label="采购退货单" value="return" />
            <el-option label="交货排程计划" value="delivery_schedule" />
            <el-option label="询价/报价单" value="quotation" />
            <el-option label="合同单据" value="contract" />
            <el-option label="交期变更单" value="delivery_change" />
            <el-option label="供应商对账单" value="statement" />
            <el-option label="采购发票" value="invoice" />
            <el-option label="扣款/罚扣单" value="deduction" />
            <el-option label="付款结果" value="payment" />
            <el-option label="暂估入库数据" value="estimated" />
            <el-option label="现有库存" value="inventory" />
            <el-option label="待检库存" value="pending_inspection" />
            <el-option label="在途库存" value="in_transit" />
            <el-option label="呆滞物料" value="slow_moving" />
            <el-option label="供应商绩效" value="performance" />
            <el-option label="8D整改单" value="corrective" />
          </el-select>
          <el-select v-model="logFilter.status" placeholder="同步状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
          <el-select v-model="logFilter.direction" placeholder="同步方向" clearable>
            <el-option label="全部" value="" />
            <el-option label="ERP→SRM" value="erp_to_srm" />
            <el-option label="SRM→ERP" value="srm_to_erp" />
            <el-option label="双向同步" value="bidirectional" />
          </el-select>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="filteredLogs" border style="width: 100%">
          <el-table-column prop="id" label="同步ID" width="100" />
          <el-table-column prop="type" label="单据类型" width="100">
            <template #default="{ row }">{{ getTypeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column prop="direction" label="方向" width="110">
            <template #default="{ row }">
              <el-tag :type="getDirectionTagType(row.direction)">
                {{ getDirectionLabel(row.direction) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="message" label="同步信息" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <span :class="`status-badge status-${row.status}`">
                {{ row.status === 'success' ? '成功' : '失败' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="syncTime" label="同步时间" width="150" />
          <el-table-column prop="remark" label="备注" />
        </el-table>
      </div>
    </el-card>

    <el-card class="content-card">
      <div class="card-header">
        <h3>异常队列</h3>
        <div class="tab-bar">
          <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane label="待处理" name="pending">
              <span class="tab-badge pending">{{ pendingExceptions.length }}</span>
            </el-tab-pane>
            <el-tab-pane label="重试中" name="retrying">
              <span class="tab-badge retrying">{{ retryingExceptions.length }}</span>
            </el-tab-pane>
            <el-tab-pane label="已解决" name="resolved">
              <span class="tab-badge resolved">{{ resolvedExceptions.length }}</span>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="currentExceptions" border style="width: 100%">
          <el-table-column prop="id" label="异常ID" width="100" />
          <el-table-column prop="type" label="单据类型" width="100">
            <template #default="{ row }">{{ getTypeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column prop="docNo" label="单据编号" width="140" />
          <el-table-column prop="errorType" label="错误类型" width="120">
            <template #default="{ row }">{{ getErrorLabel(row.errorType) }}</template>
          </el-table-column>
          <el-table-column prop="errorMsg" label="错误信息" />
          <el-table-column prop="retryCount" label="重试次数" width="80" />
          <el-table-column prop="createTime" label="创建时间" width="150" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <span :class="`status-badge status-${row.status}`">
                {{ getStatusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button v-if="row.status !== 'resolved'" type="primary" link size="small" @click="handleRetry(row)">重试</el-button>
                <el-button v-if="row.status !== 'resolved'" type="success" link size="small" @click="handleResolve(row)">标记解决</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, CircleCheck, CircleClose, Clock, Warning } from '@element-plus/icons-vue'
import { useSyncStore } from '../stores/sync'

const syncStore = useSyncStore()
const activeTab = ref('pending')

const logFilter = reactive({
  type: '',
  status: '',
  direction: ''
})

const syncStatus = computed(() => syncStore.syncStatus)
const pendingExceptions = computed(() => syncStore.pendingExceptions)
const retryingExceptions = computed(() => syncStore.retryingExceptions)
const resolvedExceptions = computed(() => syncStore.resolvedExceptions)

const filteredLogs = computed(() => {
  return syncStore.syncLogs.filter(log => {
    if (logFilter.type && log.type !== logFilter.type) return false
    if (logFilter.status && log.status !== logFilter.status) return false
    if (logFilter.direction && log.direction !== logFilter.direction) return false
    return true
  })
})

const currentExceptions = computed(() => {
  switch (activeTab.value) {
    case 'pending': return pendingExceptions.value
    case 'retrying': return retryingExceptions.value
    case 'resolved': return resolvedExceptions.value
    default: return []
  }
})

onMounted(() => {
  syncStore.initData()
})

function getTypeLabel(type) {
  const labels = {
    supplier: '供应商档案',
    material: '物料主数据',
    warehouse: '仓库/库位档案',
    department: '部门/采购员档案',
    exchange_rate: '汇率/税率/币种',
    asn: 'ASN预发货单',
    appointment: '到货预约单',
    receipt: '实际收货单',
    iqc: '来料检验单',
    return: '采购退货单',
    delivery_schedule: '交货排程计划',
    quotation: '询价/报价单',
    contract: '合同单据',
    delivery_change: '交期变更单',
    statement: '供应商对账单',
    invoice: '采购发票',
    deduction: '扣款/罚扣单',
    payment: '付款结果',
    estimated: '暂估入库数据',
    inventory: '现有库存',
    pending_inspection: '待检库存',
    in_transit: '在途库存',
    slow_moving: '呆滞物料',
    performance: '供应商绩效',
    corrective: '8D整改单',
    purchase_order: '采购订单',
    quality: '质检'
  }
  return labels[type] || type
}

function getDirectionLabel(direction) {
  const labels = {
    erp_to_srm: 'ERP→SRM',
    srm_to_erp: 'SRM→ERP',
    bidirectional: '双向同步'
  }
  return labels[direction] || direction
}

function getDirectionTagType(direction) {
  const types = {
    erp_to_srm: 'primary',
    srm_to_erp: 'success',
    bidirectional: 'warning'
  }
  return types[direction] || 'default'
}

function getErrorLabel(errorType) {
  const labels = {
    material_not_found: '物料不存在',
    network_timeout: '网络超时',
    quantity_exceed: '数量超限',
    supplier_mismatch: '供应商不匹配',
    doc_not_found: '单据不存在'
  }
  return labels[errorType] || errorType
}

function getStatusLabel(status) {
  const labels = {
    pending: '待处理',
    retrying: '重试中',
    resolved: '已解决'
  }
  return labels[status] || status
}

function handleTabChange() {
}

function handleRetry(row) {
  syncStore.retryException(row.id)
  ElMessage.success('已触发重试')
}

function handleResolve(row) {
  syncStore.resolveException(row.id, '当前用户')
  ElMessage.success('已标记为解决')
}

function handleDelete(row) {
  syncStore.deleteException(row.id)
  ElMessage.success('已删除')
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(17, 153, 142, 0.3);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -10%;
    width: 200px;
    height: 200px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 1px;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }

  .header-icon {
    width: 56px;
    height: 56px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.3);

    .el-icon {
      font-size: 28px;
      color: #ffffff;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  &.success {
    background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
    .stat-icon {
      background: rgba(34, 197, 94, 0.15);
      .el-icon { color: #22c55e; }
    }
    .stat-value { color: #22c55e; }
  }

  &.warning {
    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
    .stat-icon {
      background: rgba(234, 179, 8, 0.15);
      .el-icon { color: #eab308; }
    }
    .stat-value { color: #eab308; }
  }

  &.info {
    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    .stat-icon {
      background: rgba(59, 130, 246, 0.15);
      .el-icon { color: #3b82f6; }
    }
    .stat-value { color: #3b82f6; }
  }

  &.danger {
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    .stat-icon {
      background: rgba(239, 68, 68, 0.15);
      .el-icon { color: #ef4444; }
    }
    .stat-value { color: #ef4444; }
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info {
    .stat-value {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
    }
    .stat-label {
      font-size: 13px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }
  }
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;

  h3 {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
  }

  .filter-bar {
    display: flex;
    gap: 12px;
  }

  .tab-bar {
    .tab-badge {
      margin-left: 6px;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 500;

      &.pending { background: #ef4444; color: #fff; }
      &.retrying { background: #f59e0b; color: #fff; }
      &.resolved { background: #22c55e; color: #fff; }
    }
  }
}

.table-wrapper {
  padding: 16px 20px;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;

    th {
      background: #fafafa !important;
      color: #303133;
      font-weight: 600;
      font-size: 13px;
    }
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &.status-success { background: #dcfce7; color: #22c55e; }
  &.status-failed { background: #fee2e2; color: #ef4444; }
  &.status-pending { background: #fee2e2; color: #ef4444; }
  &.status-retrying { background: #fef3c7; color: #eab308; }
  &.status-resolved { background: #dcfce7; color: #22c55e; }
}

.action-buttons {
  display: flex;
  gap: 4px;
}
</style>
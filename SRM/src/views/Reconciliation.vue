<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>数据对账</h1>
        <p>SRM与ERP数据差异核对与处理</p>
      </div>
      <div class="header-icon">
        <el-icon><CircleCheck /></el-icon>
      </div>
    </div>

    <div class="recon-grid">
      <el-card class="recon-card" v-for="item in reconStats" :key="item.type">
        <div class="recon-header">
          <div class="recon-icon" :style="{ background: item.color }">
            <el-icon>{{ item.icon }}</el-icon>
          </div>
          <div class="recon-title">
            <h3>{{ item.title }}</h3>
            <p class="recon-subtitle">{{ item.subtitle }}</p>
          </div>
        </div>
        <div class="recon-stats">
          <div class="stat-item">
            <span class="stat-label">总单据</span>
            <span class="stat-num">{{ item.total }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已匹配</span>
            <span class="stat-num matched">{{ item.matched }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">差异</span>
            <span class="stat-num diff">{{ item.diff }}</span>
          </div>
        </div>
        <div class="recon-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: item.rate + '%', background: item.color }"></div>
          </div>
          <span class="progress-text">匹配率 {{ item.rate }}%</span>
        </div>
        <div class="recon-action">
          <el-button type="primary" size="small" @click="handleReconcile(item.type)">
            <el-icon><Refresh /></el-icon>
            立即对账
          </el-button>
        </div>
      </el-card>
    </div>

    <el-card class="content-card">
      <div class="card-header">
        <h3>对账差异明细</h3>
        <div class="filter-bar">
          <el-select v-model="diffFilter.type" placeholder="差异类型" style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="订单差异" value="order" />
            <el-option label="入库差异" value="receipt" />
            <el-option label="发票差异" value="invoice" />
            <el-option label="付款差异" value="payment" />
          </el-select>
          <el-select v-model="diffFilter.status" placeholder="处理状态" style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="resolved" />
          </el-select>
          <el-button type="primary" @click="handleExport">
            <el-icon><Download /></el-icon>
            导出差异报表
          </el-button>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="diffList" border style="width: 100%">
          <el-table-column prop="id" label="差异ID" width="100" />
          <el-table-column prop="type" label="差异类型" width="100">
            <template #default="{ row }">{{ getTypeLabel(row.type) }}</template>
          </el-table-column>
          <el-table-column prop="erpDocNo" label="ERP单据号" width="140" />
          <el-table-column prop="srmDocNo" label="SRM单据号" width="140" />
          <el-table-column prop="diffField" label="差异字段" width="120" />
          <el-table-column prop="erpValue" label="ERP值" />
          <el-table-column prop="srmValue" label="SRM值" />
          <el-table-column prop="diffAmount" label="差异金额" width="120">
            <template #default="{ row }">
              <span v-if="row.diffAmount" class="diff-amount">{{ row.diffAmount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="diffDate" label="差异日期" width="120" />
          <el-table-column prop="status" label="状态" width="80">
            <template #default="{ row }">
              <span :class="`status-badge status-${row.status}`">
                {{ row.status === 'pending' ? '待处理' : '已处理' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleFix(row)">处理</el-button>
                <el-button type="text" link size="small" @click="handleDetail(row)">详情</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="pagination.page"
            :page-size="pagination.pageSize"
            :total="diffList.length"
            class="pagination"
          />
        </div>
      </div>
    </el-card>

    <el-dialog v-model="detailDialog" title="差异详情" width="500px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="差异ID">{{ currentDiff.id }}</el-descriptions-item>
        <el-descriptions-item label="差异类型">{{ getTypeLabel(currentDiff.type) }}</el-descriptions-item>
        <el-descriptions-item label="ERP单据号">{{ currentDiff.erpDocNo }}</el-descriptions-item>
        <el-descriptions-item label="SRM单据号">{{ currentDiff.srmDocNo }}</el-descriptions-item>
        <el-descriptions-item label="差异字段">{{ currentDiff.diffField }}</el-descriptions-item>
        <el-descriptions-item label="ERP值">{{ currentDiff.erpValue }}</el-descriptions-item>
        <el-descriptions-item label="SRM值">{{ currentDiff.srmValue }}</el-descriptions-item>
        <el-descriptions-item label="差异金额">{{ currentDiff.diffAmount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="差异日期">{{ currentDiff.diffDate }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDiff.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, Refresh, Download, ShoppingCart, Box, Wallet, CreditCard } from '@element-plus/icons-vue'

const pagination = reactive({ page: 1, pageSize: 15 })
const detailDialog = ref(false)

const diffFilter = reactive({
  type: '',
  status: ''
})

const currentDiff = reactive({
  id: '',
  type: '',
  erpDocNo: '',
  srmDocNo: '',
  diffField: '',
  erpValue: '',
  srmValue: '',
  diffAmount: '',
  diffDate: '',
  remark: ''
})

const reconData = {
  orderDiff: { total: 1258, matched: 1245, diff: 13, rate: 99.0 },
  receiptDiff: { total: 2341, matched: 2310, diff: 31, rate: 98.7 },
  invoiceDiff: { total: 892, matched: 885, diff: 7, rate: 99.2 },
  paymentDiff: { total: 1567, matched: 1548, diff: 19, rate: 98.8 }
}

const reconStats = computed(() => [
  { type: 'order', title: '订单对账', subtitle: '采购订单数据核对', ...reconData.orderDiff, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: ShoppingCart },
  { type: 'receipt', title: '入库对账', subtitle: '收货入库数据核对', ...reconData.receiptDiff, color: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', icon: Box },
  { type: 'invoice', title: '发票对账', subtitle: '发票数据核对', ...reconData.invoiceDiff, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: Wallet },
  { type: 'payment', title: '付款对账', subtitle: '付款数据核对', ...reconData.paymentDiff, color: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)', icon: CreditCard }
])

const diffList = [
  { id: 'DF001', type: 'order', erpDocNo: 'PO20240120001', srmDocNo: 'PO20240120001', diffField: '数量', erpValue: '100', srmValue: '95', diffAmount: '', diffDate: '2024-01-20', status: 'pending', remark: 'ASN发货数量与PO不一致' },
  { id: 'DF002', type: 'receipt', erpDocNo: 'RC20240120003', srmDocNo: 'RC20240120003', diffField: '金额', erpValue: '5000.00', srmValue: '4850.00', diffAmount: '-150.00', diffDate: '2024-01-20', status: 'pending', remark: '含税金额差异' },
  { id: 'DF003', type: 'invoice', erpDocNo: 'INV20240119005', srmDocNo: '', diffField: '单据缺失', erpValue: '存在', srmValue: '缺失', diffAmount: '', diffDate: '2024-01-19', status: 'pending', remark: 'SRM未同步发票' },
  { id: 'DF004', type: 'payment', erpDocNo: 'PY20240118012', srmDocNo: 'PY20240118012', diffField: '付款状态', erpValue: '已付款', srmValue: '处理中', diffAmount: '', diffDate: '2024-01-18', status: 'resolved', remark: '已同步状态' },
  { id: 'DF005', type: 'receipt', erpDocNo: 'RC20240118008', srmDocNo: 'RC20240118008', diffField: '物料编码', erpValue: 'M001001', srmValue: 'M001002', diffAmount: '', diffDate: '2024-01-18', status: 'pending', remark: '物料编码不一致' },
  { id: 'DF006', type: 'order', erpDocNo: 'PO20240117015', srmDocNo: 'PO20240117015', diffField: '交期', erpValue: '2024-01-25', srmValue: '2024-01-28', diffAmount: '', diffDate: '2024-01-17', status: 'resolved', remark: '已确认交期变更' }
]

function getTypeLabel(type) {
  const labels = {
    order: '订单差异',
    receipt: '入库差异',
    invoice: '发票差异',
    payment: '付款差异'
  }
  return labels[type] || type
}

function handleReconcile(type) {
  ElMessage.success(`${getTypeLabel(type)}对账任务已启动`)
}

function handleExport() {
  ElMessage.success('差异报表导出成功')
}

function handleFix(row) {
  row.status = 'resolved'
  ElMessage.success('差异已处理')
}

function handleDetail(row) {
  Object.assign(currentDiff, row)
  detailDialog.value = true
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
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
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

.recon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.recon-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .recon-header {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #fafafa;
    border-bottom: 1px solid #f0f0f0;

    .recon-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      flex-shrink: 0;
    }

    .recon-title {
      h3 {
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 2px 0;
      }
      .recon-subtitle {
        font-size: 12px;
        color: #6b7280;
        margin: 0;
      }
    }
  }

  .recon-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px;

    .stat-item {
      text-align: center;

      .stat-label {
        font-size: 12px;
        color: #6b7280;
        display: block;
      }
      .stat-num {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;

        &.matched { color: #22c55e; }
        &.diff { color: #ef4444; }
      }
    }
  }

  .recon-progress {
    padding: 0 16px;

    .progress-bar {
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      font-size: 12px;
      color: #6b7280;
      display: block;
      text-align: right;
      margin-top: 6px;
    }
  }

  .recon-action {
    padding: 16px;
    text-align: center;
    border-top: 1px solid #f0f0f0;
  }
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
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

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 0;
}

.diff-amount {
  color: #ef4444;
  font-weight: 600;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &.status-pending { background: #fee2e2; color: #ef4444; }
  &.status-resolved { background: #dcfce7; color: #22c55e; }
}

.action-buttons {
  display: flex;
  gap: 4px;
}
</style>
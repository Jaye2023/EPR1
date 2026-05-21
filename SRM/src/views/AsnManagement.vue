<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>ASN预发货通知单</h1>
        <p>供应商发货通知单管理与跟踪</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddAsn">
          <el-icon><Plus /></el-icon>
          创建ASN
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon blue">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ asnList.length }}</p>
          <p class="stat-label">ASN总数</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon green">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ inTransitCount }}</p>
          <p class="stat-label">运输中</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon orange">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ pendingCount }}</p>
          <p class="stat-label">待发运</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon purple">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ completedCount }}</p>
          <p class="stat-label">已完成</p>
        </div>
      </el-card>
    </div>

    <el-card class="content-card">
      <div class="card-header">
        <h3>ASN列表</h3>
        <div class="filter-bar">
          <el-input v-model="filter.keyword" placeholder="搜索ASN号/PO号/供应商" clearable style="width: 200px" />
          <el-select v-model="filter.status" placeholder="状态筛选" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已提交" value="submitted" />
            <el-option label="已发运" value="shipped" />
            <el-option label="运输中" value="in_transit" />
            <el-option label="部分收货" value="partial_received" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="filteredAsnList" border style="width: 100%">
          <el-table-column prop="id" label="ASN号" width="140" />
          <el-table-column prop="poNo" label="PO号" width="140" />
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="shipDate" label="发货日期" width="120" />
          <el-table-column prop="eta" label="预计到货" width="140" />
          <el-table-column prop="carrier" label="承运商" width="120" />
          <el-table-column prop="trackingNo" label="运单号" width="140" />
          <el-table-column prop="packages" label="包装数" width="80" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
              <el-button v-if="row.status === 'draft'" type="success" link size="small" @click="handleSubmit(row)">提交</el-button>
              <el-button v-if="row.status === 'submitted'" type="warning" link size="small" @click="handleShip(row)">发运确认</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="detailDialog" title="ASN详情" width="800px">
      <div v-if="currentAsn" class="asn-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="ASN号">{{ currentAsn.id }}</el-descriptions-item>
            <el-descriptions-item label="PO号">{{ currentAsn.poNo }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ currentAsn.supplier }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusTagType(currentAsn.status)">
                {{ getStatusLabel(currentAsn.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发货日期">{{ currentAsn.shipDate || '-' }}</el-descriptions-item>
            <el-descriptions-item label="预计到货">{{ currentAsn.eta }}</el-descriptions-item>
            <el-descriptions-item label="承运商">{{ currentAsn.carrier }}</el-descriptions-item>
            <el-descriptions-item label="运单号">{{ currentAsn.trackingNo || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>包装信息</h4>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="箱数">{{ currentAsn.boxes }}</el-descriptions-item>
            <el-descriptions-item label="包装数">{{ currentAsn.packages }}</el-descriptions-item>
            <el-descriptions-item label="托数">{{ currentAsn.pallets }}</el-descriptions-item>
            <el-descriptions-item label="毛重(kg)">{{ currentAsn.grossWeight }}</el-descriptions-item>
            <el-descriptions-item label="体积(m³)">{{ currentAsn.volume }}</el-descriptions-item>
            <el-descriptions-item label="车牌号">{{ currentAsn.plateNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="司机">{{ currentAsn.driver || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentAsn.phone || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <h4>物料明细</h4>
          <el-table :data="currentAsn.items" border style="width: 100%">
            <el-table-column prop="materialCode" label="物料编码" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="120" />
            <el-table-column prop="spec" label="规格" width="100" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="batch" label="批次" width="120" />
            <el-table-column prop="mfgDate" label="生产日期" width="120" />
            <el-table-column prop="expiryDate" label="有效期" width="120" />
          </el-table>
        </div>

        <div class="detail-section" v-if="currentAsn.attachments && currentAsn.attachments.length > 0">
          <h4>附件</h4>
          <div class="attachment-list">
            <el-tag v-for="file in currentAsn.attachments" :key="file" class="attachment-tag">
              <el-icon><File /></el-icon>
              {{ file }}
            </el-tag>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Document, Box, Clock, CircleCheck } from '@element-plus/icons-vue'
import { useLogisticsStore } from '../stores/logistics'

const logisticsStore = useLogisticsStore()
const detailDialog = ref(false)
const currentAsn = reactive({})

const filter = reactive({
  keyword: '',
  status: ''
})

const asnList = computed(() => logisticsStore.asnList)

const inTransitCount = computed(() => 
  asnList.value.filter(a => a.status === 'in_transit' || a.status === 'shipped').length
)

const pendingCount = computed(() => 
  asnList.value.filter(a => a.status === 'draft' || a.status === 'submitted').length
)

const completedCount = computed(() => 
  asnList.value.filter(a => a.status === 'completed').length
)

const filteredAsnList = computed(() => {
  return asnList.value.filter(asn => {
    if (filter.keyword && !asn.id.includes(filter.keyword) && !asn.poNo.includes(filter.keyword) && !asn.supplier.includes(filter.keyword)) {
      return false
    }
    if (filter.status && asn.status !== filter.status) {
      return false
    }
    return true
  })
})

onMounted(() => {
  logisticsStore.initData()
})

function getStatusLabel(status) {
  return logisticsStore.getAsnStatusLabel(status)
}

function getStatusTagType(status) {
  const types = {
    draft: 'default',
    submitted: 'primary',
    shipped: 'warning',
    in_transit: 'info',
    partial_received: 'success',
    completed: 'success',
    closed: 'default'
  }
  return types[status] || 'default'
}

function handleAddAsn() {
  ElMessage.info('ASN创建功能开发中')
}

function handleView(row) {
  Object.assign(currentAsn, row)
  detailDialog.value = true
}

function handleSubmit(row) {
  row.status = 'submitted'
  ElMessage.success(`${row.id}已提交`)
}

function handleShip(row) {
  row.status = 'shipped'
  row.shipDate = new Date().toISOString().split('T')[0]
  ElMessage.success(`${row.id}已确认发运`)
}

function handleDelete(row) {
  ElMessage.success(`${row.id}已删除`)
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

  .header-content h1 {
    font-size: 26px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 6px 0;
  }

  .header-content p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.blue { background: #dbeafe; .el-icon { color: #3b82f6; } }
    &.green { background: #dcfce7; .el-icon { color: #22c55e; } }
    &.orange { background: #fef3c7; .el-icon { color: #f59e0b; } }
    &.purple { background: #ede9fe; .el-icon { color: #8b5cf6; } }
  }

  .stat-info .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .stat-info .stat-label {
    font-size: 12px;
    color: #64748b;
    margin: 2px 0 0 0;
  }
}

.content-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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
      font-weight: 600;
    }
  }
}

.asn-detail {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
      margin: 0 0 12px 0;
      padding-left: 8px;
      border-left: 3px solid #3b82f6;
    }
  }

  .attachment-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .attachment-tag {
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
    }
  }
}
</style>
<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>发货预约</h1>
        <p>供应商到厂预约管理</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleAddAppointment">
          <el-icon><Plus /></el-icon>
          新建预约
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon blue">
          <el-icon><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ appointmentList.length }}</p>
          <p class="stat-label">预约总数</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon orange">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ pendingCount }}</p>
          <p class="stat-label">待审核</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon green">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ approvedCount }}</p>
          <p class="stat-label">已通过</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon red">
          <el-icon><CircleClose /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ rejectedCount }}</p>
          <p class="stat-label">已驳回</p>
        </div>
      </el-card>
    </div>

    <el-card class="content-card">
      <div class="card-header">
        <h3>预约列表</h3>
        <div class="filter-bar">
          <el-input v-model="filter.keyword" placeholder="搜索预约号/供应商/PO号" clearable style="width: 200px" />
          <el-select v-model="filter.status" placeholder="状态筛选" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已到厂" value="arrived" />
          </el-select>
        </div>
      </div>
      <div class="table-wrapper">
        <el-table :data="filteredAppointmentList" border style="width: 100%">
          <el-table-column prop="id" label="预约单号" width="140" />
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="poNo" label="PO号" width="140" />
          <el-table-column prop="materialName" label="物料名称" width="120" />
          <el-table-column prop="etaDate" label="预约日期" width="100" />
          <el-table-column prop="etaTime" label="时间段" width="120" />
          <el-table-column prop="transportType" label="运输方式" width="120" />
          <el-table-column prop="plateNo" label="车牌号" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
              <template v-if="row.status === 'pending'">
                <el-button type="success" link size="small" @click="handleApprove(row)">通过</el-button>
                <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
              </template>
              <template v-else-if="row.status === 'approved'">
                <el-button type="warning" link size="small" @click="handleArrived(row)">确认到厂</el-button>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-dialog v-model="detailDialog" title="预约详情" width="600px">
      <div v-if="currentAppointment" class="appointment-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="预约单号">{{ currentAppointment.id }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusTagType(currentAppointment.status)">
              {{ getStatusLabel(currentAppointment.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentAppointment.supplier }}</el-descriptions-item>
          <el-descriptions-item label="PO号">{{ currentAppointment.poNo }}</el-descriptions-item>
          <el-descriptions-item label="物料编码">{{ currentAppointment.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ currentAppointment.materialName }}</el-descriptions-item>
          <el-descriptions-item label="预约日期">{{ currentAppointment.etaDate }}</el-descriptions-item>
          <el-descriptions-item label="时间段">{{ currentAppointment.etaTime }}</el-descriptions-item>
          <el-descriptions-item label="运输方式">{{ currentAppointment.transportType }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ currentAppointment.plateNo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="司机">{{ currentAppointment.driver || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系人">{{ currentAppointment.contact }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentAppointment.phone }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ currentAppointment.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentAppointment.createTime }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ currentAppointment.approveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核人">{{ currentAppointment.approver || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="currentAppointment.rejectReason" label="驳回原因">
            {{ currentAppointment.rejectReason }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Calendar, Clock, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { useLogisticsStore } from '../stores/logistics'

const logisticsStore = useLogisticsStore()
const detailDialog = ref(false)
const currentAppointment = reactive({})

const filter = reactive({
  keyword: '',
  status: ''
})

const appointmentList = computed(() => logisticsStore.appointmentList)

const pendingCount = computed(() => 
  appointmentList.value.filter(a => a.status === 'pending').length
)

const approvedCount = computed(() => 
  appointmentList.value.filter(a => a.status === 'approved').length
)

const rejectedCount = computed(() => 
  appointmentList.value.filter(a => a.status === 'rejected').length
)

const filteredAppointmentList = computed(() => {
  return appointmentList.value.filter(apt => {
    if (filter.keyword && !apt.id.includes(filter.keyword) && !apt.supplier.includes(filter.keyword) && !apt.poNo.includes(filter.keyword)) {
      return false
    }
    if (filter.status && apt.status !== filter.status) {
      return false
    }
    return true
  })
})

onMounted(() => {
  logisticsStore.initData()
})

function getStatusLabel(status) {
  return logisticsStore.getAppointmentStatusLabel(status)
}

function getStatusTagType(status) {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    arrived: 'info'
  }
  return types[status] || 'default'
}

function handleAddAppointment() {
  ElMessage.info('新建预约功能开发中')
}

function handleView(row) {
  Object.assign(currentAppointment, row)
  detailDialog.value = true
}

function handleApprove(row) {
  row.status = 'approved'
  row.approveTime = new Date().toLocaleString('zh-CN')
  row.approver = '当前用户'
  ElMessage.success(`${row.id}已通过审核`)
}

async function handleReject(row) {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入驳回原因', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    if (reason) {
      row.status = 'rejected'
      row.approveTime = new Date().toLocaleString('zh-CN')
      row.approver = '当前用户'
      row.rejectReason = reason
      ElMessage.success(`${row.id}已驳回`)
    }
  } catch {
    // cancelled
  }
}

function handleArrived(row) {
  row.status = 'arrived'
  ElMessage.success(`${row.id}已确认到厂`)
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);

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
    &.orange { background: #fef3c7; .el-icon { color: #f59e0b; } }
    &.green { background: #dcfce7; .el-icon { color: #22c55e; } }
    &.red { background: #fee2e2; .el-icon { color: #ef4444; } }
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
</style>
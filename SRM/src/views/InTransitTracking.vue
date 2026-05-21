<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>在途跟踪</h1>
        <p>实时监控货物运输状态</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="alert-section" v-if="delayedCount > 0">
      <el-alert title="有 {{ delayedCount }} 单货物延迟到达" type="warning" :closable="false" show-icon>
        <span v-for="item in delayedItems" :key="item.asnNo" class="alert-item">
          {{ item.asnNo }} (延迟{{ item.delayHours }}小时)
        </span>
      </el-alert>
    </div>

    <div class="transit-cards">
      <el-card 
        v-for="item in transitList" 
        :key="item.asnNo" 
        class="transit-card"
        :class="{ 'is-delayed': item.isDelayed }"
      >
        <div class="card-header">
          <div class="card-title">
            <span class="asn-no">{{ item.asnNo }}</span>
            <el-tag v-if="item.isDelayed" type="danger" size="small">延迟</el-tag>
          </div>
          <div class="status-badge" :class="`status-${item.status}`">
            {{ getStatusLabel(item.status) }}
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">PO号</span>
            <span class="value">{{ item.poNo }}</span>
          </div>
          <div class="info-row">
            <span class="label">供应商</span>
            <span class="value">{{ item.supplier }}</span>
          </div>
          <div class="info-row">
            <span class="label">承运商</span>
            <span class="value">{{ item.carrier }}</span>
          </div>
          <div class="info-row">
            <span class="label">运单号</span>
            <span class="value">{{ item.trackingNo }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-header">
            <span>运输进度</span>
            <span class="progress-percent">{{ item.progress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: item.progress + '%' }"></div>
          </div>
          <div class="progress-labels">
            <span>已发货</span>
            <span>{{ item.currentLocation }}</span>
            <span>待收货</span>
          </div>
        </div>

        <div class="eta-section">
          <div class="eta-item">
            <el-icon><Clock /></el-icon>
            <span class="eta-label">发运时间</span>
            <span class="eta-value">{{ item.shipTime || '-' }}</span>
          </div>
          <div class="eta-item">
            <el-icon><Box /></el-icon>
            <span class="eta-label">预计到达</span>
            <span class="eta-value">{{ item.eta }}</span>
          </div>
        </div>

        <div class="card-actions">
          <el-button type="primary" link size="small" @click="handleTrack(item)">查看轨迹</el-button>
          <el-button type="success" link size="small" @click="handleContact(item)">联系司机</el-button>
        </div>
      </el-card>
    </div>

    <el-card class="exception-card">
      <div class="card-header">
        <h3>物流异常</h3>
        <span class="exception-count">{{ pendingExceptions.length }} 条待处理</span>
      </div>
      <div class="table-wrapper">
        <el-table :data="exceptionList" border style="width: 100%">
          <el-table-column prop="id" label="异常单号" width="120" />
          <el-table-column prop="typeName" label="异常类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getExceptionTagType(row.type)">
                {{ row.typeName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="asnNo" label="ASN号" width="140" />
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="material" label="物料" width="120" />
          <el-table-column prop="reason" label="异常原因" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <span :class="`status-badge status-${row.status}`">
                {{ getExceptionStatusLabel(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140">
            <template #default="{ row }">
              <el-button v-if="row.status !== 'resolved'" type="primary" link size="small" @click="handleResolve(row)">处理</el-button>
              <el-button type="text" link size="small" @click="handleDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Clock, Box } from '@element-plus/icons-vue'
import { useLogisticsStore } from '../stores/logistics'

const logisticsStore = useLogisticsStore()

const transitList = computed(() => logisticsStore.transitList)
const exceptionList = computed(() => logisticsStore.exceptionList)
const pendingExceptions = computed(() => logisticsStore.pendingExceptions)

const delayedItems = computed(() => transitList.value.filter(item => item.isDelayed))
const delayedCount = computed(() => delayedItems.value.length)

onMounted(() => {
  logisticsStore.initData()
})

function getStatusLabel(status) {
  const labels = {
    shipped: '已发运',
    in_transit: '运输中',
    partial_received: '部分收货'
  }
  return labels[status] || status
}

function getExceptionTagType(type) {
  const types = {
    DELAY: 'warning',
    SHORT: 'danger',
    OVER: 'info',
    DAMAGE: 'danger',
    LABEL: 'warning'
  }
  return types[type] || 'default'
}

function getExceptionStatusLabel(status) {
  return logisticsStore.getExceptionStatusLabel(status)
}

function handleRefresh() {
  ElMessage.success('数据已刷新')
}

function handleTrack(item) {
  ElMessage.info(`查看 ${item.asnNo} 的运输轨迹`)
}

function handleContact(item) {
  ElMessage.info(`联系 ${item.supplier} 的运输负责人`)
}

function handleResolve(row) {
  row.status = 'processing'
  row.handler = '当前用户'
  row.handleTime = new Date().toLocaleString('zh-CN')
  ElMessage.success(`${row.id} 已开始处理`)
}

function handleDetail(row) {
  ElMessage.info(`查看 ${row.id} 的详细信息`)
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);

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

.alert-section {
  margin-bottom: 20px;

  :deep(.el-alert) {
    border-radius: 8px;
  }

  .alert-item {
    margin-right: 16px;
    padding: 2px 8px;
    background: rgba(245, 158, 11, 0.2);
    border-radius: 4px;
    font-size: 12px;
  }
}

.transit-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.transit-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  transition: all 0.25s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  &.is-delayed {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e2e8f0;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .asn-no {
      font-size: 15px;
      font-weight: 600;
      color: #1e293b;
    }
  }

  .status-badge {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;

    &.status-shipped { background: #fef3c7; color: #f59e0b; }
    &.status-in_transit { background: #dbeafe; color: #3b82f6; }
    &.status-partial_received { background: #dcfce7; color: #22c55e; }
  }

  .card-body {
    margin-bottom: 16px;

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;

      .label {
        font-size: 13px;
        color: #64748b;
      }

      .value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
      }
    }
  }

  .progress-section {
    margin-bottom: 16px;

    .progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      color: #64748b;

      .progress-percent {
        font-weight: 600;
        color: #3b82f6;
      }
    }

    .progress-bar {
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }

    .progress-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .eta-section {
    display: flex;
    gap: 24px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 16px;

    .eta-item {
      display: flex;
      align-items: center;
      gap: 6px;

      .el-icon {
        font-size: 14px;
        color: #64748b;
      }

      .eta-label {
        font-size: 12px;
        color: #64748b;
      }

      .eta-value {
        font-size: 13px;
        color: #1e293b;
        font-weight: 500;
      }
    }
  }

  .card-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
}

.exception-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

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

    .exception-count {
      padding: 4px 12px;
      background: #fee2e2;
      color: #ef4444;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
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
}
</style>
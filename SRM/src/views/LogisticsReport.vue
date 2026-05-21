<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>物流报表</h1>
        <p>物流数据分析与绩效统计</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon blue">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.onTimeRate }}%</p>
          <p class="stat-label">准时率</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon green">
          <el-icon><CircleCheck /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.asnAccuracy }}%</p>
          <p class="stat-label">ASN准确率</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon red">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.damageRate }}%</p>
          <p class="stat-label">破损率</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon purple">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.labelRate }}%</p>
          <p class="stat-label">标签合格率</p>
        </div>
      </el-card>
    </div>

    <el-card class="content-card">
      <div class="card-header">
        <h3>物流绩效看板</h3>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-item">
          <div class="dashboard-header">
            <span class="dashboard-title">准时率趋势</span>
          </div>
          <div class="chart-placeholder">
            <div class="mini-chart">
              <div class="chart-bar" style="height: 60%"></div>
              <div class="chart-bar" style="height: 75%"></div>
              <div class="chart-bar" style="height: 82%"></div>
              <div class="chart-bar" style="height: 70%"></div>
              <div class="chart-bar" style="height: 88%"></div>
              <div class="chart-bar" style="height: 92%"></div>
              <div class="chart-bar" style="height: 85%"></div>
            </div>
            <div class="chart-labels">
              <span>周一</span><span>周二</span><span>周三</span><span>周四</span><span>周五</span><span>周六</span><span>周日</span>
            </div>
          </div>
        </div>

        <div class="dashboard-item">
          <div class="dashboard-header">
            <span class="dashboard-title">承运商评分</span>
          </div>
          <div class="carrier-scores">
            <div v-for="carrier in carrierScores" :key="carrier.name" class="carrier-item">
              <span class="carrier-name">{{ carrier.name }}</span>
              <div class="score-bar">
                <div class="score-fill" :style="{ width: carrier.score + '%' }"></div>
              </div>
              <span class="score-value">{{ carrier.score }}分</span>
            </div>
          </div>
        </div>

        <div class="dashboard-item">
          <div class="dashboard-header">
            <span class="dashboard-title">异常分布</span>
          </div>
          <div class="exception-distribution">
            <div v-for="item in exceptionDistribution" :key="item.type" class="exception-item">
              <div class="exception-color" :style="{ background: item.color }"></div>
              <span class="exception-name">{{ item.name }}</span>
              <span class="exception-count">{{ item.count }}</span>
              <span class="exception-percent">{{ item.percent }}%</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <el-card class="content-card">
      <div class="card-header">
        <h3>ASN明细表</h3>
      </div>
      <div class="table-wrapper">
        <el-table :data="asnReportList" border style="width: 100%">
          <el-table-column prop="id" label="ASN号" width="140" />
          <el-table-column prop="poNo" label="PO号" width="140" />
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="shipDate" label="发货日期" width="120" />
          <el-table-column prop="eta" label="预计到货" width="140" />
          <el-table-column prop="totalQty" label="总数量" width="100" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="carrier" label="承运商" width="120" />
        </el-table>
      </div>
    </el-card>

    <el-card class="content-card">
      <div class="card-header">
        <h3>到货准时率报表</h3>
      </div>
      <div class="table-wrapper">
        <el-table :data="onTimeReportList" border style="width: 100%">
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="carrier" label="承运商" width="120" />
          <el-table-column prop="onTimeCount" label="准时次数" width="100" />
          <el-table-column prop="totalCount" label="总次数" width="100" />
          <el-table-column prop="onTimeRate" label="准时率" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.onTimeRate" :show-text="false" :stroke-width="12" />
            </template>
          </el-table-column>
          <el-table-column prop="onTimeRate" label="准时率(%)" width="80">
            <template #default="{ row }">
              <span :class="row.onTimeRate >= 90 ? 'text-green' : row.onTimeRate >= 80 ? 'text-orange' : 'text-red'">
                {{ row.onTimeRate }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <el-card class="content-card">
      <div class="card-header">
        <h3>收货差异报表</h3>
      </div>
      <div class="table-wrapper">
        <el-table :data="diffReportList" border style="width: 100%">
          <el-table-column prop="asnNo" label="ASN号" width="140" />
          <el-table-column prop="poNo" label="PO号" width="140" />
          <el-table-column prop="supplier" label="供应商" width="140" />
          <el-table-column prop="material" label="物料" width="120" />
          <el-table-column prop="expectedQty" label="应收数量" width="100" />
          <el-table-column prop="actualQty" label="实收数量" width="100" />
          <el-table-column prop="diffQty" label="差异数量" width="100">
            <template #default="{ row }">
              <span :class="row.diffQty > 0 ? 'text-red' : row.diffQty < 0 ? 'text-orange' : 'text-green'">
                {{ row.diffQty > 0 ? '+' : '' }}{{ row.diffQty }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="diffReason" label="差异原因" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Document, CircleCheck, Warning, Box } from '@element-plus/icons-vue'
import { useLogisticsStore } from '../stores/logistics'

const logisticsStore = useLogisticsStore()

const stats = reactive({
  onTimeRate: 87.5,
  asnAccuracy: 94.2,
  damageRate: 1.8,
  labelRate: 98.5
})

const carrierScores = ref([
  { name: '德邦物流', score: 92 },
  { name: '顺丰速运', score: 95 },
  { name: '中通快递', score: 88 },
  { name: 'EMS', score: 85 },
  { name: '圆通速递', score: 86 }
])

const exceptionDistribution = ref([
  { type: 'DELAY', name: '延迟到货', count: 12, percent: 40, color: '#f59e0b' },
  { type: 'SHORT', name: '短装', count: 8, percent: 27, color: '#ef4444' },
  { type: 'DAMAGE', name: '破损', count: 5, percent: 17, color: '#ec4899' },
  { type: 'LABEL', name: '标签错误', count: 5, percent: 16, color: '#8b5cf6' }
])

const asnReportList = computed(() => {
  return logisticsStore.asnList.map(asn => ({
    ...asn,
    totalQty: asn.items.reduce((sum, item) => sum + item.quantity, 0)
  }))
})

const onTimeReportList = ref([
  { supplier: '上海华腾电子', carrier: '德邦物流', onTimeCount: 45, totalCount: 52, onTimeRate: 86.5 },
  { supplier: '深圳精密科技', carrier: '顺丰速运', onTimeCount: 38, totalCount: 40, onTimeRate: 95.0 },
  { supplier: '苏州塑胶制品', carrier: '中通快递', onTimeCount: 28, totalCount: 32, onTimeRate: 87.5 },
  { supplier: '杭州五金制品', carrier: '圆通速递', onTimeCount: 22, totalCount: 26, onTimeRate: 84.6 },
  { supplier: '北京光电科技', carrier: 'EMS', onTimeCount: 18, totalCount: 22, onTimeRate: 81.8 }
])

const diffReportList = ref([
  { asnNo: 'ASN20240120001', poNo: 'PO20240115001', supplier: '上海华腾电子', material: '电阻10K', expectedQty: 10000, actualQty: 9850, diffQty: -150, diffReason: '运输损耗' },
  { asnNo: 'ASN20240120005', poNo: 'PO20240117005', supplier: '北京光电科技', material: 'LED灯珠', expectedQty: 20000, actualQty: 19500, diffQty: -500, diffReason: '生产短装' },
  { asnNo: 'ASN20240120003', poNo: 'PO20240114003', supplier: '苏州塑胶制品', material: '塑料外壳', expectedQty: 1000, actualQty: 980, diffQty: -20, diffReason: '破损退货' },
  { asnNo: 'ASN20240120002', poNo: 'PO20240116002', supplier: '深圳精密科技', material: '连接器', expectedQty: 2000, actualQty: 2005, diffQty: 5, diffReason: '多装' }
])

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

function handleExport() {
  ElMessage.success('报表导出功能开发中')
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(240, 147, 251, 0.3);

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
    &.red { background: #fee2e2; .el-icon { color: #ef4444; } }
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

  :deep(.el-progress-bar__inner) {
    border-radius: 6px;
  }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.dashboard-item {
  background: #fafafa;
  border-radius: 10px;
  padding: 16px;

  .dashboard-header {
    margin-bottom: 12px;

    .dashboard-title {
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }
  }
}

.chart-placeholder {
  padding: 8px;

  .mini-chart {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    height: 80px;
    padding: 0 4px;

    .chart-bar {
      width: 12%;
      background: linear-gradient(180deg, #3b82f6 0%, #8b5cf6 100%);
      border-radius: 4px 4px 0 0;
      transition: height 0.3s ease;
    }
  }

  .chart-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 11px;
    color: #94a3b8;
  }
}

.carrier-scores {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .carrier-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .carrier-name {
      width: 80px;
      font-size: 13px;
      color: #475569;
    }

    .score-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;

      .score-fill {
        height: 100%;
        background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
        border-radius: 4px;
        transition: width 0.3s ease;
      }
    }

    .score-value {
      width: 45px;
      font-size: 12px;
      font-weight: 600;
      color: #22c55e;
      text-align: right;
    }
  }
}

.exception-distribution {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .exception-item {
    display: flex;
    align-items: center;
    gap: 10px;

    .exception-color {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .exception-name {
      flex: 1;
      font-size: 13px;
      color: #475569;
    }

    .exception-count {
      width: 30px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      text-align: right;
    }

    .exception-percent {
      width: 40px;
      font-size: 12px;
      color: #94a3b8;
      text-align: right;
    }
  }
}

.text-green { color: #22c55e; }
.text-orange { color: #f59e0b; }
.text-red { color: #ef4444; }
</style>
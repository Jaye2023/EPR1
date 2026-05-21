<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>单据同步配置</h1>
        <p>SRM与ERP全量核心同步单据清单管理</p>
      </div>
      <div class="header-icon">
        <el-icon><Refresh /></el-icon>
      </div>
    </div>

    <el-card class="summary-card">
      <div class="summary-row">
        <div class="summary-item">
          <span class="summary-value">{{ totalCount }}</span>
          <span class="summary-label">单据类型总数</span>
        </div>
        <div class="summary-item">
          <span class="summary-value enabled">{{ enabledCount }}</span>
          <span class="summary-label">已启用同步</span>
        </div>
        <div class="summary-item">
          <span class="summary-value disabled">{{ disabledCount }}</span>
          <span class="summary-label">已禁用同步</span>
        </div>
      </div>
    </el-card>

    <div class="tabs-container">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <el-tab-pane v-for="(docs, category) in groupedDocumentTypes" :key="category" :label="category">
          <div class="category-section">
            <div 
              v-for="doc in docs" 
              :key="doc.id" 
              class="doc-card"
              :class="{ 'is-disabled': !doc.enabled }"
            >
              <div class="doc-header">
                <div class="doc-info">
                  <div class="doc-name">{{ doc.name }}</div>
                  <div class="doc-type">
                    <el-tag :type="getDirectionTagType(doc.direction)" size="small">
                      {{ getDirectionLabel(doc.direction) }}
                    </el-tag>
                  </div>
                </div>
                <div class="doc-toggle">
                  <el-switch 
                    :value="doc.enabled" 
                    @change="handleToggle(doc.id, $event)"
                  />
                </div>
              </div>
              <div class="doc-detail">
                <div class="detail-row">
                  <span class="detail-label">对应ERP单据：</span>
                  <span class="detail-value">{{ getErpDocument(doc.id) }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">同步内容：</span>
                  <span class="detail-value">{{ getSyncContent(doc.id) }}</span>
                </div>
              </div>
              <div class="doc-status">
                <span :class="`status-badge ${doc.enabled ? 'status-enabled' : 'status-disabled'}`">
                  {{ doc.enabled ? '同步中' : '已暂停' }}
                </span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-card class="compare-card">
      <div class="card-header">
        <h3>同步单据对照表</h3>
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出对照表
        </el-button>
      </div>
      <div class="table-wrapper">
        <el-table :data="compareList" border style="width: 100%">
          <el-table-column prop="name" label="同步单据名称" width="180" />
          <el-table-column prop="erpDoc" label="对应ERP单据" width="180" />
          <el-table-column prop="direction" label="同步方向" width="120">
            <template #default="{ row }">
              <el-tag :type="getDirectionTagType(row.direction)">
                {{ getDirectionLabel(row.direction) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" width="120" />
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }">
              <span :class="`status-badge ${row.enabled ? 'status-enabled' : 'status-disabled'}`">
                {{ row.enabled ? '启用' : '禁用' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import { useSyncStore } from '../stores/sync'

const syncStore = useSyncStore()
const activeTab = ref('主数据')

const groupedDocumentTypes = computed(() => syncStore.groupedDocumentTypes)

const totalCount = computed(() => syncStore.documentTypes.length)
const enabledCount = computed(() => syncStore.documentTypes.filter(d => d.enabled).length)
const disabledCount = computed(() => syncStore.documentTypes.filter(d => !d.enabled).length)

const compareList = computed(() => {
  return syncStore.documentTypes.map(doc => ({
    name: doc.name,
    erpDoc: getErpDocument(doc.id),
    direction: doc.direction,
    category: doc.category,
    enabled: doc.enabled
  }))
})

const erpDocuments = {
  supplier: '供应商基础资料',
  material: '物料基础资料',
  warehouse: '仓库基础资料',
  department: '部门/人员档案',
  exchange_rate: '汇率/税率档案',
  asn: '采购到货单',
  appointment: '厂区收货预约单',
  receipt: '采购入库单',
  iqc: 'IQC来料检验单',
  return: '采购退货单',
  delivery_schedule: '采购送货计划',
  quotation: '供应商报价单',
  contract: '采购合同',
  delivery_change: '交期变更单',
  statement: '采购应付对账',
  invoice: '采购发票单',
  deduction: '采购费用扣款单',
  payment: '付款核销记录',
  estimated: '暂估入库记录',
  inventory: '库存台账',
  pending_inspection: '待检库存记录',
  in_transit: '供应商在途量',
  slow_moving: '呆滞物料记录',
  performance: '供方考核档案',
  corrective: '8D整改记录'
}

const syncContents = {
  supplier: '供应商编码、名称、分类、结算方式、银行信息、联系人、账期、税率',
  material: '物料编码、名称、规格、单位、物料分类、采购属性、默认仓库、检验方式',
  warehouse: '仓库编码、仓库名称、收货库区、退货库区',
  department: '人员编码、姓名、所属采购组、负责品类',
  exchange_rate: '汇率、税率、结算币种',
  asn: '关联PO、发货数量、批次、箱数、承运商、预计到货',
  appointment: '预约时间、月台、承运商、货物明细',
  receipt: '实收数量、批次、库位、质检状态',
  iqc: '合格/不合格、不良数量、不良原因、处理结论',
  return: '退货物料、数量、退货原因、扣款方式',
  delivery_schedule: '物料、数量、交期、优先级',
  quotation: '物料、报价、有效期、付款条件',
  contract: '合同编号、供应商、金额、有效期',
  delivery_change: '原交期、新交期、变更原因',
  statement: '入库明细、退货明细、扣款明细、应付金额',
  invoice: '发票号码、金额、税率、三单匹配结果',
  deduction: '扣款类型、金额、原因、关联单据',
  payment: '付款金额、付款日期、付款方式、核销状态',
  estimated: '暂估金额、物料明细、入库日期',
  inventory: '物料、仓库、数量、批次',
  pending_inspection: '物料、数量、检验状态',
  in_transit: '物料、数量、预计到货日期',
  slow_moving: '物料、数量、呆滞天数、处理建议',
  performance: '准时率、合格率、评分、等级',
  corrective: '问题描述、整改措施、责任人、完成日期'
}

function getErpDocument(id) {
  return erpDocuments[id] || '-'
}

function getSyncContent(id) {
  return syncContents[id] || '-'
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

function handleTabChange() {
}

function handleToggle(docId, enabled) {
  syncStore.updateDocumentType(docId, enabled)
  const doc = syncStore.documentTypes.find(d => d.id === docId)
  if (enabled) {
    ElMessage.success(`${doc.name}已启用同步`)
  } else {
    ElMessage.warning(`${doc.name}已暂停同步`)
  }
}

function handleExport() {
  ElMessage.success('同步单据对照表导出成功')
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

.summary-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

  .summary-row {
    display: flex;
    justify-content: space-around;
  }

  .summary-item {
    text-align: center;

    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: #1e293b;
      display: block;

      &.enabled { color: #22c55e; }
      &.disabled { color: #f59e0b; }
    }

    .summary-label {
      font-size: 13px;
      color: #64748b;
      margin-top: 4px;
    }
  }
}

.tabs-container {
  margin-bottom: 24px;

  :deep(.el-tabs__content) {
    padding: 20px 0;
  }

  :deep(.el-tabs__header) {
    margin-bottom: 0;
    border-bottom: 1px solid #e2e8f0;
  }

  :deep(.el-tab-pane) {
    padding: 0;
  }
}

.category-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.doc-card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    border-color: #cbd5e1;
  }

  &.is-disabled {
    opacity: 0.7;
    background: #fafafa;
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;

    .doc-info {
      .doc-name {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-bottom: 6px;
      }

      .doc-type {
        display: inline-flex;
      }
    }
  }

  .doc-detail {
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
    margin-bottom: 12px;

    .detail-row {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      .detail-label {
        font-size: 12px;
        color: #64748b;
        font-weight: 500;
        flex-shrink: 0;
      }

      .detail-value {
        font-size: 12px;
        color: #334155;
        line-height: 1.5;
      }
    }
  }

  .doc-status {
    display: flex;
    justify-content: flex-end;
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;

  &.status-enabled {
    background: #dcfce7;
    color: #22c55e;
  }

  &.status-disabled {
    background: #fef3c7;
    color: #f59e0b;
  }
}

.compare-card {
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
}
</style>
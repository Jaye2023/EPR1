<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-content">
        <h1>采购订单管理</h1>
        <p>管理采购订单与供应商协同</p>
      </div>
      <div class="header-icon">
        <el-icon><ShoppingCart /></el-icon>
      </div>
    </div>

    <el-card class="content-card">
      <div class="toolbar">
        <div class="toolbar-row">
          <div class="filter-row">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
              @change="handleSearch"
            />
            <el-input v-model="filterOrderNumber" placeholder="采购订单号" style="width: 160px" clearable @change="handleSearch" />
            <el-input v-model="filterSupplierCode" placeholder="供应商编码" style="width: 140px" clearable @change="handleSearch" />
            <el-input v-model="filterSupplierName" placeholder="供应商名称" style="width: 160px" clearable @change="handleSearch" />
            <el-input v-model="filterMaterialCode" placeholder="物料编码" style="width: 140px" clearable @change="handleSearch" />
            <el-select v-model="filterStatus" placeholder="完成状态" style="width: 120px" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option label="待确认" value="pending" />
              <el-option label="已确认" value="confirmed" />
              <el-option label="待发货" value="to_ship" />
              <el-option label="已发货" value="shipped" />
              <el-option label="已收货" value="received" />
            </el-select>
          </div>
          <div class="action-row">
            <el-button type="primary" @click="handleRefresh">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
            <el-button type="success" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="info" @click="showFilterDialog = true">
              <el-icon><Filter /></el-icon>
              筛选
            </el-button>
            <el-dropdown trigger="click" @command="handleColumnToggle">
              <el-button type="default">
                <el-icon><Grid /></el-icon>
                列显示
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="selectAll">
                    <span :class="{ 'checked': allColumnsSelected }">
                      <el-icon v-if="allColumnsSelected"><CircleCheck /></el-icon>
                      <el-icon v-else><Check /></el-icon>
                      全选
                    </span>
                  </el-dropdown-item>
                  <el-dropdown-item command="deselectAll">
                    <el-icon><Check /></el-icon>
                    全不选
                  </el-dropdown-item>
                  <el-dropdown-divider />
                  <el-dropdown-item 
                    v-for="col in columnConfig" 
                    :key="col.key" 
                    :command="col.key"
                    :disabled="col.fixed"
                  >
                    <span :class="{ 'checked': columnVisible[col.key] }">
                      <el-icon v-if="columnVisible[col.key]"><CircleCheck /></el-icon>
                      <el-icon v-else><Check /></el-icon>
                      {{ col.label }}
                      <span v-if="col.fixed" class="fixed-badge">固定</span>
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
        
        <div class="status-bar">
          <div class="status-item" :class="{ 'status-active': filterStatus === '' || filterStatus === 'pending' }" @click="filterStatus = filterStatus === 'pending' ? '' : 'pending'; handleSearch()">
            <span class="status-count">{{ stats.pending }}</span>
            <span class="status-label">待确认</span>
          </div>
          <div class="status-item" :class="{ 'status-active': filterStatus === 'confirmed' }" @click="filterStatus = filterStatus === 'confirmed' ? '' : 'confirmed'; handleSearch()">
            <span class="status-count">{{ stats.confirmed }}</span>
            <span class="status-label">已确认</span>
          </div>
          <div class="status-item" :class="{ 'status-active': filterStatus === 'shipped' }" @click="filterStatus = filterStatus === 'shipped' ? '' : 'shipped'; handleSearch()">
            <span class="status-count">{{ stats.shipped }}</span>
            <span class="status-label">已发货</span>
          </div>
          <div class="status-item" :class="{ 'status-active': filterStatus === 'received' }" @click="filterStatus = filterStatus === 'received' ? '' : 'received'; handleSearch()">
            <span class="status-count">{{ stats.received }}</span>
            <span class="status-label">已收货</span>
          </div>
        </div>
      </div>

      <div class="table-toolbar">
        <div class="batch-actions">
          <el-button v-if="selectedRows.length > 0" type="success" size="small" @click="handleBatchConfirm">
            <el-icon><CircleCheck /></el-icon> 批量确认
          </el-button>
          <el-button v-if="selectedRows.length > 0" type="warning" size="small" @click="handleBatchShip">
            <el-icon><Wallet /></el-icon> 批量发货
          </el-button>
          <el-button v-if="selectedRows.length > 0" type="danger" size="small" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon> 批量删除
          </el-button>
        </div>
      </div>

      <el-table :data="displayData" border style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange" ref="tableRef" stripe highlight-current-row>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column type="selection" width="45" />
        <el-table-column prop="orderNumber" label="采购订单号" width="150" sortable>
          <template #default="{ row }">
            <span class="order-link" @click="handleView(row)">{{ row.orderNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单日期" width="110" sortable>
          <template #default="{ row }">
            <span class="date-cell">{{ row.createdAt }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplierCode" label="供应商编码" width="120" />
        <el-table-column prop="supplierName" label="供应商名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="supplier-name">{{ row.supplierName }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编码" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="specification" label="规格型号" min-width="130" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="90" align="right">
          <template #default="{ row }">
            <span class="quantity-cell">{{ row.quantity }} {{ row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" width="110" align="right" sortable>
          <template #default="{ row }">
            <span class="amount-cell" :class="{ 'high-amount': row.totalAmount >= 10000 }">
              ¥{{ formatAmount(row.totalAmount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="deliveryDate" label="要求交期" width="105">
          <template #default="{ row }">
            <span class="date-cell" :class="{ 'urgent': isUrgent(row.deliveryDate) }">{{ row.deliveryDate }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="confirmedDate" label="确认交期" width="105">
          <template #default="{ row }">
            <span v-if="row.confirmedDate" class="date-cell confirmed">{{ row.confirmedDate }}</span>
            <span v-else class="pending-text">待确认</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="95">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="warehouse" label="仓库" width="85" show-overflow-tooltip />
        <el-table-column prop="createdBy" label="下单人" width="85" />
        <el-table-column prop="attachment" label="附件" width="80">
          <template #default="{ row }">
            <el-link v-if="row.attachment" type="primary" size="small" href="#" @click.prevent="handleDownloadAttachment(row)">
              <el-icon><Document /></el-icon>
            </el-link>
            <span v-else class="no-data">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button v-if="row.status === 'pending'" type="primary" link size="small" @click="handleConfirm(row)">确认</el-button>
              <el-button v-if="row.status === 'confirmed'" type="warning" link size="small" @click="handleDelivery(row)">发货</el-button>
              <el-button v-if="row.status === 'shipped'" type="success" link size="small" @click="handleReceive(row)">收货</el-button>
              <el-button type="info" link size="small" @click="handleView(row)">详情</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <div class="selected-info" v-if="selectedRows.length > 0">
          <el-button type="danger" @click="handleBatchDelete" size="small">
            <el-icon><Box /></el-icon> 批量删除 ({{ selectedRows.length }})
          </el-button>
        </div>
        <div v-else></div>
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="total"
          class="pagination"
          @current-change="pagination.page = $event; loadOrders()"
          @size-change="pagination.pageSize = $event; loadOrders()"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px" destroy-on-close>
      <div v-if="dialogType === 'view'">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.orderNumber }}</el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag :type="currentOrder.source === 'erp' ? 'success' : 'info'">
              {{ currentOrder.source === 'erp' ? 'ERP同步' : '本地创建' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="ERP订单号" v-if="currentOrder.erpOrderNumber">{{ currentOrder.erpOrderNumber }}</el-descriptions-item>
          <el-descriptions-item label="供应商">{{ currentOrder.supplierName }}</el-descriptions-item>
          <el-descriptions-item label="物料编号">{{ currentOrder.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="物料名称">{{ currentOrder.materialName }}</el-descriptions-item>
          <el-descriptions-item label="规格型号">{{ currentOrder.specification }}</el-descriptions-item>
          <el-descriptions-item label="数量">{{ currentOrder.quantity }} {{ currentOrder.unit }}</el-descriptions-item>
          <el-descriptions-item label="单价">¥{{ currentOrder.unitPrice?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="总金额">¥{{ currentOrder.totalAmount?.toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="要求交期">{{ currentOrder.deliveryDate }}</el-descriptions-item>
          <el-descriptions-item label="确认交期">{{ currentOrder.confirmedDate || '待确认' }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentOrder.status)">{{ getStatusText(currentOrder.status) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="质检标准" v-if="currentOrder.qualityStandard">{{ currentOrder.qualityStandard }}</el-descriptions-item>
          <el-descriptions-item label="仓库" v-if="currentOrder.warehouse">{{ currentOrder.warehouse }}</el-descriptions-item>
          <el-descriptions-item label="科目" v-if="currentOrder.account">{{ currentOrder.account }}</el-descriptions-item>
          <el-descriptions-item label="税率" v-if="currentOrder.taxRate">{{ currentOrder.taxRate }}%</el-descriptions-item>
          <el-descriptions-item label="财务维度" v-if="currentOrder.financialDimension">{{ currentOrder.financialDimension }}</el-descriptions-item>
        </el-descriptions>

        <el-divider v-if="currentOrder.deliveryInfo" content-position="left">送货信息</el-divider>
        <el-descriptions v-if="currentOrder.deliveryInfo" :column="2" border>
          <el-descriptions-item label="送货单号">{{ currentOrder.deliveryInfo.deliveryNumber }}</el-descriptions-item>
          <el-descriptions-item label="发货时间">{{ currentOrder.deliveryInfo.shipTime }}</el-descriptions-item>
          <el-descriptions-item label="承运商">{{ currentOrder.deliveryInfo.carrier }}</el-descriptions-item>
          <el-descriptions-item label="运单号">{{ currentOrder.deliveryInfo.trackingNumber }}</el-descriptions-item>
          <el-descriptions-item label="附件" :span="2">
            <el-link v-if="currentOrder.deliveryInfo.attachment" :href="currentOrder.deliveryInfo.attachment" target="_blank">下载送货单</el-link>
            <span v-else>无</span>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.deliveryInfo.notes }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div v-if="dialogType === 'confirm'">
        <el-form :model="confirmForm" label-width="100px">
          <el-form-item label="订单号">
            <el-input v-model="confirmForm.orderNumber" disabled />
          </el-form-item>
          <el-form-item label="供应商">
            <el-input v-model="confirmForm.supplierName" disabled />
          </el-form-item>
          <el-form-item label="要求交期">
            <el-input v-model="confirmForm.deliveryDate" disabled />
          </el-form-item>
          <el-form-item label="确认交期" required>
            <el-date-picker v-model="confirmForm.confirmedDate" type="date" placeholder="选择确认交期" style="width: 100%" value-format="YYYY-MM-DD" />
          </el-form-item>
          <el-form-item label="确认备注">
            <el-input v-model="confirmForm.notes" type="textarea" :rows="3" placeholder="可填写备注说明" />
          </el-form-item>
        </el-form>
      </div>

      <div v-if="dialogType === 'delivery'">
        <el-form :model="deliveryForm" label-width="100px">
          <el-form-item label="订单号">
            <el-input v-model="deliveryForm.orderNumber" disabled />
          </el-form-item>
          <el-form-item label="送货单号" required>
            <el-input v-model="deliveryForm.deliveryNumber" placeholder="请输入送货单号" />
          </el-form-item>
          <el-form-item label="发货时间" required>
            <el-date-picker v-model="deliveryForm.shipTime" type="datetime" placeholder="选择发货时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="承运商">
            <el-input v-model="deliveryForm.carrier" placeholder="请输入承运商名称" />
          </el-form-item>
          <el-form-item label="运单号">
            <el-input v-model="deliveryForm.trackingNumber" placeholder="请输入运单号" />
          </el-form-item>
          <el-form-item label="送货附件">
            <el-upload :auto-upload="false" :limit="1" accept=".pdf,.jpg,.png,.doc,.docx">
              <el-button>选择文件</el-button>
              <template #tip>
                <div class="el-upload__tip">支持 PDF、图片、Word 文档</div>
              </template>
            </el-upload>
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="deliveryForm.notes" type="textarea" :rows="3" placeholder="可填写备注说明" />
          </el-form-item>
        </el-form>
      </div>

      <div v-if="dialogType === 'receive'">
        <el-form :model="receiveForm" label-width="100px">
          <el-form-item label="订单号">
            <el-input v-model="receiveForm.orderNumber" disabled />
          </el-form-item>
          <el-form-item label="收货时间" required>
            <el-date-picker v-model="receiveForm.receiveTime" type="datetime" placeholder="选择收货时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
          </el-form-item>
          <el-form-item label="实际收货数量">
            <el-input-number v-model="receiveForm.actualQuantity" :min="0" style="width: 100%" />
          </el-form-item>
          <el-form-item label="入库仓库">
            <el-input v-model="receiveForm.warehouse" placeholder="请输入入库仓库" />
          </el-form-item>
          <el-form-item label="收货人" required>
            <el-input v-model="receiveForm.receiver" placeholder="请输入收货人" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="receiveForm.notes" type="textarea" :rows="3" placeholder="可填写备注说明" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogType === 'confirm'" type="primary" @click="handleConfirmSubmit">确认接单</el-button>
        <el-button v-if="dialogType === 'delivery'" type="primary" @click="handleDeliverySubmit">确认发货</el-button>
        <el-button v-if="dialogType === 'receive'" type="primary" @click="handleReceiveSubmit">确认收货</el-button>
      </template>
    </el-dialog>

    <!-- 高级筛选弹窗 -->
    <el-dialog v-model="showFilterDialog" title="高级筛选" width="600px">
      <el-form :model="advancedFilter" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单来源">
              <el-select v-model="advancedFilter.source" placeholder="请选择来源" clearable>
                <el-option label="ERP同步" value="erp" />
                <el-option label="本地创建" value="local" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="仓库">
              <el-select v-model="advancedFilter.warehouse" placeholder="请选择仓库" clearable>
                <el-option label="一号仓库" value="warehouse1" />
                <el-option label="二号仓库" value="warehouse2" />
                <el-option label="三号仓库" value="warehouse3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="金额范围(最小)">
              <el-input v-model.number="advancedFilter.minAmount" type="number" placeholder="最小金额" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="金额范围(最大)">
              <el-input v-model.number="advancedFilter.maxAmount" type="number" placeholder="最大金额" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料类型">
              <el-select v-model="advancedFilter.materialType" placeholder="请选择类型" clearable>
                <el-option label="原材料" value="raw" />
                <el-option label="辅材" value="auxiliary" />
                <el-option label="设备" value="equipment" />
                <el-option label="服务" value="service" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="是否有附件">
              <el-select v-model="advancedFilter.hasAttachment" placeholder="请选择" clearable>
                <el-option label="有" value="true" />
                <el-option label="无" value="false" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="resetAdvancedFilter">重置</el-button>
        <el-button type="primary" @click="doApplyAdvancedFilter">应用筛选</el-button>
      </template>
    </el-dialog>

    <!-- 列显示配置弹窗 -->
    <el-dialog v-model="showColumnDialog" title="列显示配置" width="500px">
      <div class="column-config">
        <p class="config-tip">勾选要显示的列，固定列无法隐藏</p>
        <el-checkbox-group v-model="selectedColumns" class="column-list">
          <el-row :gutter="20">
            <el-col v-for="col in columnConfig" :key="col.key" :span="12">
              <el-checkbox 
                :key="col.key" 
                :label="col.key" 
                :disabled="col.fixed"
                @change="handleColumnChange(col.key)"
              >
                {{ col.label }}
                <span v-if="col.fixed" class="fixed-tag">固定</span>
              </el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="resetColumnConfig">重置默认</el-button>
        <el-button type="primary" @click="showColumnDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Box, Download, Filter, CircleCheck, Wallet, Delete, Grid, Document, ShoppingCart, Check, ArrowDown } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const filterStatus = ref('')
const filterSource = ref('')
const filterSupplierCode = ref('')
const filterSupplierName = ref('')
const filterMaterialCode = ref('')
const filterOrderNumber = ref('')
const dateRange = ref([])
const showFilterDialog = ref(false)
const showColumnDialog = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 10
})

const total = ref(0)
const tableData = ref([])
const selectedRows = ref([])
const tableRef = ref(null)

const stats = reactive({
  pending: 0,
  confirmed: 0,
  shipped: 0,
  received: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref('view')
const currentOrder = ref({})

const confirmForm = ref({
  orderNumber: '',
  supplierName: '',
  deliveryDate: '',
  confirmedDate: '',
  notes: ''
})

const deliveryForm = ref({
  orderNumber: '',
  deliveryNumber: '',
  shipTime: '',
  carrier: '',
  trackingNumber: '',
  notes: ''
})

const receiveForm = ref({
  orderNumber: '',
  receiveTime: '',
  actualQuantity: 0,
  warehouse: '',
  receiver: '',
  notes: ''
})

const advancedFilter = reactive({
  source: '',
  warehouse: '',
  minAmount: null,
  maxAmount: null,
  materialType: '',
  hasAttachment: ''
})

const columnVisible = reactive({
  orderNumber: true,
  createdAt: true,
  supplierCode: false,
  supplierName: true,
  materialCode: true,
  materialName: true,
  specification: true,
  quantity: true,
  totalAmount: true,
  deliveryDate: true,
  confirmedDate: true,
  status: true,
  warehouse: false,
  createdBy: false,
  attachment: false
})

const columnConfig = [
  { key: 'orderNumber', label: '采购订单号', fixed: true },
  { key: 'createdAt', label: '下单日期', fixed: false },
  { key: 'supplierCode', label: '供应商编码', fixed: false },
  { key: 'supplierName', label: '供应商名称', fixed: true },
  { key: 'materialCode', label: '物料编码', fixed: false },
  { key: 'materialName', label: '物料名称', fixed: false },
  { key: 'specification', label: '规格型号', fixed: false },
  { key: 'quantity', label: '数量', fixed: false },
  { key: 'totalAmount', label: '金额', fixed: false },
  { key: 'deliveryDate', label: '要求交期', fixed: false },
  { key: 'confirmedDate', label: '确认交期', fixed: false },
  { key: 'status', label: '状态', fixed: true },
  { key: 'warehouse', label: '仓库', fixed: false },
  { key: 'createdBy', label: '下单人', fixed: false },
  { key: 'attachment', label: '附件', fixed: false }
]

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchText.value || '',
      status: filterStatus.value || '',
      supplier_code: filterSupplierCode.value || '',
      supplier_name: filterSupplierName.value || '',
      material_code: filterMaterialCode.value || '',
      order_number: filterOrderNumber.value || ''
    })
    if (dateRange.value && dateRange.value.length === 2) {
      params.set('start_date', dateRange.value[0])
      params.set('end_date', dateRange.value[1])
    }
    if (advancedFilter.source) params.set('source', advancedFilter.source)
    if (advancedFilter.warehouse) params.set('warehouse', advancedFilter.warehouse)
    if (advancedFilter.minAmount !== null && advancedFilter.minAmount !== undefined) params.set('min_amount', advancedFilter.minAmount)
    if (advancedFilter.maxAmount !== null && advancedFilter.maxAmount !== undefined) params.set('max_amount', advancedFilter.maxAmount)
    if (advancedFilter.materialType) params.set('material_type', advancedFilter.materialType)
    if (advancedFilter.hasAttachment) params.set('has_attachment', advancedFilter.hasAttachment)
    const response = await fetch(`http://localhost:3001/api/purchase-orders?${params}`)
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        tableData.value = result.data.map(item => ({
          ...item,
          orderNumber: item.order_number,
          erpOrderNumber: item.erp_order_number,
          supplierCode: item.supplier_code,
          supplierName: item.supplier_name,
          materialCode: item.material_code,
          materialName: item.material_name,
          specification: item.specification,
          unit: item.unit,
          unitPrice: item.unit_price,
          totalAmount: item.total_amount,
          deliveryDate: item.delivery_date,
          confirmedDate: item.confirmed_date,
          confirmedBy: item.confirmed_by,
          createdBy: item.created_by,
          warehouse: item.warehouse,
          account: item.account,
          taxRate: item.tax_rate,
          financialDimension: item.financial_dimension,
          source: item.source_system || 'erp',
          attachment: item.attachment,
          createdAt: item.created_at
        }))
        total.value = result.total || 0
        updateStats()
      }
    }
  } catch (error) {
    console.error('获取采购订单失败:', error)
    ElMessage.error('获取采购订单失败')
  } finally {
    loading.value = false
  }
}

function updateStats() {
  stats.pending = tableData.value.filter(item => item.status === 'pending').length
  stats.confirmed = tableData.value.filter(item => item.status === 'confirmed').length
  stats.shipped = tableData.value.filter(item => item.status === 'shipped').length
  stats.received = tableData.value.filter(item => item.status === 'received').length
}

function handleExport() {
  const headers = ['订单号', '供应商编码', '供应商名称', '物料编号', '物料名称', '规格型号', '数量', '单位', '单价', '金额', '要求交期', '确认交期', '状态']
  const rows = tableData.value.map(item => [
    item.orderNumber,
    item.supplierCode,
    item.supplierName,
    item.materialCode,
    item.materialName,
    item.specification,
    item.quantity,
    item.unit,
    item.unitPrice,
    item.totalAmount,
    item.deliveryDate,
    item.confirmedDate || '',
    getStatusText(item.status)
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `采购订单_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  ElMessage.success('导出成功')
}

function handleRefresh() {
  pagination.page = 1
  loadOrders()
  ElMessage.success('数据已刷新')
}

function handleSearch() {
  pagination.page = 1
  loadOrders()
}

const displayData = computed(() => {
  let data = [...tableData.value]
  
  if (filterSource.value) {
    data = data.filter(item => item.source === filterSource.value)
  }
  
  return data
})

const visibleColumns = computed(() => {
  return columnConfig.filter(col => columnVisible[col.key])
})

const selectedColumns = computed({
  get: () => columnConfig.filter(col => columnVisible[col.key]).map(col => col.key),
  set: (val) => {
    columnConfig.forEach(col => {
      if (!col.fixed) {
        columnVisible[col.key] = val.includes(col.key)
      }
    })
  }
})

const allColumnsSelected = computed(() => {
  const nonFixedColumns = columnConfig.filter(col => !col.fixed)
  return nonFixedColumns.every(col => columnVisible[col.key])
})

function handleColumnToggle(command) {
  if (command === 'selectAll') {
    columnConfig.forEach(col => {
      if (!col.fixed) {
        columnVisible[col.key] = true
      }
    })
  } else if (command === 'deselectAll') {
    columnConfig.forEach(col => {
      if (!col.fixed) {
        columnVisible[col.key] = false
      }
    })
  } else {
    const col = columnConfig.find(c => c.key === command)
    if (col && !col.fixed) {
      columnVisible[command] = !columnVisible[command]
    }
  }
}

function getStatusType(status) {
  const types = {
    'pending': 'warning',
    'confirmed': 'primary',
    'to_ship': 'info',
    'shipped': 'success',
    'received': 'success'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    'pending': '待确认',
    'confirmed': '已确认',
    'to_ship': '待发货',
    'shipped': '已发货',
    'received': '已收货'
  }
  return texts[status] || status
}

function formatAmount(amount) {
  if (!amount) return '0.00'
  if (amount >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  }
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function isUrgent(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const diff = (date - now) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 3
}

function handleView(row) {
  dialogType.value = 'view'
  dialogTitle.value = '订单详情'
  currentOrder.value = { ...row }
  dialogVisible.value = true
}

function handleConfirm(row) {
  dialogType.value = 'confirm'
  dialogTitle.value = '确认接单'
  confirmForm.value = {
    orderNumber: row.orderNumber,
    supplierName: row.supplierName,
    deliveryDate: row.deliveryDate,
    confirmedDate: row.confirmedDate || '',
    notes: ''
  }
  dialogVisible.value = true
}

async function handleConfirmSubmit() {
  if (!confirmForm.value.confirmedDate) {
    ElMessage.warning('请选择确认交期')
    return
  }
  
  try {
    const response = await fetch('http://localhost:3001/api/purchase-orders/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: confirmForm.value.orderNumber,
        status: 'confirmed',
        confirmedDate: confirmForm.value.confirmedDate
      })
    })
    
    if (response.ok) {
      const index = tableData.value.findIndex(o => o.orderNumber === confirmForm.value.orderNumber)
      if (index !== -1) {
        tableData.value[index].confirmedDate = confirmForm.value.confirmedDate
        tableData.value[index].status = 'confirmed'
      }
      ElMessage.success('已确认接单')
    } else {
      ElMessage.error('确认接单失败')
    }
  } catch (error) {
    console.error('确认接单失败:', error)
    ElMessage.error('确认接单失败')
  }
  
  dialogVisible.value = false
}

function handleDelivery(row) {
  dialogType.value = 'delivery'
  dialogTitle.value = '发货'
  deliveryForm.value = {
    orderNumber: row.orderNumber,
    deliveryNumber: `DN${new Date().toISOString().split('T')[0].replace(/-/g, '')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    shipTime: '',
    carrier: '',
    trackingNumber: '',
    notes: ''
  }
  dialogVisible.value = true
}

async function handleDeliverySubmit() {
  if (!deliveryForm.value.deliveryNumber) {
    ElMessage.warning('请输入送货单号')
    return
  }
  if (!deliveryForm.value.shipTime) {
    ElMessage.warning('请选择发货时间')
    return
  }
  
  try {
    const response = await fetch('http://localhost:3001/api/purchase-orders/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: deliveryForm.value.orderNumber,
        status: 'shipped'
      })
    })
    
    if (response.ok) {
      const index = tableData.value.findIndex(o => o.orderNumber === deliveryForm.value.orderNumber)
      if (index !== -1) {
        tableData.value[index].status = 'shipped'
        tableData.value[index].deliveryInfo = {
          deliveryNumber: deliveryForm.value.deliveryNumber,
          shipTime: deliveryForm.value.shipTime,
          carrier: deliveryForm.value.carrier,
          trackingNumber: deliveryForm.value.trackingNumber,
          attachment: null,
          notes: deliveryForm.value.notes
        }
      }
      ElMessage.success('已确认发货')
    } else {
      ElMessage.error('发货失败')
    }
  } catch (error) {
    console.error('发货失败:', error)
    ElMessage.error('发货失败')
  }
  
  dialogVisible.value = false
}

function handleReceive(row) {
  dialogType.value = 'receive'
  dialogTitle.value = '收货'
  currentOrder.value = { ...row }
  receiveForm.value = {
    orderNumber: row.orderNumber,
    receiveTime: new Date().toISOString().slice(0, 16),
    actualQuantity: row.quantity,
    warehouse: row.warehouse,
    receiver: '',
    notes: ''
  }
  dialogVisible.value = true
}

async function handleReceiveSubmit() {
  if (!receiveForm.value.receiver) {
    ElMessage.warning('请输入收货人')
    return
  }

  try {
    const response = await fetch('http://localhost:3001/api/purchase-orders/status', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: receiveForm.value.orderNumber,
        status: 'received'
      })
    })

    if (response.ok) {
      const index = tableData.value.findIndex(o => o.orderNumber === receiveForm.value.orderNumber)
      if (index !== -1) {
        tableData.value[index].status = 'received'
        tableData.value[index].actualQuantity = receiveForm.value.actualQuantity
        tableData.value[index].receiver = receiveForm.value.receiver
      }
      ElMessage.success('已确认收货')
    } else {
      ElMessage.error('收货失败')
    }
  } catch (error) {
    console.error('收货失败:', error)
    ElMessage.error('收货失败')
  }

  dialogVisible.value = false
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleBatchConfirm() {
  const pendingOrders = selectedRows.value.filter(row => row.status === 'pending')
  if (pendingOrders.length === 0) {
    ElMessage.warning('请选择待确认的订单')
    return
  }

  ElMessageBox.confirm(`确定要批量确认选中的 ${pendingOrders.length} 个订单吗？`, '批量确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      for (const order of pendingOrders) {
        const response = await fetch('http://localhost:3001/api/purchase-orders/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            status: 'confirmed',
            confirmedDate: new Date().toISOString().split('T')[0]
          })
        })
        if (response.ok) {
          const index = tableData.value.findIndex(o => o.orderNumber === order.orderNumber)
          if (index !== -1) {
            tableData.value[index].status = 'confirmed'
            tableData.value[index].confirmedDate = new Date().toISOString().split('T')[0]
          }
        }
      }
      ElMessage.success(`已成功确认 ${pendingOrders.length} 个订单`)
      selectedRows.value = []
      updateStats()
    } catch (error) {
      console.error('批量确认失败:', error)
      ElMessage.error('批量确认失败')
    }
  }).catch(() => {
    // cancelled
  })
}

function handleBatchShip() {
  const confirmedOrders = selectedRows.value.filter(row => row.status === 'confirmed')
  if (confirmedOrders.length === 0) {
    ElMessage.warning('请选择已确认的订单')
    return
  }

  ElMessageBox.confirm(`确定要批量发货选中的 ${confirmedOrders.length} 个订单吗？`, '批量发货', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      for (const order of confirmedOrders) {
        const response = await fetch('http://localhost:3001/api/purchase-orders/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderNumber: order.orderNumber,
            status: 'shipped'
          })
        })
        if (response.ok) {
          const index = tableData.value.findIndex(o => o.orderNumber === order.orderNumber)
          if (index !== -1) {
            tableData.value[index].status = 'shipped'
          }
        }
      }
      ElMessage.success(`已成功发货 ${confirmedOrders.length} 个订单`)
      selectedRows.value = []
      updateStats()
    } catch (error) {
      console.error('批量发货失败:', error)
      ElMessage.error('批量发货失败')
    }
  }).catch(() => {
    // cancelled
  })
}

function handleBatchDelete() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要删除的订单')
    return
  }

  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个订单吗？`, '批量删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'danger'
  }).then(() => {
    try {
      selectedRows.value.forEach(row => {
        const index = tableData.value.findIndex(item => item.orderNumber === row.orderNumber)
        if (index !== -1) {
          tableData.value.splice(index, 1)
        }
      })
      ElMessage.success(`已成功删除 ${selectedRows.value.length} 个订单`)
      selectedRows.value = []
      updateStats()
    } catch (error) {
      ElMessage.error('批量删除失败')
      console.error('批量删除订单失败:', error)
    }
  }).catch(() => {
    // cancelled
  })
}

function handleDownloadAttachment(row) {
  ElMessage.info('正在下载附件...')
}

function toggleColumnFilter() {
  showColumnDialog.value = true
}

function handleColumnChange(key) {
}

function resetColumnConfig() {
  columnConfig.forEach(col => {
    if (!col.fixed) {
      columnVisible[col.key] = true
    }
  })
  ElMessage.success('已重置为默认列配置')
}

function applyAdvancedFilter() {
  advancedFilter.source = ''
  advancedFilter.warehouse = ''
  advancedFilter.minAmount = null
  advancedFilter.maxAmount = null
  advancedFilter.materialType = ''
  advancedFilter.hasAttachment = ''
  ElMessage.info('筛选条件已重置')
}

function doApplyAdvancedFilter() {
  loading.value = true
  pagination.page = 1
  loadOrders()
  showFilterDialog.value = false
  ElMessage.success('筛选条件已应用')
}

function resetAdvancedFilter() {
  advancedFilter.source = ''
  advancedFilter.warehouse = ''
  advancedFilter.minAmount = null
  advancedFilter.maxAmount = null
  advancedFilter.materialType = ''
  advancedFilter.hasAttachment = ''
  ElMessage.info('筛选条件已重置')
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.content-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: none;
  overflow: hidden;

  :deep(.el-card__body) {
    padding: 0;
  }
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

  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: 10%;
    width: 150px;
    height: 150px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 50%;
  }

  h1 {
    font-size: 26px;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    letter-spacing: 1px;
    position: relative;
    z-index: 1;
  }

  p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
    position: relative;
    z-index: 1;
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
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05) rotate(3deg);
    }

    .el-icon {
      font-size: 28px;
      color: #ffffff;
    }
  }
}

.toolbar {
  margin-bottom: 16px;
  padding: 16px 20px;
  background: #fafafa;
  border-bottom: 1px solid #ebeef5;
}

.toolbar-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 10px;
}

.status-bar {
  display: flex;
  gap: 16px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 10px;
  border: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px 18px;
  border-radius: 8px;
  transition: all 0.25s ease;
  background: #ffffff;
  border: 1px solid transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    background: rgba(64, 158, 255, 0.1);
    border-color: rgba(64, 158, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }

  &.status-active {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border-color: #409eff;
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);

    .status-count {
      color: #ffffff;
    }

    .status-label {
      color: rgba(255, 255, 255, 0.9);
    }
  }
}

.status-count {
  font-size: 22px;
  font-weight: 700;
  color: #409eff;
  line-height: 1;
}

.status-label {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
  line-height: 1;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #ffffff;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 0;
}

.batch-actions {
  display: flex;
  gap: 8px;
}

.table-actions {
  display: flex;
  gap: 8px;
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

    td {
      padding: 12px 0;
    }
  }
}

.order-link {
  color: #409eff;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  border-top: 1px solid #ebeef5;
}

.pagination {
  text-align: right;
}

.date-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
  
  &.confirmed {
    color: #67c23a;
  }
  
  &.urgent {
    color: #f56c6c;
    font-weight: 600;
  }
}

.supplier-name {
  color: #303133;
  font-weight: 500;
}

.quantity-cell {
  color: #606266;
  font-family: 'Monaco', 'Menlo', monospace;
}

.amount-cell {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 500;
  
  &.high-amount {
    color: #f56c6c;
    font-weight: 600;
  }
}

.pending-text {
  color: #909399;
  font-style: italic;
}

.no-data {
  color: #c0c4cc;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.column-config {
  .config-tip {
    color: #909399;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .column-list {
    .el-col {
      margin-bottom: 12px;
    }

    .fixed-tag {
      font-size: 11px;
      color: #e6a23c;
      background: #fdf6ec;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }
  }
}

.fixed-badge {
  font-size: 10px;
  color: #909399;
  background: #f5f7fa;
  padding: 1px 4px;
  border-radius: 3px;
  margin-left: 8px;
}
</style>
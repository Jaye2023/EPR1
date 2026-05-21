<template>
  <div class="inventory-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <div class="search-area">
            <el-input v-model="searchText" placeholder="搜索物料编号/名称" style="width: 200px" clearable @change="loadData">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="filterWarehouse" placeholder="仓库" style="width: 120px" clearable @change="loadData">
              <el-option label="全部" value="" />
              <el-option label="原材料仓" value="原材料仓" />
              <el-option label="成品仓" value="成品仓" />
              <el-option label="辅料仓" value="辅料仓" />
            </el-select>
            <el-select v-model="filterAlert" placeholder="预警状态" style="width: 120px" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option label="库存不足" value="low" />
              <el-option label="库存预警" value="warning" />
              <el-option label="正常" value="normal" />
            </el-select>
            <el-select v-model="sortField" placeholder="排序字段" style="width: 100px" @change="handleSearch">
              <el-option label="物料编号" value="materialCode" />
              <el-option label="库存数量" value="quantity" />
              <el-option label="库存价值" value="totalValue" />
            </el-select>
            <el-select v-model="sortOrder" placeholder="排序方式" style="width: 80px" @change="handleSearch">
              <el-option label="升序" value="asc" />
              <el-option label="降序" value="desc" />
            </el-select>
          </div>
          <div class="action-area">
            <el-button type="primary" @click="handleInStock">
              <el-icon><Download /></el-icon>
              入库
            </el-button>
            <el-button type="warning" @click="handleOutStock">
              <el-icon><Upload /></el-icon>
              出库
            </el-button>
            <el-button type="success" @click="handleStockOp">
              <el-icon><Refresh /></el-icon>
              库存盘点
            </el-button>
            <el-button type="info" @click="handleExport">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-upload
              class="upload-btn"
              :show-file-list="false"
              accept=".csv,.xlsx,.xls"
              :before-upload="beforeUpload"
              @success="handleImportSuccess"
            >
              <el-button type="info">
                <el-icon><Upload /></el-icon>
                导入
              </el-button>
            </el-upload>
            <el-button 
              type="danger" 
              @click="handleBatchOutStock" 
              :disabled="selectedRows.length === 0"
              :loading="batchLoading"
            >
              <el-icon><Upload /></el-icon>
              批量出库 ({{ selectedRows.length }})
            </el-button>
          </div>
        </div>
      </template>

      <el-table ref="tableRef" :data="displayData" border v-loading="loading" stripe :row-key="row => row.materialCode" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :selectable="checkSelectable" />
        <el-table-column prop="materialCode" label="物料编号" width="130" />
        <el-table-column prop="materialName" label="物料名称" min-width="150" />
        <el-table-column prop="specification" label="规格" width="100" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="quantity" label="库存数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: getQuantityColor(row) }">
              {{ row.quantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="availableQuantity" label="可用数量" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.availableQuantity < row.minStock ? '#f56c6c' : '' }">
              {{ row.availableQuantity }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="minStock" label="最低库存" width="90" />
        <el-table-column prop="maxStock" label="最高库存" width="90" />
        <el-table-column prop="unitCost" label="单位成本" width="100">
          <template #default="{ row }">
            <span v-if="row.unitCost">¥{{ row.unitCost.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalValue" label="库存价值" width="110">
          <template #default="{ row }">
            <span v-if="row.totalValue">¥{{ row.totalValue.toFixed(2) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="库位" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getAlertType(row)" size="small">{{ getAlertName(row) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="success" link size="small" @click="handleStockHistory(row)">记录</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="summary-info">
        <span>总物料种类：<strong>{{ total }}</strong> 种</span>
        <span>总库存价值：<strong>¥{{ totalValue.toFixed(2) }}</strong></span>
        <span>库存预警：<strong style="color: #f56c6c">{{ alertCount }}</strong> 种</span>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="inDialogVisible" title="入库" width="700px" destroy-on-close>
      <el-form :model="stockForm" ref="inFormRef" label-width="110px">
        <el-form-item label="关联订单" prop="orderNumber">
          <el-select v-model="stockForm.orderNumber" filterable allow-create placeholder="选择订单号或手动输入" style="width: 100%" @change="handleOrderSelect">
            <el-option v-for="order in pendingOrders" :key="order.orderNumber" :label="`${order.orderNumber} - ${order.productName}`" :value="order.orderNumber" />
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">选择订单后将自动填充物料信息</div>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料编号" prop="materialCode">
              <el-select v-model="stockForm.materialCode" filterable allow-create placeholder="选择或输入物料编号" style="width: 100%" @change="handleMaterialChange">
                <el-option v-for="m in materials" :key="m.materialCode" :label="`${m.materialCode} - ${m.materialName}`" :value="m.materialCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称">
              <el-input v-model="stockForm.materialName" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格型号" prop="specification">
              <el-input v-model="stockForm.specification" placeholder="规格型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="stockForm.unit" placeholder="选择单位" style="width: 100%">
                <el-option label="个" value="个" />
                <el-option label="件" value="件" />
                <el-option label="套" value="套" />
                <el-option label="米" value="米" />
                <el-option label="千克" value="千克" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="入库数量" prop="quantity">
              <el-input-number v-model="stockForm.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入库单价" prop="unitCost">
              <el-input-number v-model="stockForm.unitCost" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="仓库" prop="warehouse">
          <el-select v-model="stockForm.warehouse" placeholder="请选择仓库" style="width: 100%">
            <el-option label="原材料仓" value="原材料仓" />
            <el-option label="成品仓" value="成品仓" />
            <el-option label="辅料仓" value="辅料仓" />
            <el-option label="在途仓" value="在途仓" />
          </el-select>
        </el-form-item>
        <el-form-item label="库位" prop="location">
          <el-input v-model="stockForm.location" placeholder="如: A-01-001" />
        </el-form-item>
        <el-form-item label="入库类型" prop="stockType">
          <el-select v-model="stockForm.stockType" style="width: 100%">
            <el-option label="采购入库" value="采购入库" />
            <el-option label="生产入库" value="生产入库" />
            <el-option label="退货入库" value="退货入库" />
            <el-option label="调拨入库" value="调拨入库" />
            <el-option label="盘点入库" value="盘点入库" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="供应商">
              <el-input v-model="stockForm.supplierName" placeholder="供应商名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="批次号">
              <el-input v-model="stockForm.batchNo" placeholder="如: 20260518001" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="stockForm.note" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInSubmit">确认入库</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="outDialogVisible" title="出库" width="500px" destroy-on-close>
      <el-form :model="stockForm" ref="outFormRef" label-width="100px">
        <el-form-item label="物料" prop="materialCode">
          <el-select v-model="stockForm.materialCode" filterable placeholder="请选择物料" style="width: 100%" @change="handleMaterialChange">
            <el-option v-for="m in materials" :key="m.materialCode" :label="`${m.materialCode} - ${m.materialName}`" :value="m.materialCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="stockForm.materialName" disabled />
        </el-form-item>
        <el-form-item label="可用库存">
          <el-input :value="`${stockForm.availableQuantity || 0} ${stockForm.unit || ''}`" disabled />
        </el-form-item>
        <el-form-item label="出库数量" prop="quantity">
          <el-input-number v-model="stockForm.quantity" :min="1" :max="stockForm.availableQuantity > 0 ? stockForm.availableQuantity : undefined" style="width: 100%" />
        </el-form-item>
        <el-form-item label="仓库" prop="warehouse">
          <el-select v-model="stockForm.warehouse" placeholder="请选择仓库" style="width: 100%">
            <el-option label="原材料仓" value="原材料仓" />
            <el-option label="成品仓" value="成品仓" />
            <el-option label="辅料仓" value="辅料仓" />
          </el-select>
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select v-model="stockForm.stockType" style="width: 100%">
            <el-option label="生产领料" value="生产领料" />
            <el-option label="销售出库" value="销售出库" />
            <el-option label="退货出库" value="退货出库" />
            <el-option label="调拨出库" value="调拨出库" />
            <el-option label="盘点出库" value="盘点出库" />
          </el-select>
        </el-form-item>
        <el-form-item label="参考单号">
          <el-input v-model="stockForm.refNo" placeholder="可选" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="stockForm.note" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOutSubmit">确认出库</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="库存详情" width="600px" destroy-on-close>
      <el-descriptions :column="2" border v-if="selectedMaterial">
        <el-descriptions-item label="物料编号">{{ selectedMaterial.materialCode }}</el-descriptions-item>
        <el-descriptions-item label="物料名称">{{ selectedMaterial.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ selectedMaterial.specification || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ selectedMaterial.unit }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ selectedMaterial.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="库位">{{ selectedMaterial.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="库存数量">{{ selectedMaterial.quantity }} {{ selectedMaterial.unit }}</el-descriptions-item>
        <el-descriptions-item label="可用数量">{{ selectedMaterial.availableQuantity }} {{ selectedMaterial.unit }}</el-descriptions-item>
        <el-descriptions-item label="最低库存">{{ selectedMaterial.minStock }}</el-descriptions-item>
        <el-descriptions-item label="最高库存">{{ selectedMaterial.maxStock }}</el-descriptions-item>
        <el-descriptions-item label="单位成本">
          <span v-if="selectedMaterial.unitCost">¥{{ selectedMaterial.unitCost.toFixed(2) }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="库存价值">
          <span v-if="selectedMaterial.totalValue">¥{{ selectedMaterial.totalValue.toFixed(2) }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getAlertType(selectedMaterial)">{{ getAlertName(selectedMaterial) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ selectedMaterial.updatedAt }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="库存记录" width="700px" destroy-on-close>
      <el-table :data="stockRecords" border size="small">
        <el-table-column prop="recordDate" label="日期" width="110" />
        <el-table-column prop="stockType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.stockType.includes('入库') ? 'success' : 'warning'" size="small">{{ row.stockType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="refNo" label="参考单号" width="140" />
        <el-table-column prop="warehouse" label="仓库" width="90" />
        <el-table-column prop="operator" label="操作人" width="80" />
        <el-table-column prop="note" label="备注" />
      </el-table>
      <el-empty v-if="stockRecords.length === 0" description="暂无记录" />
    </el-dialog>

    <el-dialog v-model="stockOpDialogVisible" title="库存盘点" width="800px" destroy-on-close>
      <el-form :model="stockOpForm" label-width="100px" style="margin-bottom: 20px;">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="盘点仓库" prop="warehouse">
              <el-select v-model="stockOpForm.warehouse" placeholder="请选择仓库" style="width: 100%">
                <el-option label="全部仓库" value="" />
                <el-option label="原材料仓" value="原材料仓" />
                <el-option label="成品仓" value="成品仓" />
                <el-option label="辅料仓" value="辅料仓" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="盘点人" prop="operator">
              <el-input v-model="stockOpForm.operator" placeholder="请输入盘点人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="stockOpForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <div style="margin-bottom: 15px;">
        <el-button type="primary" @click="performStockOp">开始盘点</el-button>
      </div>

      <el-table :data="stockOpResult" border size="small" v-if="stockOpResult.length > 0">
        <el-table-column prop="materialCode" label="物料编号" width="120" />
        <el-table-column prop="materialName" label="物料名称" width="150" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="systemQuantity" label="系统数量" width="100" />
        <el-table-column prop="actualQuantity" label="实际数量" width="100" />
        <el-table-column prop="difference" label="差异" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.difference !== 0 ? '#f56c6c' : '#67c23a' }">{{ row.difference > 0 ? '+' : '' }}{{ row.difference }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="60" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.difference === 0 ? 'success' : 'warning'" size="small">{{ row.difference === 0 ? '一致' : '差异' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="stockOpResult.length === 0" description="点击开始盘点进行库存盘点" />

      <template #footer>
        <el-button @click="stockOpDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStockOp" :disabled="stockOpResult.length === 0">确认盘点结果</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchOutDialogVisible" title="批量出库" width="700px" destroy-on-close>
      <el-form :model="batchOutForm" label-width="100px" style="margin-bottom: 20px;">
        <el-form-item label="出库仓库" prop="warehouse">
          <el-select v-model="batchOutForm.warehouse" placeholder="请选择仓库" style="width: 100%">
            <el-option label="原材料仓" value="原材料仓" />
            <el-option label="成品仓" value="成品仓" />
            <el-option label="辅料仓" value="辅料仓" />
          </el-select>
        </el-form-item>
        <el-form-item label="出库数量" prop="quantity">
          <el-input-number v-model="batchOutForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="出库类型">
          <el-select v-model="batchOutForm.stockType" style="width: 100%">
            <el-option label="销售出库" value="销售出库" />
            <el-option label="生产出库" value="生产出库" />
            <el-option label="调拨出库" value="调拨出库" />
            <el-option label="盘点出库" value="盘点出库" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchOutForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>

      <div style="margin-bottom: 10px;">
        <span style="font-weight: bold;">已选择 {{ selectedRows.length }} 种物料：</span>
      </div>
      <el-table :data="selectedRows" border size="small" max-height="200">
        <el-table-column prop="materialCode" label="物料编号" width="120" />
        <el-table-column prop="materialName" label="物料名称" width="150" />
        <el-table-column prop="warehouse" label="仓库" width="100" />
        <el-table-column prop="availableQuantity" label="可用库存" width="100" />
        <el-table-column prop="unit" label="单位" width="60" />
      </el-table>

      <template #footer>
        <el-button @click="batchOutDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchOutStock">确认批量出库</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Upload, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const filterWarehouse = ref('')
const filterAlert = ref('')
const sortField = ref('materialCode')
const sortOrder = ref('asc')
const currentPage = ref(1)
const pageSize = ref(10)

const allData = ref([])
const materials = ref([])
const tableRef = ref(null)
const selectedRows = ref([])
const batchLoading = ref(false)
const batchOutDialogVisible = ref(false)
const batchOutForm = ref({
  warehouse: '',
  quantity: '',
  stockType: '销售出库',
  remark: ''
})
const inDialogVisible = ref(false)
const outDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const historyDialogVisible = ref(false)
const selectedMaterial = ref(null)
const stockRecords = ref([])

const stockForm = ref({
  orderNumber: '',
  materialCode: '',
  materialName: '',
  specification: '',
  quantity: 1,
  unit: '',
  unitCost: 0,
  warehouse: '',
  location: '',
  stockType: '',
  supplierName: '',
  batchNo: '',
  note: '',
  availableQuantity: 0
})

const pendingOrders = ref([])
const stockOpDialogVisible = ref(false)
const stockOpForm = ref({
  warehouse: '',
  operator: '',
  remark: ''
})
const stockOpResult = ref([])

const filteredData = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.materialCode?.toLowerCase().includes(text) ||
      item.materialName?.toLowerCase().includes(text) ||
      item.specification?.toLowerCase().includes(text)
    )
  }
  if (filterWarehouse.value) {
    data = data.filter(item => item.warehouse === filterWarehouse.value)
  }
  if (filterAlert.value) {
    if (filterAlert.value === 'low') {
      data = data.filter(item => item.availableQuantity < item.minStock)
    } else if (filterAlert.value === 'warning') {
      data = data.filter(item => item.availableQuantity <= item.minStock * 1.2 && item.availableQuantity >= item.minStock)
    } else if (filterAlert.value === 'normal') {
      data = data.filter(item => item.availableQuantity > item.minStock * 1.2)
    }
  }
  
  data.sort((a, b) => {
    const field = sortField.value
    let aVal = a[field]
    let bVal = b[field]
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    
    if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1
    return 0
  })
  
  return data
})

const displayData = computed(() => {
  const data = filteredData.value
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

const total = computed(() => filteredData.value.length)

function handleSearch() {
  currentPage.value = 1
}

function handlePageChange() {
}

function handlePageSizeChange() {
  currentPage.value = 1
}

function handleSelectionChange(val) {
  selectedRows.value = val
}

function checkSelectable(row) {
  return row.quantity > 0
}

function handleBatchOutStock() {
  batchOutForm.value = {
    warehouse: '',
    quantity: 1,
    stockType: '销售出库',
    remark: ''
  }
  batchOutDialogVisible.value = true
}

async function confirmBatchOutStock() {
  const form = batchOutForm.value
  
  if (!form.warehouse) {
    ElMessage.warning('请选择出库仓库')
    return
  }
  if (!form.quantity || form.quantity <= 0) {
    ElMessage.warning('请输入有效的出库数量')
    return
  }

  const insufficientStock = selectedRows.value.filter(row => {
    return row.warehouse === form.warehouse && row.availableQuantity < form.quantity
  })

  if (insufficientStock.length > 0) {
    const names = insufficientStock.map(row => `${row.materialCode}(${row.materialName})`).join(', ')
    ElMessage.warning(`以下物料库存不足：${names}`)
    return
  }

  try {
    batchLoading.value = true
    const response = await fetch('/api/inventory/batch-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materialCodes: selectedRows.value.filter(row => row.warehouse === form.warehouse).map(row => row.materialCode),
        warehouse: form.warehouse,
        quantity: form.quantity,
        stockType: form.stockType,
        remark: form.remark
      })
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success(`批量出库成功，共 ${result.count} 条记录`)
        batchOutDialogVisible.value = false
        selectedRows.value = []
        if (tableRef.value) {
          tableRef.value.clearSelection()
        }
        loadData()
      } else {
        ElMessage.error(result.message || '批量出库失败')
      }
    } else {
      ElMessage.error(`批量出库失败，HTTP状态码: ${response.status}`)
    }
  } catch (error) {
    console.error('批量出库请求失败:', error)
    ElMessage.error('批量出库失败')
  } finally {
    batchLoading.value = false
  }
}

const totalValue = computed(() => {
  return allData.value.reduce((sum, item) => sum + (item.totalValue || 0), 0)
})

const alertCount = computed(() => {
  return allData.value.filter(item => item.availableQuantity < item.minStock).length
})

function getQuantityColor(row) {
  if (row.availableQuantity < row.minStock) return '#f56c6c'
  if (row.availableQuantity <= row.minStock * 1.2) return '#e6a23c'
  return '#303133'
}

function getAlertType(row) {
  if (row.availableQuantity < row.minStock) return 'danger'
  if (row.availableQuantity <= row.minStock * 1.2) return 'warning'
  return 'success'
}

function getAlertName(row) {
  if (row.availableQuantity < row.minStock) return '库存不足'
  if (row.availableQuantity <= row.minStock * 1.2) return '库存预警'
  return '正常'
}

async function loadData() {
  loading.value = true
  try {
    const [invRes, matRes, orderRes] = await Promise.all([
      fetch('/api/inventory'),
      fetch('/api/materials'),
      fetch('/api/erp/orders/pending')
    ])

    if (invRes.ok) {
      const invContentType = invRes.headers.get('content-type')
      if (invContentType?.includes('application/json')) {
        const invResult = await invRes.json()
        if (invResult.success) {
          allData.value = invResult.data
        } else {
          console.error('库存数据返回失败:', invResult.message)
        }
      } else {
        console.error(`库存数据 Content-Type 校验失败: ${invContentType}`)
      }
    } else {
      console.error(`库存数据请求失败: /api/inventory ${invRes.status}`)
      ElMessage.warning(`库存数据加载失败，HTTP状态码: ${invRes.status}`)
    }

    if (matRes.ok) {
      const matContentType = matRes.headers.get('content-type')
      if (matContentType?.includes('application/json')) {
        const matResult = await matRes.json()
        if (matResult.success) {
          materials.value = matResult.data
        } else {
          console.error('物料数据返回失败:', matResult.message)
        }
      } else {
        console.error(`物料数据 Content-Type 校验失败: ${matContentType}`)
      }
    } else {
      console.warn(`物料数据请求失败: /api/materials ${matRes.status}`)
      if (matRes.status === 404) {
        materials.value = getMockMaterials()
        console.info('使用本地模拟物料数据')
      }
    }

    if (orderRes.ok) {
      const orderContentType = orderRes.headers.get('content-type')
      if (orderContentType?.includes('application/json')) {
        const orderResult = await orderRes.json()
        if (orderResult.success) {
          pendingOrders.value = orderResult.data.filter(order => 
            order.status === '待采购' || order.status === '待生产' || order.status === '待发货'
          )
        } else {
          console.error('订单数据返回失败:', orderResult.message)
        }
      } else {
        console.error(`订单数据 Content-Type 校验失败: ${orderContentType}`)
      }
    } else {
      console.warn(`待入库订单数据请求失败: /api/erp/orders/pending ${orderRes.status}`)
      pendingOrders.value = getMockPendingOrders()
      console.info('使用本地模拟订单数据')
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    console.error('错误详情:', error.message)
  } finally {
    loading.value = false
  }
}

function getMockMaterials() {
  return [
    { materialCode: 'M-CU-2501', materialName: '铜丝 2.5mm', unit: 'kg', specification: 'CU-2.5mm' },
    { materialCode: 'M-CU-1501', materialName: '铜丝 1.5mm', unit: 'kg', specification: 'CU-1.5mm' },
    { materialCode: 'M-CU-1001', materialName: '铜丝 1.0mm', unit: 'kg', specification: 'CU-1.0mm' },
    { materialCode: 'P-IP-10A3', materialName: '工业插头 10A', unit: '个', specification: 'IP-10A 三极' },
    { materialCode: 'P-IP-16A3', materialName: '工业插头 16A', unit: '个', specification: 'IP-16A 三极' },
    { materialCode: 'M-WR-3X15', materialName: '电源线 3*1.5', unit: '米', specification: '3*1.5mm²' },
    { materialCode: 'M-WR-3X25', materialName: '电源线 3*2.5', unit: '米', specification: '3*2.5mm²' },
    { materialCode: 'A-PVC-001', materialName: 'PVC绝缘套管', unit: '米', specification: 'Φ20mm' },
    { materialCode: 'A-RB-UNI', materialName: '橡胶护套', unit: '个', specification: '通用型' },
    { materialCode: 'A-TR-20P', materialName: '端子排 20位', unit: '个', specification: 'TR-20P' }
  ]
}

function getMockPendingOrders() {
  return [
    { orderNumber: 'PO20260518001', materialCode: 'M-CU-2501', productName: '铜丝 2.5mm', quantity: 500, unit: 'kg', unitPrice: 45.00, status: '待采购', supplierName: '东莞市铜业公司', warehouse: '原材料仓' },
    { orderNumber: 'PO20260518002', materialCode: 'M-WR-3X15', productName: '电源线 3*1.5', quantity: 1000, unit: '米', unitPrice: 8.50, status: '待采购', supplierName: '深圳电线厂', warehouse: '原材料仓' },
    { orderNumber: 'MO20260518001', materialCode: 'P-IP-10A3', productName: '工业插头 10A', quantity: 200, unit: '个', unitPrice: 6.80, status: '待生产', warehouse: '成品仓' },
    { orderNumber: 'SO20260518001', materialCode: 'P-IP-10A3', productName: '插头 10A 三极', quantity: 150, unit: '个', unitPrice: 35.00, status: '待发货', warehouse: '成品仓' },
    { orderNumber: 'PO20260518003', materialCode: 'A-PVC-001', productName: 'PVC绝缘套管', quantity: 300, unit: '米', unitPrice: 2.80, status: '待采购', supplierName: '深圳塑料制品厂', warehouse: '辅料仓' }
  ]
}

function handleOrderSelect(orderNumber) {
  if (!orderNumber) return
  
  const order = pendingOrders.value.find(o => o.orderNumber === orderNumber)
  if (order) {
    stockForm.value.materialCode = order.materialCode
    stockForm.value.materialName = order.productName
    stockForm.value.specification = order.materialCode || ''
    stockForm.value.quantity = order.quantity
    stockForm.value.unit = order.unit
    stockForm.value.unitCost = order.unitPrice
    stockForm.value.supplierName = order.supplierName || ''
    stockForm.value.warehouse = order.warehouse || ''
    
    const material = materials.value.find(m => m.materialCode === order.materialCode)
    if (material) {
      stockForm.value.specification = material.specification || stockForm.value.specification
      stockForm.value.unit = material.unit || stockForm.value.unit
    }
    
    if (order.orderType === '采购' || order.status === '待采购') {
      stockForm.value.stockType = '采购入库'
    } else if (order.orderType === '生产' || order.status === '待生产') {
      stockForm.value.stockType = '生产入库'
    } else {
      stockForm.value.stockType = '采购入库'
    }
    
    ElMessage.success(`已关联订单 ${orderNumber}，自动填充物料信息`)
  }
}

function handleMaterialChange(code) {
  const mat = materials.value.find(m => m.materialCode === code)
  if (mat) {
    stockForm.value.materialName = mat.materialName
    stockForm.value.specification = mat.specification || ''
    stockForm.value.unit = mat.unit || '个'
  }
  const inv = allData.value.find(i => i.materialCode === code)
  stockForm.value.availableQuantity = inv ? inv.availableQuantity : 0
  if (inv) {
    stockForm.value.warehouse = inv.warehouse || stockForm.value.warehouse
    stockForm.value.location = inv.location || ''
    stockForm.value.unitCost = inv.unitCost || stockForm.value.unitCost
  }
}

function handleInStock() {
  stockForm.value = {
    orderNumber: '',
    materialCode: '',
    materialName: '',
    specification: '',
    quantity: 1,
    unit: '个',
    unitCost: 0,
    warehouse: '',
    location: '',
    stockType: '采购入库',
    supplierName: '',
    batchNo: '',
    note: '',
    availableQuantity: 0
  }
  inDialogVisible.value = true
}

function handleOutStock() {
  stockForm.value = {
    materialCode: '',
    materialName: '',
    quantity: 1,
    warehouse: '',
    stockType: '生产领料',
    refNo: '',
    note: '',
    availableQuantity: 0,
    unit: ''
  }
  outDialogVisible.value = true
}

async function handleInSubmit() {
  const form = stockForm.value
  
  if (!form.materialCode) {
    ElMessage.warning('请选择或输入物料编号')
    return
  }
  if (!form.quantity || form.quantity <= 0) {
    ElMessage.warning('请输入有效的入库数量')
    return
  }
  if (!form.warehouse) {
    ElMessage.warning('请选择入库仓库')
    return
  }
  if (!form.unit) {
    ElMessage.warning('请选择单位')
    return
  }
  
  try {
    const response = await fetch('/api/inventory/in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: form.orderNumber,
        materialCode: form.materialCode,
        materialName: form.materialName,
        specification: form.specification,
        quantity: form.quantity,
        unit: form.unit,
        unitCost: form.unitCost,
        warehouse: form.warehouse,
        location: form.location,
        stockType: form.stockType,
        supplierName: form.supplierName,
        batchNo: form.batchNo,
        note: form.note
      })
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('入库成功')
        inDialogVisible.value = false
        loadData()
      } else {
        ElMessage.error(result.message || '入库失败')
      }
    } else {
      ElMessage.error(`入库失败，HTTP状态码: ${response.status}`)
    }
  } catch (error) {
    console.error('入库请求失败:', error)
    ElMessage.error('入库失败，请稍后重试')
  }
}

async function handleOutSubmit() {
  if (!stockForm.value.materialCode || !stockForm.value.quantity || !stockForm.value.warehouse) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (stockForm.value.quantity > stockForm.value.availableQuantity) {
    ElMessage.warning('出库数量不能超过可用库存')
    return
  }
  try {
    const response = await fetch('/api/inventory/out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockForm.value)
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('出库成功')
        outDialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error('出库失败')
  }
}

function handleView(row) {
  selectedMaterial.value = { ...row }
  detailDialogVisible.value = true
}

async function handleStockHistory(row) {
  try {
    const response = await fetch(`/api/inventory/${row.materialCode}/records`)
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        stockRecords.value = result.data
      }
    }
  } catch {
    stockRecords.value = []
  }
  historyDialogVisible.value = true
}

function handleStockOp() {
  stockOpForm.value = {
    warehouse: '',
    operator: '',
    remark: ''
  }
  stockOpResult.value = []
  stockOpDialogVisible.value = true
}

function performStockOp() {
  const warehouse = stockOpForm.value.warehouse
  let data = [...allData.value]
  
  if (warehouse) {
    data = data.filter(item => item.warehouse === warehouse)
  }
  
  stockOpResult.value = data.map(item => ({
    materialCode: item.materialCode,
    materialName: item.materialName,
    warehouse: item.warehouse,
    systemQuantity: item.quantity,
    actualQuantity: item.quantity,
    difference: 0,
    unit: item.unit || '',
    status: '一致'
  }))
  
  ElMessage.success(`盘点完成，共 ${stockOpResult.value.length} 种物料`)
}

async function confirmStockOp() {
  if (!stockOpForm.value.operator) {
    ElMessage.warning('请输入盘点人')
    return
  }
  
  const differences = stockOpResult.value.filter(item => item.difference !== 0)
  if (differences.length > 0) {
    ElMessage.confirm(`发现 ${differences.length} 项库存差异，确认要调整库存吗？`, '确认盘点', {
      confirmButtonText: '确认调整',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(async () => {
      try {
        const response = await fetch('/api/inventory/stock-op', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            warehouse: stockOpForm.value.warehouse,
            operator: stockOpForm.value.operator,
            remark: stockOpForm.value.remark,
            items: stockOpResult.value
          })
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            ElMessage.success('盘点完成，库存已更新')
            stockOpDialogVisible.value = false
            loadData()
          } else {
            ElMessage.error(result.message || '盘点失败')
          }
        } else {
          ElMessage.error(`盘点失败，HTTP状态码: ${response.status}`)
        }
      } catch (error) {
        console.error('盘点请求失败:', error)
        ElMessage.error('盘点失败')
      }
    }).catch(() => {
      ElMessage.info('已取消盘点')
    })
  } else {
    try {
      const response = await fetch('/api/inventory/stock-op', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          warehouse: stockOpForm.value.warehouse,
          operator: stockOpForm.value.operator,
          remark: stockOpForm.value.remark,
          items: stockOpResult.value
        })
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          ElMessage.success('盘点完成，库存无差异')
          stockOpDialogVisible.value = false
          loadData()
        } else {
          ElMessage.error(result.message || '盘点失败')
        }
      } else {
        ElMessage.error(`盘点失败，HTTP状态码: ${response.status}`)
      }
    } catch (error) {
      console.error('盘点请求失败:', error)
      ElMessage.error('盘点失败')
    }
  }
}

async function handleExport() {
  try {
    const data = filteredData.value
    if (data.length === 0) {
      ElMessage.warning('没有可导出的数据')
      return
    }
    
    const headers = ['物料编号', '物料名称', '规格', '仓库', '库存数量', '可用数量', '单位', '最低库存', '最高库存', '单位成本', '库存价值', '库位', '状态']
    const rows = data.map(item => [
      item.materialCode,
      item.materialName,
      item.specification || '',
      item.warehouse,
      item.quantity,
      item.availableQuantity,
      item.unit || '',
      item.minStock || '',
      item.maxStock || '',
      item.unitCost ? `¥${item.unitCost.toFixed(2)}` : '',
      item.totalValue ? `¥${item.totalValue.toFixed(2)}` : '',
      item.location || '',
      getAlertName(item)
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `库存数据_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    
    ElMessage.success('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

function beforeUpload(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['csv', 'xlsx', 'xls'].includes(ext)) {
    ElMessage.warning('只支持 CSV、XLSX、XLS 格式文件')
    return false
  }
  return true
}

function handleImportSuccess(response, file) {
  try {
    const result = typeof response === 'string' ? JSON.parse(response) : response
    if (result.success) {
      ElMessage.success(`成功导入 ${result.count} 条记录`)
      loadData()
    } else {
      ElMessage.error(result.message || '导入失败')
    }
  } catch (error) {
    console.error('导入解析失败:', error)
    ElMessage.error('导入失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.inventory-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-area {
  display: flex;
  gap: 10px;
}

.action-area {
  display: flex;
  gap: 10px;
}

.summary-info {
  margin-top: 15px;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  gap: 30px;
  font-size: 14px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.upload-btn {
  display: inline-block;
}

.upload-btn .el-button {
  padding: 8px 16px;
}
</style>

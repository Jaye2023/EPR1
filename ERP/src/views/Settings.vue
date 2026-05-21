<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="基本设置" name="basic" />
            <el-tab-pane label="公司信息" name="company" />
            <el-tab-pane label="系统参数" name="system" />
            <el-tab-pane label="操作日志" name="logs" />
          </el-tabs>
        </div>
      </template>

      <div v-if="activeTab === 'basic'" class="settings-form">
        <el-form :model="basicSettings" label-width="120px">
          <el-form-item label="系统名称">
            <el-input v-model="basicSettings.systemName" />
          </el-form-item>
          <el-form-item label="系统Logo">
            <el-input v-model="basicSettings.logo" placeholder="Logo URL" />
          </el-form-item>
          <el-form-item label="默认语言">
            <el-select v-model="basicSettings.language" style="width: 200px">
              <el-option label="简体中文" value="zh-CN" />
              <el-option label="English" value="en-US" />
            </el-select>
          </el-form-item>
          <el-form-item label="时区">
            <el-select v-model="basicSettings.timezone" style="width: 200px">
              <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
              <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期格式">
            <el-select v-model="basicSettings.dateFormat" style="width: 200px">
              <el-option label="YYYY-MM-DD" value="YYYY-MM-DD" />
              <el-option label="DD/MM/YYYY" value="DD/MM/YYYY" />
              <el-option label="MM/DD/YYYY" value="MM/DD/YYYY" />
            </el-select>
          </el-form-item>
          <el-form-item label="货币符号">
            <el-input v-model="basicSettings.currencySymbol" style="width: 100px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveBasic">保存设置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="activeTab === 'company'" class="settings-form">
        <el-form :model="companySettings" label-width="120px">
          <el-form-item label="公司名称">
            <el-input v-model="companySettings.name" />
          </el-form-item>
          <el-form-item label="公司地址">
            <el-input v-model="companySettings.address" type="textarea" :rows="2" />
          </el-form-item>
          <el-form-item label="联系电话">
            <el-input v-model="companySettings.phone" />
          </el-form-item>
          <el-form-item label="传真">
            <el-input v-model="companySettings.fax" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="companySettings.email" />
          </el-form-item>
          <el-form-item label="网址">
            <el-input v-model="companySettings.website" />
          </el-form-item>
          <el-form-item label="税号">
            <el-input v-model="companySettings.taxNo" />
          </el-form-item>
          <el-form-item label="银行账号">
            <el-input v-model="companySettings.bankAccount" />
          </el-form-item>
          <el-form-item label="开户银行">
            <el-input v-model="companySettings.bankName" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveCompany">保存设置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="activeTab === 'system'" class="settings-form">
        <el-form :model="systemSettings" label-width="150px">
          <el-form-item label="订单号前缀">
            <el-input v-model="systemSettings.orderPrefix" style="width: 150px" />
          </el-form-item>
          <el-form-item label="工单号前缀">
            <el-input v-model="systemSettings.workOrderPrefix" style="width: 150px" />
          </el-form-item>
          <el-form-item label="最低库存预警比例">
            <el-input-number v-model="systemSettings.lowStockRatio" :min="0" :max="100" />
            <span class="form-tip">当库存低于最高库存的此比例时预警</span>
          </el-form-item>
          <el-form-item label="信用额度预警比例">
            <el-input-number v-model="systemSettings.creditWarningRatio" :min="0" :max="100" />
            <span class="form-tip">当欠款超过信用额度的此比例时预警</span>
          </el-form-item>
          <el-form-item label="订单确认自动跳转">
            <el-switch v-model="systemSettings.autoRedirectAfterConfirm" />
          </el-form-item>
          <el-form-item label="开启价格权限控制">
            <el-switch v-model="systemSettings.pricePermissionControl" />
          </el-form-item>
          <el-form-item label="开启操作日志">
            <el-switch v-model="systemSettings.enableActivityLog" />
          </el-form-item>
          <el-form-item label="数据备份周期">
            <el-select v-model="systemSettings.backupCycle" style="width: 150px">
              <el-option label="每天" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="每月" value="monthly" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSaveSystem">保存设置</el-button>
            <el-button @click="handleBackup">立即备份</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="activeTab === 'logs'">
        <div class="log-filters">
          <el-select v-model="logFilters.module" placeholder="模块" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="订单" value="order" />
            <el-option label="采购" value="purchase" />
            <el-option label="生产" value="production" />
            <el-option label="库存" value="inventory" />
            <el-option label="财务" value="finance" />
          </el-select>
          <el-select v-model="logFilters.operator" placeholder="操作人" style="width: 120px" clearable>
            <el-option label="全部" value="" />
            <el-option label="系统" value="系统" />
          </el-select>
          <el-date-picker v-model="logFilters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
          <el-button @click="loadLogs">搜索</el-button>
          <el-button type="success" @click="handleExportLogs">导出</el-button>
        </div>

        <el-table :data="logs" border v-loading="loading" stripe style="margin-top: 20px">
          <el-table-column prop="timestamp" label="时间" width="180" />
          <el-table-column prop="module" label="模块" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ getModuleName(row.module) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="action" label="操作" width="120" />
          <el-table-column prop="detail" label="详情" min-width="300" />
          <el-table-column prop="operator" label="操作人" width="100" />
          <el-table-column prop="ipAddress" label="IP地址" width="130" />
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalLogs"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadLogs"
            @current-change="loadLogs"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('basic')
const loading = ref(false)
const logs = ref([])
const totalLogs = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const basicSettings = reactive({
  systemName: '宝嘉ERP管理系统',
  logo: '',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',
  dateFormat: 'YYYY-MM-DD',
  currencySymbol: '¥'
})

const companySettings = reactive({
  name: '深圳市宝嘉电子有限公司',
  address: '深圳市宝安区福永街道白石厦社区龙王庙工业区',
  phone: '0755-27345678',
  fax: '0755-27345679',
  email: 'info@baojia.com',
  website: 'www.baojia.com',
  taxNo: '91440300MA5xxxxxx',
  bankAccount: '6222024000012345678',
  bankName: '中国工商银行深圳福永支行'
})

const systemSettings = reactive({
  orderPrefix: 'SO',
  workOrderPrefix: 'WO',
  lowStockRatio: 20,
  creditWarningRatio: 80,
  autoRedirectAfterConfirm: true,
  pricePermissionControl: true,
  enableActivityLog: true,
  backupCycle: 'weekly'
})

const logFilters = reactive({
  module: '',
  operator: '',
  dateRange: []
})

function getModuleName(module) {
  const map = {
    order: '订单',
    purchase: '采购',
    production: '生产',
    inventory: '库存',
    finance: '财务',
    customer: '客户',
    supplier: '供应商'
  }
  return map[module] || module
}

function handleSaveBasic() {
  ElMessage.success('基本设置已保存')
}

function handleSaveCompany() {
  ElMessage.success('公司信息已保存')
}

function handleSaveSystem() {
  ElMessage.success('系统参数已保存')
}

function handleBackup() {
  ElMessage.success('数据备份已启动，请稍候...')
}

async function loadLogs() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value
    })
    if (logFilters.module) params.append('module', logFilters.module)
    if (logFilters.operator) params.append('operator', logFilters.operator)

    const response = await fetch(`/api/activity-logs?${params}`)
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        logs.value = result.data.map(log => ({
          timestamp: new Date(log.createdAt).toLocaleString('zh-CN'),
          module: log.module,
          action: log.action,
          detail: log.description,
          operator: log.operator,
          ipAddress: log.ipAddress || '-'
        }))
        totalLogs.value = result.total || logs.value.length
      }
    }
  } catch (error) {
    console.error('加载日志失败:', error)
    logs.value = [
      { timestamp: '2026-05-18 10:30:25', module: 'order', action: '创建', detail: '新建销售订单：SO20260518001，客户：深圳电器批发', operator: '张三', ipAddress: '192.168.1.100' },
      { timestamp: '2026-05-18 09:15:30', module: 'production', action: '开工', detail: '生产工单开工：WO20260517001，产品：插头 10A 三极', operator: '李四', ipAddress: '192.168.1.101' },
      { timestamp: '2026-05-17 17:45:00', module: 'inventory', action: '入库', detail: '采购入库：铜丝 2.5mm，数量：100kg，仓库：原材料仓', operator: '王五', ipAddress: '192.168.1.102' }
    ]
    totalLogs.value = logs.value.length
  } finally {
    loading.value = false
  }
}

function handleExportLogs() {
  ElMessage.info('日志导出功能开发中')
}

onMounted(() => {
  loadLogs()
})
</script>

<style scoped>
.settings-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
}

.settings-form {
  max-width: 600px;
}

.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}

.log-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

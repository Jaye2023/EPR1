<template>
  <div class="tail-processings-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>尾部处理</el-breadcrumb-item>
    </el-breadcrumb>

    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span>尾部处理价格列表</span>
          <div class="flex gap-2">
            <el-button type="success" @click="openImportDialog">
              <el-icon><Upload /></el-icon> 导入
            </el-button>
            <el-button @click="exportCsv">导出CSV</el-button>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon> 添加尾部处理
            </el-button>
          </div>
        </div>
      </template>

      <div class="flex gap-3 mb-4">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索名称、关键词..."
          style="width: 240px"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" @selection-change="handleSelectionChange" border>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="keywords" label="关键词" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.keywords?.join(', ') || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="price" label="单价(元)" width="100" align="right">
          <template #default="{ row }">
            ¥{{ row.price?.toFixed(4) || '0.0000' }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="flex justify-between items-center mt-4">
        <el-button v-if="selectedRows.length > 0" type="danger" @click="handleBatchDelete">
          批量删除 ({{ selectedRows.length }})
        </el-button>
        <div v-else></div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="关键词" prop="keywords">
          <el-select
            v-model="form.keywords"
            multiple
            filterable
            allow-create
            default-first-option
            style="width: 100%"
            placeholder="输入关键词后按回车添加"
          >
            <el-option v-for="kw in existingKeywords" :key="kw" :label="kw" :value="kw" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单价(元)" prop="price">
              <el-input-number v-model="form.price" :min="0" :precision="4" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" style="width: 100%">
                <el-option label="元/次" value="次" />
                <el-option label="元/个" value="个" />
                <el-option label="元/米" value="米" />
                <el-option label="元/条" value="条" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog v-model="importDialogVisible" title="导入尾部处理价格" width="500px">
      <div class="import-section">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :on-change="handleFileChange"
          :file-list="fileList"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">支持 .xlsx, .xls, .csv 格式，文件大小不超过 10MB</div>
          </template>
        </el-upload>

        <div class="mt-4">
          <el-link type="primary" @click="downloadTemplate('tail-processings')">下载导入模板</el-link>
        </div>

        <div class="import-notes mt-4">
          <p><strong>导入说明：</strong></p>
          <ul>
            <li>名称（必填）：尾部处理名称</li>
            <li>类型：处理类型</li>
            <li>单位：单位（元/次、元/个等）</li>
            <li>价格：单价（元）</li>
            <li>描述：描述信息</li>
            <li>状态：active（启用）/ inactive（禁用）</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleImport" :loading="importing">开始导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { tailProcessingsApi } from '../api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const loading = ref(false)
const submitting = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const existingKeywords = ref([])

const searchKeyword = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')

// 导入相关
const importDialogVisible = ref(false)
const importing = ref(false)
const uploadRef = ref()
const fileList = ref([])
const importFile = ref(null)

function openImportDialog() {
  importDialogVisible.value = true
  fileList.value = []
  importFile.value = null
}

function handleFileChange(file, files) {
  importFile.value = file.raw
  fileList.value = files
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', importFile.value)

    const result = await tailProcessingsApi.import(formData)

    if (result.success) {
      ElMessage.success(`导入完成：成功 ${result.success} 条，失败 ${result.failed} 条`)
      if (result.errors && result.errors.length > 0) {
        console.error('导入错误:', result.errors)
      }
      importDialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '导入失败')
    }
  } catch (error) {
    ElMessage.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

function downloadTemplate(type) {
  const templates = {
    'tail-processings': [
      { 名称: '尾部脱皮半剥', 类型: '剥皮', 单位: '次', 价格: 0.05, 描述: '尾部脱皮半剥处理', 状态: 'active' },
      { 名称: '尾部全剥', 类型: '剥皮', 单位: '次', 价格: 0.08, 描述: '尾部全剥处理', 状态: 'active' },
      { 名称: '尾部沾锡', 类型: '沾锡', 单位: '次', 价格: 0.06, 描述: '尾部沾锡处理', 状态: 'active' },
      { 名称: '尾部压端子', 类型: '端子', 单位: '个', 价格: 0.12, 描述: '尾部压接端子', 状态: 'active' }
    ]
  }

  const headers = Object.keys(templates[type][0])
  const csvContent = [
    headers.join(','),
    ...templates[type].map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${type}-template.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const formRef = ref()
const form = reactive({
  id: null,
  name: '',
  keywords: [],
  price: 0,
  unit: '次',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }]
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value
    }
    const data = await tailProcessingsApi.list(params)
    tableData.value = data.tailProcessings || []
    pagination.total = data.total || 0

    const allKeywords = new Set()
    tableData.value.forEach(item => {
      if (item.keywords) {
        item.keywords.forEach(kw => allKeywords.add(kw))
      }
    })
    existingKeywords.value = Array.from(allKeywords)
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function openAddDialog() {
  dialogTitle.value = '添加尾部处理'
  form.id = null
  Object.assign(form, {
    name: '',
    keywords: [],
    price: 0,
    unit: '次',
    remark: ''
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑尾部处理'
  form.id = row.id
  Object.assign(form, {
    name: row.name,
    keywords: row.keywords || [],
    price: row.price || 0,
    unit: row.unit || '次',
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    if (form.id) {
      await tailProcessingsApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await tailProcessingsApi.create(form)
      ElMessage.success('添加成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定删除 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await tailProcessingsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 个尾部处理吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = selectedRows.value.map(row => row.id)
    await tailProcessingsApi.batchDelete(ids)
    ElMessage.success('批量删除成功')
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

async function exportCsv() {
  ElMessage.info('正在导出...')
  try {
    await tailProcessingsApi.exportCsv()
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error(error.message || '导出失败')
  }
}

onMounted(() => {
  loadData()
})
</script>
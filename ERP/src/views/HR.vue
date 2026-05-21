<template>
  <div class="hr-container">
    <el-card>
      <template #header>
        <div class="toolbar">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="员工管理" name="employee" />
            <el-tab-pane label="考勤记录" name="attendance" />
            <el-tab-pane label="工资发放" name="salary" />
          </el-tabs>
          <div class="action-area">
            <el-button type="primary" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
          </div>
        </div>
        <div class="filter-area">
          <el-input v-model="searchText" placeholder="姓名/工号" style="width: 200px" clearable @change="loadData">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterDepartment" placeholder="部门" style="width: 120px" clearable @change="loadData">
            <el-option label="全部" value="" />
            <el-option label="生产部" value="生产部" />
            <el-option label="销售部" value="销售部" />
            <el-option label="采购部" value="采购部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="行政部" value="行政部" />
          </el-select>
        </div>
      </template>

      <el-table v-if="activeTab === 'employee'" :data="employeeData" border v-loading="loading" stripe>
        <el-table-column prop="employeeNo" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="60" />
        <el-table-column prop="department" label="部门" width="100" />
        <el-table-column prop="position" label="岗位" width="100" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="idCard" label="身份证号" width="170" />
        <el-table-column prop="joinDate" label="入职日期" width="110" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === '在职' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else-if="activeTab === 'attendance'" :data="attendanceData" border v-loading="loading" stripe>
        <el-table-column prop="employeeNo" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column prop="checkIn" label="上班打卡" width="100" />
        <el-table-column prop="checkOut" label="下班打卡" width="100" />
        <el-table-column prop="workHours" label="工时" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAttendanceType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" />
      </el-table>

      <el-table v-else :data="salaryData" border v-loading="loading" stripe>
        <el-table-column prop="employeeNo" label="工号" width="100" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="baseSalary" label="基本工资" width="110">
          <template #default="{ row }">
            <span>¥{{ row.baseSalary.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="bonus" label="奖金" width="100">
          <template #default="{ row }">
            <span>¥{{ (row.bonus || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="deduction" label="扣款" width="100">
          <template #default="{ row }">
            <span style="color: #f56c6c">¥{{ (row.deduction || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="netSalary" label="实发工资" width="110">
          <template #default="{ row }">
            <span style="color: #67c23a">¥{{ row.netSalary.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已发放' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" @click="handlePay(row)">发放</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="form" ref="formRef" label-width="100px">
        <el-form-item label="工号">
          <el-input v-model="form.employeeNo" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender">
            <el-radio label="男" />
            <el-radio label="女" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-select v-model="form.department" style="width: 100%">
            <el-option label="生产部" value="生产部" />
            <el-option label="销售部" value="销售部" />
            <el-option label="采购部" value="采购部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="行政部" value="行政部" />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="position">
          <el-input v-model="form.position" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" />
        </el-form-item>
        <el-form-item label="入职日期" prop="joinDate">
          <el-date-picker v-model="form.joinDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="基本工资" prop="baseSalary">
          <el-input-number v-model="form.baseSalary" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

const loading = ref(false)
const activeTab = ref('employee')
const searchText = ref('')
const filterDepartment = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const selectedEmployee = ref(null)

const employeeData = ref([])
const attendanceData = ref([])
const salaryData = ref([])

const form = ref({
  employeeNo: '',
  name: '',
  gender: '男',
  department: '',
  position: '',
  phone: '',
  idCard: '',
  joinDate: '',
  baseSalary: 5000,
  status: '在职'
})

const dialogTitle = computed(() => {
  if (activeTab.value === 'employee') return isEdit.value ? '编辑员工' : '新增员工'
  return '记录'
})

function getAttendanceType(status) {
  if (status === '正常') return 'success'
  if (status === '迟到' || status === '早退') return 'warning'
  if (status === '旷工') return 'danger'
  return 'info'
}

function generateEmployeeNo() {
  return `EMP${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`
}

async function loadData() {
  loading.value = true
  try {
    if (activeTab.value === 'employee') {
      const response = await fetch('/api/hr/employees')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          employeeData.value = result.data.filter(e => {
            if (searchText.value) {
              return e.name?.includes(searchText.value) || e.employeeNo?.includes(searchText.value)
            }
            if (filterDepartment.value) {
              return e.department === filterDepartment.value
            }
            return true
          })
        }
      }
    } else if (activeTab.value === 'attendance') {
      const response = await fetch('/api/hr/attendance')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          attendanceData.value = result.data
        }
      }
    } else {
      const response = await fetch('/api/hr/salary')
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          salaryData.value = result.data
        }
      }
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  if (activeTab.value === 'employee') {
    form.value = {
      employeeNo: generateEmployeeNo(),
      name: '',
      gender: '男',
      department: '生产部',
      position: '',
      phone: '',
      idCard: '',
      joinDate: '',
      baseSalary: 5000,
      status: '在职'
    }
    isEdit.value = false
    dialogVisible.value = true
  }
}

function handleEdit(row) {
  form.value = { ...row }
  isEdit.value = true
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!form.value.name || !form.value.department) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const url = isEdit.value ? `/api/hr/employees/${form.value.employeeNo}` : '/api/hr/employees'
    const method = isEdit.value ? 'PUT' : 'POST'
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('保存成功')
        dialogVisible.value = false
        loadData()
      }
    }
  } catch {
    ElMessage.error('保存失败')
  }
}

async function handleDelete(row) {
  try {
    const response = await fetch(`/api/hr/employees/${row.employeeNo}`, { method: 'DELETE' })
    if (response.ok) {
      ElMessage.success('删除成功')
      loadData()
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handlePay(row) {
  try {
    const response = await fetch(`/api/hr/salary/${row.id}/pay`, { method: 'POST' })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        ElMessage.success('工资发放成功')
        loadData()
      }
    }
  } catch {
    ElMessage.error('发放失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.hr-container {
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-area {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.action-area {
  display: flex;
  gap: 10px;
}
</style>

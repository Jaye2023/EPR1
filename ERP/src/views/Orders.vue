<template>
  <div class="page-container">
    <div class="page-header">
      <h1>订单管理</h1>
      <p>管理生产订单和销售订单</p>
    </div>

    <el-card>
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchText" placeholder="搜索订单号/产品" style="width: 240px" clearable @change="handleSearch" @input="handleSearch">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select v-model="filterType" placeholder="订单类型" style="width: 120px" clearable @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="生产" value="生产" />
            <el-option label="销售" value="销售" />
            <el-option label="采购" value="采购" />
          </el-select>
          <el-select v-model="filterStatus" placeholder="订单状态" style="width: 120px" clearable @change="handleSearch">
            <el-option label="全部" value="" />
            <el-option label="待生产" value="待生产" />
            <el-option label="生产中" value="生产中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
            <el-option label="待发货" value="待发货" />
            <el-option label="已发货" value="已发货" />
            <el-option label="待采购" value="待采购" />
            <el-option label="已收货" value="已收货" />
          </el-select>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 300px"
            clearable
            @change="handleSearch"
          />
        </div>
        <div class="action-area">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增订单
          </el-button>
          <el-button type="success" @click="handleGenerateProduction">
            <el-icon><Plus /></el-icon>
            销售订单转生产订单
          </el-button>
          <el-button type="warning" @click="handleSyncToSRM">
            <el-icon><Share /></el-icon>
            同步采购到SRM
          </el-button>
          <el-button type="info" @click="handleSyncFromSRM">
            <el-icon><Refresh /></el-icon>
            从SRM同步
          </el-button>
        </div>
      </div>

      <el-table :data="displayData" border style="width: 100%" v-loading="loading">
        <el-table-column prop="orderNumber" label="订单号" width="150" fixed />
        <el-table-column prop="orderType" label="订单类型" width="90">
          <template #default="{ row }">
            <el-tag :type="getOrderTypeTag(row.orderType)" size="small">
              {{ row.orderType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="物料编号" width="110" />
        <el-table-column prop="description" label="产品描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="supplierName" label="供应商" width="120" show-overflow-tooltip />
        <el-table-column prop="customerPartNo" label="客户料号" width="110" />
        <el-table-column prop="partNo" label="料号" width="90" />
        <el-table-column prop="plugModel" label="插头型号" width="110" />
        <el-table-column prop="wireSpec" label="电线规格" width="110" />
        <el-table-column prop="length" label="长度(米)" width="90" align="right">
          <template #default="{ row }">
            {{ row.length ? row.length + 'm' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="tailProcessing" label="尾部处理" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.tailProcessing" type="info" size="small">
              {{ row.tailProcessing }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色" width="80">
          <template #default="{ row }">
            <span v-if="row.color" :style="{ color: getColorValue(row.color) }" class="color-tag">
              {{ row.color }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="客户" width="120" show-overflow-tooltip />
        <el-table-column prop="quantity" label="数量" width="90" align="right">
          <template #default="{ row }">
            {{ row.quantity }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template #default="{ row }">
            ¥{{ row.unitPrice?.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" width="110" align="right">
          <template #default="{ row }">
            <strong style="color: #f56c6c">¥{{ row.totalAmount?.toFixed(2) }}</strong>
          </template>
        </el-table-column>
        <el-table-column prop="orderDate" label="下单日期" width="110" />
        <el-table-column prop="deliveryDate" label="交付日期" width="110" />
        <el-table-column prop="srmSynced" label="SRM同步" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.orderType === '采购'" :type="row.srmSynced ? 'success' : 'info'" size="small">
              {{ row.srmSynced ? '已同步' : '未同步' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(command) => handleStatusChange(row, command)">
              <el-button type="primary" link size="small">
                变更状态
                <el-icon class="el-icon--right"><caret-bottom /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-if="row.status !== '待生产'" command="待生产">待生产</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== '生产中'" command="生产中">生产中</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== '已完成'" command="已完成">已完成</el-dropdown-item>
                  <el-dropdown-item v-if="row.status !== '已取消'" command="已取消">已取消</el-dropdown-item>
                  <el-dropdown-item v-if="row.orderType === '销售' && row.status !== '待发货'" command="待发货">待发货</el-dropdown-item>
                  <el-dropdown-item v-if="row.orderType === '销售' && row.status !== '已发货'" command="已发货">已发货</el-dropdown-item>
                  <el-dropdown-item v-if="row.orderType === '采购' && row.status !== '待采购'" command="待采购">待采购</el-dropdown-item>
                  <el-dropdown-item v-if="row.orderType === '采购' && row.status !== '已收货'" command="已收货">已收货</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link size="small" @click="handleView(row)">详情</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
        <div class="summary">
          共 {{ total }} 条订单，总金额：<strong>¥{{ totalAmount.toFixed(2) }}</strong>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="订单类型" prop="orderType">
              <el-radio-group v-model="form.orderType" @change="handleOrderTypeChange">
                <el-radio label="生产">生产订单</el-radio>
                <el-radio label="销售">销售订单</el-radio>
                <el-radio label="采购">采购订单</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
                <el-form-item label="订单号">
                  <el-input :value="previewOrderNumber || '自动生成'" disabled />
                </el-form-item>
              </el-col>
          <el-col :span="12">
            <el-form-item label="物料编号" prop="materialCode">
              <el-select v-model="form.materialCode" filterable allow-create placeholder="输入物料编号或选择已有产品" style="width: 100%" @change="handlematerialCodeChange">
                <el-option v-for="product in productMaster" :key="product.materialCode" :label="`${product.materialCode} - ${product.productName}`" :value="product.materialCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="产品描述" prop="description">
              <el-input v-model="form.description" placeholder="产品描述" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="产品名称" prop="productName">
              <el-input v-model="form.productName" placeholder="请输入产品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户料号" prop="customerPartNo">
              <el-input v-model="form.customerPartNo" placeholder="客户料号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="料号" prop="partNo">
              <el-input v-model="form.partNo" placeholder="料号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="插头型号" prop="plugModel">
              <el-input v-model="form.plugModel" placeholder="如: 10A三极插头" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电线规格" prop="wireSpec">
              <el-input v-model="form.wireSpec" placeholder="如: 3*1.5mm²" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="长度(米)" prop="length">
              <el-input-number v-model="form.length" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="尾部处理" prop="tailProcessing">
              <el-select v-model="form.tailProcessing" placeholder="请选择尾部处理" style="width: 100%">
                <el-option label="压接" value="压接" />
                <el-option label="焊接" value="焊接" />
                <el-option label="镀锡" value="镀锡" />
                <el-option label="剥线" value="剥线" />
                <el-option label="端子" value="端子" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="颜色" prop="color">
              <el-select v-model="form.color" placeholder="请选择颜色" style="width: 100%">
                <el-option label="红色" value="红色" />
                <el-option label="黑色" value="黑色" />
                <el-option label="白色" value="白色" />
                <el-option label="蓝色" value="蓝色" />
                <el-option label="黄色" value="黄色" />
                <el-option label="绿色" value="绿色" />
                <el-option label="棕色" value="棕色" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户" prop="customerName">
              <el-select v-model="form.customerName" placeholder="请选择客户" style="width: 100%" @change="handleCustomerChange">
                <el-option v-for="customer in customerList" :key="customer.customerNo" :label="customer.customerName" :value="customer.customerName" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="客户编号" prop="customerNo">
              <el-input v-model="form.customerNo" placeholder="客户编号" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        <div v-if="form.orderType === '销售'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="收款条件" prop="paymentTerms">
                <el-select v-model="form.paymentTerms" placeholder="请选择收款条件" style="width: 100%">
                  <el-option label="货到付款" value="货到付款" />
                  <el-option label="预付款30%" value="预付款30%" />
                  <el-option label="月结30天" value="月结30天" />
                  <el-option label="月结60天" value="月结60天" />
                  <el-option label="月结90天" value="月结90天" />
                  <el-option label="现款现货" value="现款现货" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="税率(%)" prop="taxRate">
                <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div v-if="form.orderType === '生产'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生产线" prop="productionLine">
                <el-select v-model="form.productionLine" placeholder="请选择生产线" style="width: 100%">
                  <el-option label="A生产线" value="A生产线" />
                  <el-option label="B生产线" value="B生产线" />
                  <el-option label="C生产线" value="C生产线" />
                  <el-option label="D生产线" value="D生产线" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划工时(小时)" prop="planWorkHours">
                <el-input-number v-model="form.planWorkHours" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="计划开工时间" prop="planStartDate">
                <el-date-picker v-model="form.planStartDate" type="datetime" placeholder="选择日期时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="计划完工时间" prop="planEndDate">
                <el-date-picker v-model="form.planEndDate" type="datetime" placeholder="选择日期时间" style="width: 100%" value-format="YYYY-MM-DD HH:mm:ss" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="BOM用料" prop="bomItems">
                <el-input v-model="form.bomItems" type="textarea" placeholder="输入BOM用料清单，每行一项" :rows="3" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <div v-if="form.orderType === '采购'">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="供应商" prop="supplierName">
                <el-select v-model="form.supplierName" placeholder="请选择供应商" style="width: 100%" @change="handleSupplierChange">
                  <el-option v-for="supplier in supplierList" :key="supplier.supplierCode" :label="supplier.supplierName" :value="supplier.supplierName" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="供应商编号" prop="supplierCode">
                <el-input v-model="form.supplierCode" placeholder="供应商编号" disabled />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="预算(元)" prop="budget">
                <el-input-number v-model="form.budget" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="科目" prop="account">
                <el-select v-model="form.account" placeholder="请选择科目" style="width: 100%">
                  <el-option label="原材料" value="原材料" />
                  <el-option label="辅料" value="辅料" />
                  <el-option label="设备" value="设备" />
                  <el-option label="服务" value="服务" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="税率(%)" prop="taxRate">
                <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="仓库" prop="warehouse">
                <el-select v-model="form.warehouse" placeholder="请选择仓库" style="width: 100%">
                  <el-option label="原材料仓" value="原材料仓" />
                  <el-option label="成品仓" value="成品仓" />
                  <el-option label="辅料仓" value="辅料仓" />
                  <el-option label="在途仓" value="在途仓" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="含税单价" prop="taxIncludedPrice">
                <el-input-number v-model="form.taxIncludedPrice" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="财务维度" prop="financialDimension">
                <el-select v-model="form.financialDimension" placeholder="请选择财务维度" style="width: 100%">
                  <el-option label="研发项目A" value="研发项目A" />
                  <el-option label="生产项目B" value="生产项目B" />
                  <el-option label="管理费用" value="管理费用" />
                  <el-option label="销售费用" value="销售费用" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="质检标准" prop="qualityStandard">
                <el-input v-model="form.qualityStandard" placeholder="输入质检标准" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="送货批次" prop="deliveryBatch">
                <el-input-number v-model="form.deliveryBatch" :min="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="单位" prop="unit">
              <el-select v-model="form.unit" placeholder="请选择单位" style="width: 100%">
                <el-option label="个" value="个" />
                <el-option label="件" value="件" />
                <el-option label="套" value="套" />
                <el-option label="米" value="米" />
                <el-option label="千克" value="千克" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价" prop="unitPrice">
              <el-input-number v-model="form.unitPrice" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下单日期" prop="orderDate">
              <el-date-picker v-model="form.orderDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="交付日期" prop="deliveryDate">
              <el-date-picker v-model="form.deliveryDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="待生产" value="待生产" />
                <el-option label="生产中" value="生产中" />
                <el-option label="已完成" value="已完成" />
                <el-option label="已取消" value="已取消" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="800px" destroy-on-close>
      <el-tabs v-if="selectedOrder">
        <el-tab-pane label="订单详情">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单号">{{ selectedOrder.orderNumber }}</el-descriptions-item>
            <el-descriptions-item label="订单类型">
              <el-tag :type="getOrderTypeTag(selectedOrder.orderType)" size="small">
                {{ selectedOrder.orderType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="订单状态">
              <el-tag :type="getStatusType(selectedOrder.status)" size="small">
                {{ selectedOrder.status }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="下单日期">{{ selectedOrder.orderDate }}</el-descriptions-item>
            <el-descriptions-item label="交付日期">{{ selectedOrder.deliveryDate }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ selectedOrder.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="物料编号">{{ selectedOrder.materialCode }}</el-descriptions-item>
            <el-descriptions-item label="产品名称">{{ selectedOrder.productName }}</el-descriptions-item>
            <el-descriptions-item label="产品描述" :span="2">{{ selectedOrder.description }}</el-descriptions-item>
            <el-descriptions-item label="客户料号">{{ selectedOrder.customerPartNo }}</el-descriptions-item>
            <el-descriptions-item label="料号">{{ selectedOrder.partNo }}</el-descriptions-item>
            <el-descriptions-item label="插头型号">{{ selectedOrder.plugModel || '-' }}</el-descriptions-item>
            <el-descriptions-item label="电线规格">{{ selectedOrder.wireSpec || '-' }}</el-descriptions-item>
            <el-descriptions-item label="长度">{{ selectedOrder.length ? selectedOrder.length + 'm' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="尾部处理">{{ selectedOrder.tailProcessing || '-' }}</el-descriptions-item>
            <el-descriptions-item label="颜色">
              <span v-if="selectedOrder.color" :style="{ color: getColorValue(selectedOrder.color) }">
                {{ selectedOrder.color }}
              </span>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="客户">{{ selectedOrder.customerName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ selectedOrder.supplierName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="数量">{{ selectedOrder.quantity }} {{ selectedOrder.unit }}</el-descriptions-item>
            <el-descriptions-item label="单价">¥{{ selectedOrder.unitPrice?.toFixed(2) }}</el-descriptions-item>
            <el-descriptions-item label="总金额" :span="2">
              <strong style="color: #f56c6c; font-size: 18px">
                ¥{{ selectedOrder.totalAmount?.toFixed(2) }}
              </strong>
            </el-descriptions-item>
            <template v-if="selectedOrder.orderType === '生产'">
              <el-descriptions-item label="生产线">{{ selectedOrder.productionLine || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划工时">{{ selectedOrder.planWorkHours ? selectedOrder.planWorkHours + '小时' : '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划开工">{{ selectedOrder.planStartDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="计划完工">{{ selectedOrder.planEndDate || '-' }}</el-descriptions-item>
              <el-descriptions-item label="BOM用料" :span="2">{{ selectedOrder.bomItems || '-' }}</el-descriptions-item>
            </template>
            <template v-if="selectedOrder.orderType === '销售'">
              <el-descriptions-item label="收款条件">{{ selectedOrder.paymentTerms || '-' }}</el-descriptions-item>
              <el-descriptions-item label="税率">{{ selectedOrder.taxRate ? selectedOrder.taxRate + '%' : '-' }}</el-descriptions-item>
            </template>
            <template v-if="selectedOrder.orderType === '采购'">
              <el-descriptions-item label="供应商编号">{{ selectedOrder.supplierCode || '-' }}</el-descriptions-item>
              <el-descriptions-item label="SRM同步">
                <el-tag :type="selectedOrder.srmSynced ? 'success' : 'info'" size="small">
                  {{ selectedOrder.srmSynced ? '已同步' : '未同步' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预算">{{ selectedOrder.budget ? '¥' + selectedOrder.budget.toFixed(2) : '-' }}</el-descriptions-item>
              <el-descriptions-item label="科目">{{ selectedOrder.account || '-' }}</el-descriptions-item>
              <el-descriptions-item label="仓库">{{ selectedOrder.warehouse || '-' }}</el-descriptions-item>
              <el-descriptions-item label="税率">{{ selectedOrder.taxRate ? selectedOrder.taxRate + '%' : '-' }}</el-descriptions-item>
            </template>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="操作日志" name="logs">
          <el-table :data="orderLogs" v-loading="logsLoading" max-height="400">
            <el-table-column prop="createdAt" label="操作时间" width="180" />
            <el-table-column prop="operator" label="操作人" width="100" />
            <el-table-column prop="content" label="操作内容" />
          </el-table>
          <el-empty v-if="!logsLoading && orderLogs.length === 0" description="暂无操作日志" />
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEditFromDetail">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Share, CaretBottom, Refresh } from '@element-plus/icons-vue'

const loading = ref(false)
const searchText = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const detailDialogVisible = ref(false)
const selectedOrder = ref(null)
const dateRange = ref(null)
const orderLogs = ref([])
const logsLoading = ref(false)
const allData = ref([])

const productMaster = [
  { materialCode: 'P-CU-2501', productName: '铜丝 2.5mm', description: 'CU-2.5mm 裸铜丝 纯铜导体', customerPartNo: 'CU-2.5mm-001', partNo: 'F-001', plugModel: '-', wireSpec: '2.5mm²', length: null, tailProcessing: '-', color: '红色', unit: 'kg', unitPrice: 45.00 },
  { materialCode: 'P-CU-1501', productName: '铜丝 1.5mm', description: 'CU-1.5mm 裸铜丝 纯铜导体', customerPartNo: 'CU-1.5mm-002', partNo: 'F-004', plugModel: '-', wireSpec: '1.5mm²', length: null, tailProcessing: '-', color: '红色', unit: 'kg', unitPrice: 48.00 },
  { materialCode: 'P-CU-1001', productName: '铜丝 1.0mm', description: 'CU-1.0mm 裸铜丝 纯铜导体', customerPartNo: 'CU-1.0mm-003', partNo: 'F-010', plugModel: '-', wireSpec: '1.0mm²', length: null, tailProcessing: '-', color: '红色', unit: 'kg', unitPrice: 52.00 },
  { materialCode: 'P-PL-10A1', productName: '家用插座 10A', description: 'PL-10A 家用三极插座 白色面板', customerPartNo: 'PL10A-K001', partNo: 'F-002', plugModel: '10A三极插头', wireSpec: '-', length: null, tailProcessing: '端子', color: '白色', unit: '个', unitPrice: 12.50 },
  { materialCode: 'P-PL-16A1', productName: '家用插座 16A', description: 'PL-16A 家用三极插座 白色面板', customerPartNo: 'PL16A-K001', partNo: 'F-011', plugModel: '16A三极插头', wireSpec: '-', length: null, tailProcessing: '端子', color: '白色', unit: '个', unitPrice: 15.80 },
  { materialCode: 'P-IP-10A3', productName: '插头 10A 三极', description: 'IP-10A 工业插头 3*1.5mm² 30米 压接端子 白色', customerPartNo: 'MD-IP-003', partNo: 'S-104', plugModel: '10A三极插头', wireSpec: '3*1.5mm²', length: 30, tailProcessing: '端子', color: '白色', unit: '个', unitPrice: 6.80 },
  { materialCode: 'P-IP-16A3', productName: '工业插头 16A', description: 'IP-16A 工业插头 3*2.5mm² 50米 压接端子 黑色', customerPartNo: 'HG-16A-P001', partNo: 'S-101', plugModel: '16A工业插头', wireSpec: '3*2.5mm²', length: 50, tailProcessing: '压接', color: '黑色', unit: '个', unitPrice: 35.00 },
  { materialCode: 'P-IP-32A3', productName: '工业插座 32A', description: 'IP-32A 工业插座 3*4mm² 20米 焊接端子 黑色', customerPartNo: 'DG-IP-32A', partNo: 'S-105', plugModel: '32A工业插座', wireSpec: '3*4mm²', length: 20, tailProcessing: '焊接', color: '黑色', unit: '个', unitPrice: 85.00 },
  { materialCode: 'P-WR-3X15', productName: '电源线 3*1.5', description: 'WR-3X15 柔性电源线 3*1.5mm² 100米 镀锡 棕色', customerPartNo: 'SZ-PWR-001', partNo: 'S-102', plugModel: '-', wireSpec: '3*1.5mm²', length: 100, tailProcessing: '镀锡', color: '棕色', unit: '米', unitPrice: 8.50 },
  { materialCode: 'P-WR-3X25', productName: '电源线 3*2.5', description: 'WR-3X25 柔性电源线 3*2.5mm² 100米 镀锡 棕色', customerPartNo: 'SZ-PWR-002', partNo: 'S-107', plugModel: '-', wireSpec: '3*2.5mm²', length: 100, tailProcessing: '镀锡', color: '棕色', unit: '米', unitPrice: 12.00 },
  { materialCode: 'P-WR-25R', productName: '电线 2.5mm 红', description: 'WR-25R 单芯电线 2.5mm² 100米 剥线 红色', customerPartNo: 'JZ-WR-25R', partNo: 'S-103', plugModel: '-', wireSpec: '2.5mm²', length: 100, tailProcessing: '剥线', color: '红色', unit: '米', unitPrice: 3.20 },
  { materialCode: 'P-WR-25B', productName: '电线 2.5mm 黑', description: 'WR-25B 单芯电线 2.5mm² 100米 剥线 黑色', customerPartNo: 'JZ-WR-25B', partNo: 'S-108', plugModel: '-', wireSpec: '2.5mm²', length: 100, tailProcessing: '剥线', color: '黑色', unit: '米', unitPrice: 3.20 },
  { materialCode: 'P-WR-25W', productName: '电线 2.5mm 白', description: 'WR-25W 单芯电线 2.5mm² 100米 剥线 白色', customerPartNo: 'JZ-WR-25W', partNo: 'S-109', plugModel: '-', wireSpec: '2.5mm²', length: 100, tailProcessing: '剥线', color: '白色', unit: '米', unitPrice: 3.20 },
  { materialCode: 'P-CB-3X4', productName: '电缆线 3*4mm', description: 'CB-3X4 重型电缆 3*4mm² 200米 镀锡 黑色', customerPartNo: 'GW-CB-3X4', partNo: 'S-106', plugModel: '-', wireSpec: '3*4mm²', length: 200, tailProcessing: '镀锡', color: '黑色', unit: '米', unitPrice: 18.00 },
  { materialCode: 'P-CB-3X6', productName: '电缆线 3*6mm', description: 'CB-3X6 重型电缆 3*6mm² 200米 镀锡 黑色', customerPartNo: 'GW-CB-3X6', partNo: 'S-110', plugModel: '-', wireSpec: '3*6mm²', length: 200, tailProcessing: '镀锡', color: '黑色', unit: '米', unitPrice: 25.00 },
  { materialCode: 'P-TB-20P', productName: 'PVC绝缘套管', description: 'TB-20P PVC绝缘保护套管 白色', customerPartNo: '-', partNo: 'F-003', plugModel: '-', wireSpec: '-', length: null, tailProcessing: '-', color: '白色', unit: '米', unitPrice: 2.80 },
  { materialCode: 'P-HT-UNI', productName: '橡胶护套', description: 'HT-UNI 通用型橡胶保护护套 黑色', customerPartNo: '-', partNo: 'F-005', plugModel: '-', wireSpec: '-', length: null, tailProcessing: '-', color: '黑色', unit: '个', unitPrice: 1.50 },
  { materialCode: 'P-TR-20P', productName: '端子排 20位', description: 'TR-20P 接线端子排 20位 蓝色', customerPartNo: '-', partNo: 'F-006', plugModel: '-', wireSpec: '-', length: null, tailProcessing: '-', color: '蓝色', unit: '个', unitPrice: 5.20 },
  { materialCode: 'P-TR-10P', productName: '端子排 10位', description: 'TR-10P 接线端子排 10位 蓝色', customerPartNo: '-', partNo: 'F-012', plugModel: '-', wireSpec: '-', length: null, tailProcessing: '-', color: '蓝色', unit: '个', unitPrice: 3.00 }
]

async function autoFillBymaterialCode(materialCode) {
  if (!materialCode) return
  
  const localProduct = productMaster.find(p => p.materialCode === materialCode)
  if (localProduct) {
    form.description = localProduct.description
    form.productName = localProduct.productName
    form.customerPartNo = localProduct.customerPartNo
    form.partNo = localProduct.partNo
    form.plugModel = localProduct.plugModel
    form.wireSpec = localProduct.wireSpec
    form.length = localProduct.length
    form.tailProcessing = localProduct.tailProcessing
    form.color = localProduct.color
    form.unit = localProduct.unit
    form.unitPrice = localProduct.unitPrice
    ElMessage.success(`已自动匹配本地产品: ${localProduct.productName}`)
    return
  }
  
  try {
    const response = await fetch(`/api/products/item/${encodeURIComponent(materialCode)}`)
    if (response.ok) {
      const product = await response.json()
      form.materialCode = product.materialCode || materialCode
      form.description = product.description || ''
      form.productName = product.plugModel ? `${product.plugModel} ${product.color || ''}`.trim() : product.materialCode || ''
      form.customerPartNo = product.customerPartNo || ''
      form.partNo = product.processCard || product.partNo || ''
      form.plugModel = product.plugModel || ''
      form.wireSpec = product.wireSpec || ''
      form.length = product.length || null
      form.tailProcessing = product.tailProcessing || ''
      form.color = product.color || ''
      form.unit = product.unit || 'pcs'
      form.unitPrice = product.unitPrice || 0
      ElMessage.success(`已从报价系统匹配产品: ${product.materialCode}`)
    } else {
      ElMessage.warning(`物料编号 ${materialCode} 在本地和报价系统中均未找到`)
    }
  } catch (error) {
    console.error('调用报价系统API失败:', error)
    ElMessage.error(`物料编号 ${materialCode} 在本地未找到，调用报价系统API失败`)
  }
}

async function loadData() {
  loading.value = true
  try {
    const response = await fetch('/api/erp/orders')
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.data) {
        allData.value = result.data.map(order => ({
          ...order,
          totalAmount: (order.quantity || 0) * (order.unitPrice || 0)
        }))
      }
    } else {
      console.error('加载订单数据失败:', response.status)
    }
  } catch (error) {
    console.error('加载订单数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const displayData = computed(() => {
  let data = [...allData.value]

  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.orderNumber.toLowerCase().includes(text) ||
      item.productName.toLowerCase().includes(text) ||
      item.materialCode?.toLowerCase().includes(text)
    )
  }

  if (filterType.value) {
    data = data.filter(item => item.orderType === filterType.value)
  }

  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }

  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = dateRange.value[0]
    const endDate = dateRange.value[1]
    data = data.filter(item => {
      const orderDate = new Date(item.orderDate)
      return orderDate >= startDate && orderDate <= endDate
    })
  }

  const start = (currentPage.value - 1) * pageSize.value
  return data.slice(start, start + pageSize.value)
})

const total = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.orderNumber.toLowerCase().includes(text) ||
      item.productName.toLowerCase().includes(text) ||
      item.materialCode?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.orderType === filterType.value)
  }
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = dateRange.value[0]
    const endDate = dateRange.value[1]
    data = data.filter(item => {
      const orderDate = new Date(item.orderDate)
      return orderDate >= startDate && orderDate <= endDate
    })
  }
  return data.length
})

const totalAmount = computed(() => {
  let data = [...allData.value]
  if (searchText.value) {
    const text = searchText.value.toLowerCase()
    data = data.filter(item =>
      item.orderNumber.toLowerCase().includes(text) ||
      item.productName.toLowerCase().includes(text) ||
      item.materialCode?.toLowerCase().includes(text)
    )
  }
  if (filterType.value) {
    data = data.filter(item => item.orderType === filterType.value)
  }
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = dateRange.value[0]
    const endDate = dateRange.value[1]
    data = data.filter(item => {
      const orderDate = new Date(item.orderDate)
      return orderDate >= startDate && orderDate <= endDate
    })
  }
  return data.reduce((sum, item) => sum + item.totalAmount, 0)
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref()
const editingOrder = ref(null)

const customerList = [
  { customerNo: 'C001', customerName: '华工机械' },
  { customerNo: 'C002', customerName: '深圳电子厂' },
  { customerNo: 'C003', customerName: '美的集团' },
  { customerNo: 'C004', customerName: '东莞工厂' },
  { customerNo: 'C005', customerName: '国家电网' },
  { customerNo: 'C006', customerName: '建筑公司A' },
  { customerNo: 'C999', customerName: '内部使用' }
]

const supplierList = [
  { supplierCode: 'S001', supplierName: '东莞市铜业公司' },
  { supplierCode: 'S002', supplierName: '深圳塑料制品厂' },
  { supplierCode: 'S003', supplierName: '广州机械设备公司' },
  { supplierCode: 'S004', supplierName: '物流运输服务' }
]

const form = reactive({
  orderType: '生产',
  materialCode: '',
  description: '',
  customerPartNo: '',
  partNo: '',
  plugModel: '',
  wireSpec: '',
  length: null,
  tailProcessing: '',
  color: '',
  productName: '',
  customerName: '',
  customerNo: '',
  paymentTerms: '',
  taxRate: 13,
  quantity: 1,
  unit: '个',
  unitPrice: 0,
  orderDate: '',
  deliveryDate: '',
  status: '待生产',
  productionLine: '',
  planWorkHours: 0,
  planStartDate: '',
  planEndDate: '',
  bomItems: '',
  supplierName: '',
  supplierCode: '',
  budget: 0,
  account: '',
  warehouse: '',
  taxIncludedPrice: 0,
  financialDimension: '',
  qualityStandard: '',
  deliveryBatch: 1,
  srmSynced: false
})

function handleCustomerChange() {
  const customer = customerList.find(c => c.customerName === form.customerName)
  form.customerNo = customer?.customerNo || ''
}

function handleSupplierChange() {
  const supplier = supplierList.find(s => s.supplierName === form.supplierName)
  form.supplierCode = supplier?.supplierCode || ''
}

function handlematerialCodeChange(materialCode) {
  if (materialCode) {
    autoFillBymaterialCode(materialCode)
  }
}

const rules = {
  orderType: [{ required: true, message: '请选择订单类型', trigger: 'change' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  orderDate: [{ required: true, message: '请选择下单日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function getStatusType(status) {
  const types = { '待生产': 'info', '生产中': 'primary', '已完成': 'success', '已取消': 'danger', '已转生产': 'warning', '待发货': 'warning', '已发货': 'success' }
  return types[status] || 'info'
}

function getOrderTypeTag(type) {
  const types = { '生产': 'primary', '销售': 'success', '采购': 'warning' }
  return types[type] || 'info'
}

function getColorValue(color) {
  const colors = {
    '红色': '#f56c6c',
    '黑色': '#303133',
    '白色': '#606266',
    '蓝色': '#409eff',
    '黄色': '#e6a23c',
    '绿色': '#67c23a',
    '棕色': '#a06207'
  }
  return colors[color] || '#606266'
}

function handleSearch() {
  currentPage.value = 1
}

function handleSizeChange() {
  currentPage.value = 1
}

function handleCurrentChange() {
}

function getDefaultDeliveryDate(orderDate) {
  if (!orderDate) return ''
  const date = new Date(orderDate)
  date.setDate(date.getDate() + 7)
  return date.toISOString().split('T')[0]
}

function handleAdd() {
  dialogTitle.value = '新增订单'
  editingOrder.value = null
  const today = new Date().toISOString().split('T')[0]
  Object.assign(form, {
    orderType: '生产',
    materialCode: '',
    description: '',
    customerPartNo: '',
    partNo: '',
    plugModel: '',
    wireSpec: '',
    length: null,
    tailProcessing: '',
    color: '',
    productName: '',
    customerName: '',
    customerNo: '',
    supplierName: '',
    supplierCode: '',
    quantity: 1,
    unit: '个',
    unitPrice: 0,
    orderDate: today,
    deliveryDate: getDefaultDeliveryDate(today),
    status: '待生产',
    productionLine: '',
    planWorkHours: null,
    planStartDate: '',
    planEndDate: '',
    bomItems: '',
    paymentTerms: '',
    taxRate: 13,
    budget: null,
    account: '',
    warehouse: '',
    srmSynced: false
  })
  previewOrderNumber.value = generateUniqueOrderNumber('生产')
  dialogVisible.value = true
}

const previewOrderNumber = ref('')

function handleOrderTypeChange() {
  previewOrderNumber.value = generateUniqueOrderNumber(form.orderType)
  if (form.orderType === '采购') {
    form.status = '待采购'
  } else if (form.orderType === '销售') {
    form.status = '待生产'
  } else {
    form.status = '待生产'
  }
}

function handleEdit(row) {
  dialogTitle.value = '编辑订单'
  editingOrder.value = row
  
  Object.assign(form, {
    orderType: row.orderType || '生产',
    materialCode: row.materialCode || '',
    description: row.description || '',
    customerPartNo: row.customerPartNo || '',
    partNo: row.partNo || '',
    plugModel: row.plugModel || '',
    wireSpec: row.wireSpec || '',
    length: row.length || null,
    tailProcessing: row.tailProcessing || '',
    color: row.color || '',
    productName: row.productName || '',
    customerName: row.customerName || '',
    customerNo: row.customerNo || '',
    supplierName: row.supplierName || '',
    supplierCode: row.supplierCode || '',
    quantity: row.quantity || 1,
    unit: row.unit || '个',
    unitPrice: row.unitPrice || 0,
    orderDate: row.orderDate || '',
    deliveryDate: row.deliveryDate || '',
    status: row.status || '待生产',
    productionLine: row.productionLine || '',
    planWorkHours: row.planWorkHours || null,
    planStartDate: row.planStartDate || '',
    planEndDate: row.planEndDate || '',
    bomItems: row.bomItems || '',
    paymentTerms: row.paymentTerms || '',
    taxRate: row.taxRate || 13,
    budget: row.budget || null,
    account: row.account || '',
    warehouse: row.warehouse || '',
    taxIncludedPrice: row.taxIncludedPrice || 0,
    financialDimension: row.financialDimension || '',
    qualityStandard: row.qualityStandard || '',
    deliveryBatch: row.deliveryBatch || 1,
    srmSynced: row.srmSynced || false
  })
  
  previewOrderNumber.value = row.orderNumber
  dialogVisible.value = true
}

function handleView(row) {
  selectedOrder.value = { ...row }
  detailDialogVisible.value = true
  loadOrderLogs(row.id)
}

function loadOrderLogs(orderId) {
  logsLoading.value = true
  orderLogs.value = []
  fetch(`/api/erp/orders/${orderId}/logs`)
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        orderLogs.value = result.data
      }
    })
    .catch(err => console.error('加载订单日志失败:', err))
    .finally(() => { logsLoading.value = false })
}

function handleEditFromDetail() {
  detailDialogVisible.value = false
  handleEdit(selectedOrder.value)
}

async function handleStatusChange(row, newStatus) {
  try {
    await ElMessageBox.confirm(
      `确定要将订单 ${row.orderNumber} 的状态从 "${row.status}" 变更为 "${newStatus}" 吗？`,
      '状态变更确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
    const response = await fetch(`/api/erp/orders/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...row, status: newStatus })
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        Object.assign(row, result.data)
        ElMessage.success('状态变更成功')
      }
    } else {
      ElMessage.error('状态变更失败')
    }
  } catch {
    // cancelled
  }
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm(`确定要删除订单 ${row.orderNumber} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await fetch(`/api/erp/orders/${row.id}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        const index = allData.value.findIndex(item => item.orderNumber === row.orderNumber)
        if (index > -1) {
          allData.value.splice(index, 1)
        }
        ElMessage.success('删除成功')
      }
    } else {
      ElMessage.error('删除失败')
    }
  } catch {
    // cancelled
  }
}

function generateUniqueOrderNumber(orderType) {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const prefix = orderType === '销售' ? 'SO' : orderType === '采购' ? 'PO' : 'MO'
  const datePrefix = `${prefix}${today}`

  const todayOrders = allData.value.filter(o => o.orderNumber && o.orderNumber.startsWith(datePrefix))

  if (todayOrders.length === 0) {
    return `${datePrefix}001`
  }

  const maxSeq = todayOrders.reduce((max, order) => {
    const seq = parseInt(order.orderNumber.replace(datePrefix, ''), 10)
    return isNaN(seq) ? max : Math.max(max, seq)
  }, 0)

  return `${datePrefix}${String(maxSeq + 1).padStart(3, '0')}`
}

async function handleSubmit() {
  if (!formRef.value) return
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (editingOrder.value) {
          const response = await fetch(`/api/erp/orders/${editingOrder.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...form,
              totalAmount: form.quantity * form.unitPrice
            })
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              Object.assign(editingOrder.value, result.data)
              ElMessage.success('更新成功')
            }
          }
        } else {
          const newOrder = {
            ...form,
            totalAmount: form.quantity * form.unitPrice,
            orderNumber: generateUniqueOrderNumber(form.orderType)
          }
          const response = await fetch('/api/erp/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newOrder)
          })
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              allData.value.unshift(result.data)
              currentPage.value = 1
              ElMessage.success(`新增成功，订单号: ${result.data.orderNumber}`)
            }
          }
        }
        dialogVisible.value = false
      } catch (error) {
        console.error('保存订单失败:', error)
        ElMessage.error('保存订单失败')
      }
    }
  })
}

function handleGenerateProduction() {
  const salesOrders = allData.value.filter(o => o.orderType === '销售' && o.status === '待生产')
  if (salesOrders.length === 0) {
    ElMessage.warning('没有可转生产的销售订单（状态为待生产的销售订单）')
    return
  }

  ElMessageBox.confirm(
    `共找到 ${salesOrders.length} 个待生产的销售订单，确定要生成生产订单吗？`,
    '销售订单转生产订单',
    {
      confirmButtonText: '确定生成',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    const generatedCount = []
    const failedCount = []

    for (const salesOrder of salesOrders) {
      const productionOrder = {
        ...salesOrder,
        orderType: '生产',
        status: '待生产',
        orderNumber: `MO${new Date().toISOString().split('T')[0].replace(/-/g, '')}${String(generatedCount.length + 1).padStart(3, '0')}`,
        customerName: '内部使用',
        customerNo: 'C999',
        productionLine: 'A生产线',
        planWorkHours: calculateWorkHours(salesOrder),
        bomItems: generateBOMItems(salesOrder)
      }
      try {
        const response = await fetch('/api/erp/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productionOrder)
        })
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            allData.value.unshift(result.data)
            generatedCount.push(result.data.orderNumber)
          }
        }
      } catch (error) {
        console.error('保存生产订单失败:', error)
        failedCount.push(productionOrder.orderNumber)
      }
    }

    for (const order of salesOrders) {
      try {
        await fetch(`/api/erp/orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...order, status: '已转生产' })
        })
        const index = allData.value.findIndex(o => o.orderNumber === order.orderNumber)
        if (index !== -1) {
          allData.value[index].status = '已转生产'
        }
      } catch (error) {
        console.error('更新销售订单状态失败:', error)
      }
    }

    if (failedCount.length > 0) {
      ElMessage.warning(`成功生成 ${generatedCount.length} 个生产订单，${failedCount.length} 个失败`)
    } else {
      ElMessage.success(`成功生成 ${generatedCount.length} 个生产订单`)
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

function calculateWorkHours(order) {
  const baseHours = order.quantity * 0.5
  return parseFloat(baseHours.toFixed(2))
}

function generateBOMItems(order) {
  const items = []
  if (order.wireSpec) items.push(`${order.wireSpec} 电线 x ${order.length || 100}米`)
  if (order.plugModel && order.plugModel !== '-') items.push(`${order.plugModel} 插头 x ${order.quantity}个`)
  if (order.tailProcessing && order.tailProcessing !== '-') items.push(`尾部处理: ${order.tailProcessing}`)
  return items.join('\n')
}

function handleSyncToSRM() {
  const purchaseOrders = allData.value.filter(o => o.orderType === '采购' && !o.srmSynced)
  if (purchaseOrders.length === 0) {
    ElMessage.warning('没有可同步到SRM的采购订单（已同步的订单或非采购订单）')
    return
  }

  ElMessageBox.confirm(
    `共找到 ${purchaseOrders.length} 个未同步的采购订单，确定要同步到SRM吗？`,
    '同步采购订单到SRM',
    {
      confirmButtonText: '确定同步',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    let syncedCount = 0
    const failedCount = []

    for (const order of purchaseOrders) {
      try {
        await fetch('/api/srm/purchase-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            erpOrderNumber: order.orderNumber,
            supplierName: order.supplierName,
            supplierCode: order.supplierCode,
            materialCode: order.materialCode,
            productName: order.productName,
            description: order.description,
            quantity: order.quantity,
            unit: order.unit,
            unitPrice: order.unitPrice,
            deliveryDate: order.deliveryDate,
            qualityStandard: order.qualityStandard,
            deliveryBatch: order.deliveryBatch,
            warehouse: order.warehouse,
            account: order.account,
            budget: order.budget,
            taxRate: order.taxRate,
            financialDimension: order.financialDimension
          })
        })

        await fetch(`/api/erp/orders/${order.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            srmSynced: true,
            status: '待采购'
          })
        })

        order.srmSynced = true
        order.status = '待采购'
        syncedCount++
      } catch (err) {
        console.error('同步到SRM失败:', err)
        failedCount.push(order.orderNumber)
      }
    }

    if (failedCount.length > 0) {
      ElMessage.warning(`成功同步 ${syncedCount} 个采购订单到SRM，${failedCount.length} 个失败`)
    } else {
      ElMessage.success(`成功同步 ${syncedCount} 个采购订单到SRM`)
    }
  }).catch(() => {
    ElMessage.info('已取消操作')
  })
}

async function handleSyncFromSRM() {
  try {
    await ElMessageBox.confirm(
      '确定要从SRM系统同步采购订单到ERP吗？',
      '从SRM同步',
      {
        confirmButtonText: '确定同步',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    loading.value = true
    try {
      const response = await fetch('/api/srm/purchase-orders')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data && result.data.length > 0) {
          const syncResponse = await fetch('/api/erp/srm/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orders: result.data })
          })
          
          if (syncResponse.ok) {
            const syncResult = await syncResponse.json()
            if (syncResult.success) {
              ElMessage.success(syncResult.message)
              loadData()
            } else {
              ElMessage.error(syncResult.error || '同步失败')
            }
          } else {
            ElMessage.error('同步请求失败')
          }
        } else {
          ElMessage.info('SRM系统没有可同步的采购订单')
        }
      }
    } catch (error) {
      console.error('从SRM同步失败:', error)
      ElMessage.error('从SRM同步失败')
    } finally {
      loading.value = false
    }
  } catch {
    ElMessage.info('已取消操作')
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: bold;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .search-area {
    display: flex;
    gap: 12px;
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;

  .summary {
    font-size: 14px;
    color: #606266;
  }
}

.order-number-preview {
  font-weight: bold;
  color: #409eff;
  font-size: 14px;
}

:deep(.el-table) {
  .el-table__header th {
    background-color: #f5f7fa;
  }
}
</style>
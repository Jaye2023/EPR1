<template>
  <div class="quotes-page">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>报价单管理</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 工具栏卡片 -->
    <el-card class="mb-4">
      <template #header>
        <div class="flex justify-between items-center">
          <span>报价单列表</span>
          <div class="flex gap-2">
            <el-button @click="exportCsv">
              <el-icon><Download /></el-icon> 导出CSV
            </el-button>
            <el-button type="primary" @click="openAddDialog">
              <el-icon><Plus /></el-icon> 新建报价单
            </el-button>
          </div>
        </div>
      </template>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索报价单号、客户..."
            style="width: 240px"
            clearable
            @clear="loadData"
            @keyup.enter="handleSearch"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>

          <el-select v-model="filterCustomer" placeholder="客户" style="width: 160px" clearable filterable @change="handleSearch">
            <el-option label="全部客户" value="" />
            <el-option v-for="customer in customers" :key="customer.customerCode" :label="`${customer.name} (${customer.customerCode})`" :value="customer.customerCode" />
          </el-select>

          <el-select v-model="filterStatus" placeholder="状态" style="width: 120px" clearable @change="handleSearch">
            <el-option label="全部状态" value="" />
            <el-option label="草稿" value="draft" />
            <el-option label="已发送" value="sent" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>

          <el-select v-model="filterSalesperson" placeholder="报价人" style="width: 140px" clearable @change="handleSearch">
            <el-option label="全部报价人" value="" />
            <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
          </el-select>

          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
            @change="handleSearch"
          />

          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>
      </div>

      <!-- 表格 -->
      <el-table 
        ref="tableRef"
        :data="tableData" 
        v-loading="loading" 
        @selection-change="handleSelectionChange"
        @row-dblclick="openDetail"
        @row-click="handleRowClick"
        :highlight-current-row="true"
        border
        :default-sort="{ prop: 'createdAt', order: 'descending' }"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="quoteNumber" label="报价单号" min-width="120" sortable show-overflow-tooltip>
          <template #default="{ row }">
            <span 
              class="cursor-pointer text-blue-500 hover:text-blue-700 hover:underline" 
              @click="goToDetail(row.id)"
              :title="`查看报价单 ${row.quoteNumber}`"
            >
              {{ row.quoteNumber || row.id }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="customer" label="客户" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getCustomerDisplayName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="salesperson" label="报价人" min-width="80" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getSalespersonDisplayName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" min-width="70">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" min-width="100" align="right" sortable>
          <template #default="{ row }">
            <span :class="{ 'text-primary font-semibold': row.totalAmount > 0 }">
              ¥{{ row.totalAmount?.toFixed(2) || '0.00' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="quoteDate" label="报价日期" min-width="100" sortable>
          <template #default="{ row }">
            {{ formatDate(row.quoteDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="validityTerm" label="报价有效期铜价" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ extractCopperPrice(row.validityTerm) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="130" sortable>
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="380" fixed="right">
          <template #default="{ row }">
            <el-button 
              link 
              type="primary" 
              @click="openDetail(row)" 
              title="查看详情"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><View /></el-icon> 查看
            </el-button>
            <el-button 
              link 
              type="primary" 
              @click="openEditDialog(row)" 
              v-if="row.status === 'draft'" 
              title="编辑报价单"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><Edit /></el-icon> 编辑
            </el-button>
            <el-button 
              link 
              type="success" 
              @click="copyQuote(row)" 
              title="复制报价单"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><CopyDocument /></el-icon> 复制
            </el-button>
            <el-button 
              link 
              type="warning" 
              @click="handleSubmitForReview(row)" 
              v-if="row.status === 'draft'" 
              title="提交审核"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><Message /></el-icon> 提交审核
            </el-button>
            <el-button 
              link 
              type="success" 
              @click="handleApprove(row)" 
              v-if="row.status === 'pending'" 
              title="审核通过"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><CircleCheck /></el-icon> 核准通过
            </el-button>
            <el-button 
              link 
              type="danger" 
              @click="handleReject(row)" 
              v-if="row.status === 'pending'" 
              title="审核拒绝"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><CircleClose /></el-icon> 拒绝
            </el-button>
            <el-button 
              link 
              type="info" 
              @click="exportQuotePdf(row.id)" 
              title="导出PDF"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><Download /></el-icon> 导出PDF
            </el-button>
            <el-button 
              link 
              type="danger" 
              @click="handleDelete(row)" 
              title="删除报价单"
              :loading="loadingRow === row.id"
              size="small"
            >
              <el-icon><Delete /></el-icon> 删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 底部操作栏 -->
      <div class="flex justify-between items-center mt-4">
        <div class="flex gap-2">
          <el-button 
            v-if="selectedRows.length > 0" 
            type="danger" 
            @click="handleBatchDelete"
            :disabled="selectedRows.length === 0"
          >
            <el-icon><Box /></el-icon> 批量删除 ({{ selectedRows.length }})
          </el-button>
          <el-button 
            v-if="selectedRows.length > 0" 
            type="warning" 
            @click="handleBatchSend"
            :disabled="!selectedRows.some(r => r.status === 'draft')"
          >
            <el-icon><Document /></el-icon> 批量发送
          </el-button>
        </div>
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新建/编辑报价单对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1300px" :close-on-click-modal="false" class="quote-dialog">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" class="quote-form">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="客户" prop="customerCode">
              <el-select 
                v-model="form.customerCode" 
                style="width: 100%" 
                placeholder="请选择客户" 
                filterable
                clearable
                @change="onCustomerChange"
              >
                <el-option v-for="c in customers" :key="c.customerCode" :label="`${c.name} (${c.customerCode})`" :value="c.customerCode" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价人" prop="salespersonId">
              <el-select 
                v-model="form.salespersonId" 
                style="width: 100%" 
                placeholder="请选择报价人"
                clearable
              >
                <el-option v-for="user in users" :key="user.id" :label="user.name" :value="user.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价日期" prop="quoteDate">
              <el-date-picker 
                v-model="form.quoteDate" 
                type="date" 
                style="width: 100%" 
                :placeholder="`请选择报价日期`"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="有效日期">
              <el-date-picker v-model="form.validUntil" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价单号">
              <el-input v-model="form.quoteNumber" :disabled="!!form.id" placeholder="自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="货币">
              <el-select v-model="form.currency" style="width: 100%">
                <el-option label="人民币" value="CNY" />
                <el-option label="美元" value="USD" />
                <el-option label="欧元" value="EUR" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <div v-if="selectedCustomer" class="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
          <div class="flex gap-6 text-sm">
            <div>
              <span class="text-gray">客户名称：</span>
              <span class="font-medium">{{ selectedCustomer.name }}</span>
            </div>
            <div>
              <span class="text-gray">联系人：</span>
              <span>{{ selectedCustomer.contactPerson || '-' }}</span>
            </div>
            <div>
              <span class="text-gray">联系电话：</span>
              <span>{{ selectedCustomer.phone || '-' }}</span>
            </div>
            <div>
              <span class="text-gray">地址：</span>
              <span>{{ selectedCustomer.address || '-' }}</span>
            </div>
          </div>
        </div>
        
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="付款方式">
              <el-select v-model="form.paymentMethod" style="width: 100%" placeholder="请选择付款方式" clearable>
                <el-option label="电汇" value="电汇" />
                <el-option label="信用证" value="信用证" />
                <el-option label="托收" value="托收" />
                <el-option label="现金" value="现金" />
                <el-option label="月结" value="月结" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="报价有效期铜价">
              <el-input v-model="form.validityTerm" placeholder="请输入报价有效期铜价" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="税率">
              <el-input-number v-model="form.taxRate" :min="0" :max="100" :precision="2" style="width: 100%" placeholder="税率%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="货物交付地址">
              <el-input v-model="form.deliveryTerm" placeholder="请输入货物交付地址" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="form.remarks" type="textarea" :rows="2" placeholder="请输入备注信息" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">报价明细</el-divider>
        
        <div class="quote-items">
          <el-table :data="form.items" border style="width: 100%" :show-header="true" class="quote-items-table">
            <el-table-column type="index" label="序号" width="60" fixed />
            <el-table-column prop="materialCode" label="物料编号" width="200" fixed>
              <template #default="{ row, $index }">
                <div class="flex items-center gap-1">
                  <el-autocomplete
                    v-model="row.materialCode"
                    :fetch-suggestions="(queryString, cb) => handleProductSearchSuggestions(queryString, cb)"
                    placeholder="输入或选择"
                    style="flex: 1"
                    @select="(item) => handleProductSelect(item, row, $index)"
                    @blur="handleProductSearch(row, $index)"
                    @keyup.enter="handleProductSearch(row, $index)"
                  >
                    <template #item="{ item }">
                      <span>{{ item.materialCode }} - {{ item.description }}</span>
                    </template>
                  </el-autocomplete>
                  <el-button 
                    type="primary" 
                    size="small" 
                    :icon="Search" 
                    circle 
                    title="打开物料库"
                    @click="openMaterialDialog($index)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="产品描述" min-width="280">
              <template #default="{ row }">
                <el-input v-model="row.description" placeholder="产品描述" />
              </template>
            </el-table-column>
            <el-table-column prop="wireSpec" label="规格" width="140">
              <template #default="{ row }">
                <el-input v-model="row.wireSpec" placeholder="规格" disabled />
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :precision="0" style="width: 100%" @change="recalculateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="unit" label="单位" width="100">
              <template #default="{ row }">
                <el-select v-model="row.unit" style="width: 100%" placeholder="选择单位">
                  <el-option label="个" value="pcs" />
                  <el-option label="米" value="m" />
                  <el-option label="套" value="set" />
                  <el-option label="卷" value="roll" />
                  <el-option label="件" value="piece" />
                  <el-option label="公斤" value="kg" />
                  <el-option label="箱" value="box" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="unitPrice" label="单价(元)" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="4" style="width: 100%" @change="recalculateTotal" />
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额(元)" width="130" align="right">
              <template #default="{ row }">
                <span class="font-medium text-primary">¥{{ row.amount?.toFixed(2) || '0.00' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row, $index }">
                <el-button link type="danger" size="small" @click="removeItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-between items-center mt-2">
            <span class="text-gray text-sm">共 {{ form.items.length }} 项</span>
            <el-button type="success" size="small" @click="addItem">
              <el-icon><Plus /></el-icon> 添加明细
            </el-button>
          </div>
        </div>

        <el-row class="mt-4" style="border-top: 2px solid #ddd; padding-top: 15px;">
          <el-col :span="16">
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray">明细数量：</span>
                <span class="font-semibold">{{ form.items.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString() }}</span>
              </div>
              <div>
                <span class="text-gray">明细项数：</span>
                <span class="font-semibold">{{ form.items.length }} 项</span>
              </div>
              <div>
                <span class="text-gray">货币：</span>
                <span class="font-semibold">{{ getCurrencyText(form.currency) }}</span>
              </div>
            </div>
          </el-col>
          <el-col :span="8" class="text-right">
            <div v-if="form.taxRate && form.taxRate > 0" class="text-sm mb-1">
              <span class="text-gray">税额({{ form.taxRate }}%)：</span>
              <span>¥{{ form.taxAmount?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="text-gray mb-1">合计金额</div>
            <div class="text-2xl font-bold text-primary">¥{{ form.totalAmount?.toFixed(2) || '0.00' }}</div>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>

    <!-- 物料选择对话框 -->
    <el-dialog v-model="materialDialogVisible" title="选择物料" width="900px" :close-on-click-modal="false">
      <div class="mb-4">
        <el-input
          v-model="materialSearchKeyword"
          placeholder="输入物料编号、名称或描述搜索"
          style="width: 300px"
          clearable
          @keyup.enter="searchMaterials"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-button type="primary" @click="searchMaterials" class="ml-2">搜索</el-button>
      </div>
      <el-table 
        :data="materialList" 
        v-loading="materialLoading" 
        @row-click="handleMaterialRowClick"
        highlight-current-row
        border
        style="cursor: pointer"
        height="400"
      >
        <el-table-column prop="materialCode" label="物料编号" width="150" />
        <el-table-column prop="description" label="产品描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="wireSpec" label="规格" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="unitPrice" label="单价" width="100" align="right">
          <template #default="{ row }">¥{{ row.unitPrice?.toFixed(4) || '0.0000' }}</template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click.stop="selectMaterial(row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          v-model:current-page="materialPagination.page"
          v-model:page-size="materialPagination.pageSize"
          :total="materialPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="searchMaterials"
          @current-change="searchMaterials"
        />
      </div>
    </el-dialog>

    <!-- 查看报价单详情对话框 -->
    <el-dialog v-model="detailVisible" title="报价单详情" width="900px" :close-on-click-modal="false" @close="handleDetailClose">
      <div v-if="detailLoading" class="text-center py-12">
        <el-loading-spinner />
        <div class="mt-4 text-gray">正在加载报价单详情...</div>
      </div>
      
      <div v-else-if="detailQuote" class="quote-detail">
        <div class="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 class="text-xl font-bold text-primary">{{ detailQuote.quoteNumber || '未生成' }}</h2>
            <div class="text-gray mt-1">{{ formatDateTime(detailQuote.createdAt) }} 创建</div>
          </div>
          <el-tag :type="getStatusType(detailQuote.status)" size="large">
            {{ getStatusText(detailQuote.status) }}
          </el-tag>
        </div>

        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <div class="detail-label">客户</div>
            <div class="detail-value">
              <div v-if="getDetailCustomer(detailQuote)">
                <span class="font-semibold">{{ getDetailCustomer(detailQuote).name }}</span>
                <div v-if="getDetailCustomer(detailQuote).customerCode" class="text-sm text-gray">客户编号: {{ getDetailCustomer(detailQuote).customerCode }}</div>
                <div v-if="getDetailCustomer(detailQuote).contactPerson || getDetailCustomer(detailQuote).phone" class="text-sm text-gray">
                  {{ getDetailCustomer(detailQuote).contactPerson }} {{ getDetailCustomer(detailQuote).phone }}
                </div>
                <div v-if="getDetailCustomer(detailQuote).address" class="text-sm text-gray">{{ getDetailCustomer(detailQuote).address }}</div>
              </div>
              <span v-else>{{ getCustomerDisplayName(detailQuote) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-label">报价人</div>
            <div class="detail-value">
              <div v-if="getDetailSalesperson(detailQuote)">
                <span class="font-semibold">{{ getDetailSalesperson(detailQuote).name }}</span>
                <div v-if="getDetailSalesperson(detailQuote).username" class="text-sm text-gray">{{ getDetailSalesperson(detailQuote).username }}</div>
              </div>
              <span v-else>{{ getSalespersonDisplayName(detailQuote) }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <div class="detail-label">报价日期</div>
            <div class="detail-value">{{ formatDate(detailQuote.quoteDate) }}</div>
          </el-col>
          <el-col :span="12">
            <div class="detail-label">有效日期</div>
            <div class="detail-value">{{ formatDate(detailQuote.validUntil) || '未设置' }}</div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mb-4">
          <el-col :span="12">
            <div class="detail-label">货币</div>
            <div class="detail-value">{{ getCurrencyText(detailQuote.currency) }}</div>
          </el-col>
          <el-col :span="12">
            <div class="detail-label">状态</div>
            <div class="detail-value">
              <el-tag :type="getStatusType(detailQuote.status)" size="small">
                {{ getStatusText(detailQuote.status) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mb-4" v-if="detailQuote.paymentMethod || detailQuote.deliveryTerm || detailQuote.validityTerm">
          <el-col :span="12" v-if="detailQuote.paymentMethod">
            <div class="detail-label">付款方式</div>
            <div class="detail-value">{{ detailQuote.paymentMethod }}</div>
          </el-col>
          <el-col :span="12" v-if="detailQuote.validityTerm">
            <div class="detail-label">报价有效期铜价</div>
            <div class="detail-value">{{ detailQuote.validityTerm }}</div>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mb-4" v-if="detailQuote.deliveryTerm">
          <el-col :span="24">
            <div class="detail-label">货物交付地址</div>
            <div class="detail-value">{{ detailQuote.deliveryTerm }}</div>
          </el-col>
        </el-row>

        <div v-if="detailQuote.remarks" class="mb-4">
          <div class="detail-label">备注</div>
          <div class="detail-value">{{ detailQuote.remarks }}</div>
        </div>

        <el-divider content-position="left" v-if="detailQuote.status === 'approved' || detailQuote.status === 'rejected'">审核信息</el-divider>
        <div v-if="detailQuote.status === 'approved'" class="mb-4">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-label">核准人</div>
              <div class="detail-value font-bold text-success">{{ detailQuote.approverName || '-' }}</div>
            </el-col>
            <el-col :span="12">
              <div class="detail-label">核准时间</div>
              <div class="detail-value">{{ detailQuote.approveTime ? dayjs(detailQuote.approveTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}</div>
            </el-col>
          </el-row>
        </div>
        <div v-if="detailQuote.status === 'rejected'" class="mb-4">
          <div class="detail-label">拒绝原因</div>
          <div class="detail-value text-danger">{{ detailQuote.rejectReason || '-' }}</div>
        </div>

        <el-divider content-position="left">报价明细</el-divider>

        <el-table :data="detailQuote.items" border style="width: 100%" :show-header="true" v-loading="detailLoading">
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="materialCode" label="物料编号" width="130" />
          <el-table-column prop="wireSpec" label="规格" width="140" />
          <el-table-column prop="description" label="产品描述" min-width="200" />
          <el-table-column prop="quantity" label="数量" width="100" align="right">
            <template #default="{ row }">{{ (row.quantity || 0).toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="unitPrice" label="单价" width="110" align="right">
            <template #default="{ row }">¥{{ (row.unitPrice || 0).toFixed(4) }}</template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ (row.amount || 0).toFixed(2) }}</template>
          </el-table-column>
        </el-table>

        <el-row class="mt-4" style="border-top: 2px solid #ddd; padding-top: 15px;">
          <el-col :span="14">
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray">明细数量：</span>
                <span class="font-semibold">{{ detailQuote.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0 }}</span>
              </div>
              <div>
                <span class="text-gray">明细项数：</span>
                <span class="font-semibold">{{ detailQuote.items?.length || 0 }} 项</span>
              </div>
            </div>
          </el-col>
          <el-col :span="10" class="text-right">
            <div v-if="detailQuote.subtotal !== undefined && detailQuote.subtotal > 0" class="text-sm mb-1">
              <span class="text-gray">小计：</span>
              <span>¥{{ detailQuote.subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="detailQuote.taxRate !== undefined && detailQuote.taxRate > 0" class="text-sm mb-1">
              <span class="text-gray">税额({{ detailQuote.taxRate }}%)：</span>
              <span>¥{{ (detailQuote.taxAmount || 0).toFixed(2) }}</span>
            </div>
            <div class="text-gray mb-1">合计金额</div>
            <div class="text-2xl font-bold text-primary">¥{{ detailQuote.totalAmount?.toFixed(2) || '0.00' }}</div>
          </el-col>
        </el-row>
      </div>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button @click="goToDetail(detailQuote.id)" v-if="detailQuote" type="info">
          <el-icon><View /></el-icon> 查看详情页
        </el-button>
        <el-button @click="exportQuotePdf" v-if="detailQuote">
          <el-icon><Download /></el-icon> 导出PDF
        </el-button>
        <el-button type="primary" v-if="detailQuote && detailQuote.status === 'draft'" @click="handleSubmitQuoteForReview">提交审核</el-button>
        <el-button type="success" v-if="detailQuote && detailQuote.status === 'pending'" @click="handleApproveQuote">核准通过</el-button>
        <el-button type="danger" v-if="detailQuote && detailQuote.status === 'pending'" @click="handleRejectQuote">拒绝审核</el-button>
        <el-button type="primary" v-if="detailQuote && detailQuote.status === 'approved'" @click="handleSendQuote">发送报价单</el-button>
        <el-button type="success" v-if="detailQuote && detailQuote.status === 'sent'" @click="handleConfirmQuote">确认报价</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { quotesApi, authApi, customersApi, productsApi } from '../api'
import { ElMessage, ElMessageBox, ElDialog } from 'element-plus'
import dayjs from 'dayjs'
import { Plus, Search, Wallet, Document, CircleCheck, CircleClose, Box, Download, View, Edit, CopyDocument, Message, Delete } from '@element-plus/icons-vue'
import { useSettingsStore } from '../stores/settings'

// 状态配置（单一真源）
const STATUS_CONFIG = {
  draft: { label: '草稿', type: 'info', color: '#909399' },
  pending: { label: '待审核', type: 'warning', color: '#e6a23c' },
  approved: { label: '已核准', type: 'success', color: '#67c23a' },
  rejected: { label: '已拒绝', type: 'danger', color: '#f56c6c' },
  sent: { label: '已发送', type: 'primary', color: '#409eff' },
  confirmed: { label: '已确认', type: 'success', color: '#67c23a' }
}

function getStatusInfo(status) {
  return STATUS_CONFIG[status] || STATUS_CONFIG.draft
}

function getStatusType(status) {
  return getStatusInfo(status).type
}

function getStatusText(status) {
  return getStatusInfo(status).label
}

function getCustomerDisplayName(row) {
  if (!row) return '-'
  
  if (row.customerName) {
    return row.customerName
  }
  
  if (row.customer && typeof row.customer === 'object') {
    return row.customer.name || row.customer.customerName || row.customer.customerNo || '-'
  }
  
  if (row.customer && typeof row.customer === 'string') {
    return row.customer
  }
  
  const customerCode = row.customerCode || row.customerId || row.customer_code || row.customerNo
  if (customerCode) {
    const customer = customers.value.find(c => c.customerCode === customerCode)
    return customer ? customer.name : customerCode
  }
  
  return '-'
}

function getSalespersonDisplayName(row) {
  if (!row) return '-'
  
  if (row.salespersonName) {
    return row.salespersonName
  }
  
  if (row.salesperson && typeof row.salesperson === 'object') {
    return row.salesperson.name || row.salesperson.username || '-'
  }
  
  if (row.salesperson && typeof row.salesperson === 'string') {
    return row.salesperson
  }
  
  const salespersonId = row.salespersonId || row.salesperson_id
  if (salespersonId) {
    const user = users.value.find(u => u.id === salespersonId)
    return user ? user.name : salespersonId
  }
  
  return '-'
}

function getDetailCustomer(quote) {
  if (!quote) return null
  
  if (quote.customer && typeof quote.customer === 'object') {
    return quote.customer
  }
  
  const customerCode = quote.customerCode || quote.customerId || quote.customer_code || quote.customerNo
  if (customerCode) {
    const customer = customers.value.find(c => c.customerCode === customerCode)
    if (customer) {
      return customer
    }
  }
  
  if (quote.customerName) {
    return { name: quote.customerName }
  }
  
  return null
}

function getDetailSalesperson(quote) {
  if (!quote) return null
  if (quote.salesperson && typeof quote.salesperson === 'object') {
    return quote.salesperson
  }
  const salespersonId = quote.salespersonId || quote.salesperson_id
  if (salespersonId) {
    return users.value.find(u => u.id === salespersonId) || null
  }
  return null
}

const router = useRouter()
const settingsStore = useSettingsStore()

const loading = ref(false)
const submitting = ref(false)
const loadingRow = ref(null)
const tableData = ref([])
const allQuotes = ref([])
const users = ref([])
const customers = ref([])
const selectedRows = ref([])
const tableRef = ref(null)

const searchKeyword = ref('')
const filterStatus = ref('')
const filterSalesperson = ref('')
const filterCustomer = ref('')
const dateRange = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const detailVisible = ref(false)
const detailQuote = ref(null)
const detailLoading = ref(false)

const materialDialogVisible = ref(false)
const materialSearchKeyword = ref('')
const materialList = ref([])
const materialLoading = ref(false)
const materialPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})
let currentItemIndex = null

const formRef = ref()
const form = reactive({
  id: null,
  quoteNumber: '',
  customerCode: '',
  salespersonId: '',
  quoteDate: new Date(),
  validUntil: null,
  paymentMethod: '',
  deliveryTerm: '',
  validityTerm: '',
  remarks: '',
  status: 'draft',
  totalAmount: 0,
  currency: 'CNY',
  taxRate: 0,
  taxAmount: 0,
  items: []
})

const selectedCustomer = computed(() => {
  if (!form.customerCode) return null
  return customers.value.find(c => c.customerCode === form.customerCode) || null
})

const rules = {
  customerCode: [{ required: true, message: '请选择客户', trigger: 'change' }],
  salespersonId: [{ required: true, message: '请选择报价人', trigger: 'change' }],
  quoteDate: [{ required: true, message: '请选择报价日期', trigger: 'change' }]
}

function validateItems() {
  const invalidItems = form.items.filter(item => !item.materialCode?.trim())
  if (invalidItems.length > 0) {
    ElMessage.warning(`有 ${invalidItems.length} 行明细未填写物料编号`)
    return false
  }
  
  const invalidQuantity = form.items.filter(item => !item.quantity || item.quantity <= 0)
  if (invalidQuantity.length > 0) {
    ElMessage.warning('请确保所有明细数量都大于0')
    return false
  }
  
  return true
}

const quickFilterOptions = [
  { label: '全部', value: '' },
  { label: '草稿', value: 'draft' },
  { label: '已发送', value: 'sent' },
  { label: '已确认', value: 'confirmed' },
  { label: '已拒绝', value: 'rejected' }
]

function getCurrencyText(currency) {
  const map = {
    CNY: '人民币',
    USD: '美元',
    EUR: '欧元'
  }
  return map[currency] || currency
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD') : '-'
}

function formatDateTime(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

function extractCopperPrice(text) {
  if (!text) return '-'
  const match = text.match(/铜价\s*\d+-\d+元\/吨/)
  return match ? match[0] : '-'
}

function debounce(fn, delay = 300) {
  let timer = null
  return function(...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

const handleSearch = debounce(() => {
  pagination.page = 1
  loadData()
})

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchKeyword.value,
      status: filterStatus.value,
      salespersonId: filterSalesperson.value,
      customerCode: filterCustomer.value,
      startDate: dateRange.value[0] ? dateRange.value[0].toISOString() : null,
      endDate: dateRange.value[1] ? dateRange.value[1].toISOString() : null
    }
    const data = await quotesApi.list(params)
    
    if (!data || typeof data !== 'object') {
      throw new Error('获取到无效的报价单数据')
    }
    
    const quotes = data.quotes || data.data || []
    
    if (!Array.isArray(quotes)) {
      throw new Error('报价单数据格式错误')
    }
    
    tableData.value = quotes.map(normalizeQuoteData)
    pagination.total = data.total || quotes.length
    allQuotes.value = tableData.value
  } catch (error) {
    ElMessage.error(error.message || '加载数据失败')
    tableData.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

function normalizeQuoteItem(item) {
  if (!item || typeof item !== 'object') {
    return {
      id: '',
      materialCode: '',
      wireSpec: '',
      description: '',
      quantity: 0,
      unit: '',
      unitPrice: 0,
      amount: 0
    }
  }
  
  return {
    id: item.id || item.itemId || '',
    materialCode: item.materialCode || item.material_code || item.code || item.matCode || '',
    wireSpec: item.wireSpec || item.wire_spec || item.spec || item.specs || '',
    description: item.description || item.desc || item.product_desc || item.product_description || '',
    quantity: Number(item.quantity || 0),
    unit: item.unit || '',
    unitPrice: Number(item.unitPrice || item.unit_price || item.price || 0),
    amount: Number(item.amount || item.total || item.subtotal || 0)
  }
}

function normalizeQuoteData(quote) {
  if (!quote || typeof quote !== 'object') {
    return {
      id: '',
      quoteNumber: '',
      customerCode: '',
      customerName: '',
      salespersonId: '',
      salespersonName: '',
      quoteDate: '',
      validUntil: '',
      status: 'draft',
      totalAmount: 0,
      currency: 'CNY',
      items: []
    }
  }
  
  const items = Array.isArray(quote.items) ? quote.items.map(normalizeQuoteItem) : []
  
  return {
    id: quote.id || '',
    quoteNumber: quote.quoteNumber || quote.quote_no || quote.quote_number || '',
    customerCode: quote.customerCode || quote.customer_code || quote.customerId || '',
    customerName: quote.customerName || (quote.customer && typeof quote.customer === 'object' && quote.customer.name) || '',
    salespersonId: quote.salespersonId || quote.salesperson_id || '',
    salespersonName: quote.salespersonName || (quote.salesperson && typeof quote.salesperson === 'object' && quote.salesperson.name) || '',
    quoteDate: quote.quoteDate || quote.quote_date || '',
    validUntil: quote.validUntil || quote.valid_until || '',
    status: quote.status || 'draft',
    totalAmount: quote.totalAmount || quote.total_amount || 0,
    currency: quote.currency || 'CNY',
    items: items,
    paymentMethod: quote.paymentMethod || quote.payment_method || '',
    deliveryTerm: quote.deliveryTerm || quote.delivery_term || '',
    validityTerm: quote.validityTerm || quote.validity_term || '',
    createdAt: quote.createdAt || quote.created_at || '',
    updatedAt: quote.updatedAt || quote.updated_at || ''
  }
}

async function loadUsers() {
  try {
    const data = await authApi.getUsers()
    // 只显示启用状态的用户和报价人角色的用户
    const userList = data.data || data || []
    users.value = userList.filter(u => u.status === 'active' && u.role === 'salesperson')
  } catch (error) {
    console.error('Failed to load users:', error)
  }
}

async function loadCustomers() {
  try {
    const data = await customersApi.list({ page: 1, pageSize: 200 })
    customers.value = data.data || data.customers || []
  } catch (error) {
    console.error('Failed to load customers:', error)
  }
}

async function loadSettings() {
  try {
    await settingsStore.loadSettings()
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function handleRowClick(row, column, event) {
  if (column.type !== 'selection') {
    tableRef.value?.setCurrentRow(row)
  }
}

function resetFilters() {
  searchKeyword.value = ''
  filterStatus.value = ''
  filterSalesperson.value = ''
  filterCustomer.value = ''
  dateRange.value = []
  pagination.page = 1
  loadData()
}

function addItem() {
  form.items.push({
    materialCode: '',
    description: '',
    wireSpec: '',
    formula: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    amount: 0
  })
}

const productSuggestions = ref([])

function openMaterialDialog(index) {
  currentItemIndex = index
  materialSearchKeyword.value = ''
  materialPagination.page = 1
  materialPagination.pageSize = 20
  searchMaterials()
  materialDialogVisible.value = true
}

async function searchMaterials() {
  materialLoading.value = true
  try {
    const params = {
      page: materialPagination.page,
      pageSize: materialPagination.pageSize,
      search: materialSearchKeyword.value
    }
    const data = await productsApi.list(params)
    materialList.value = data.products || data.data || []
    materialPagination.total = data.total || materialList.value.length
  } catch (error) {
    console.error('搜索物料失败:', error)
    ElMessage.error('搜索物料失败')
  } finally {
    materialLoading.value = false
  }
}

function handleMaterialRowClick(row) {
  selectMaterial(row)
}

function selectMaterial(material) {
  if (currentItemIndex !== null && form.items[currentItemIndex]) {
    const item = form.items[currentItemIndex]
    item.materialCode = material.materialCode
    item.description = material.description || ''
    item.unitPrice = material.unitPrice || 0
    item.unit = material.unit || 'pcs'
    item.wireSpec = material.wireSpec || ''
    item.formula = material.formula || ''
    item.materialData = material
    recalculateTotal()
    ElMessage.success(`已加载物料: ${material.materialCode}`)
  }
  materialDialogVisible.value = false
}

async function handleProductSearchSuggestions(queryString, cb) {
  if (!queryString.trim()) {
    cb([])
    return
  }
  
  try {
    const data = await productsApi.search(queryString)
    productSuggestions.value = data || []
    cb(productSuggestions.value)
  } catch (error) {
    console.error('Failed to search products:', error)
    cb([])
  }
}

function handleProductSelect(item, row, index) {
  row.materialCode = item.materialCode
  row.description = item.description || ''
  row.unitPrice = item.unitPrice || 0
  row.unit = item.unit || 'pcs'
  row.wireSpec = item.wireSpec || ''
  row.formula = item.formula || ''
  recalculateTotal()
  ElMessage.success(`已加载物料信息`)
}

async function handleProductSearch(row, index) {
  const materialCode = row.materialCode?.trim()
  if (!materialCode) return

  try {
    const data = await productsApi.getByItemNumber(materialCode)
    if (data) {
      row.description = data.description || ''
      row.unitPrice = data.unitPrice || 0
      row.unit = data.unit || 'pcs'
      row.wireSpec = data.wireSpec || ''
      row.formula = data.formula || ''
      recalculateTotal()
      ElMessage.success(`已加载物料信息`)
    } else {
      ElMessage.warning(`未找到物料编号: ${materialCode}`)
    }
  } catch (error) {
    console.error('Failed to load product:', error)
    ElMessage.error(`加载物料失败: ${error.message}`)
  }
}

function removeItem(index) {
  form.items.splice(index, 1)
  recalculateTotal()
}

function recalculateTotal() {
  let subtotal = 0
  form.items.forEach(item => {
    item.amount = (item.quantity || 0) * (item.unitPrice || 0)
    subtotal += item.amount
  })
  
  const taxRate = form.taxRate || 0
  form.taxAmount = subtotal * (taxRate / 100)
  form.totalAmount = subtotal + form.taxAmount
}

function onCustomerChange() {
  recalculateTotal()
}

function openAddDialog() {
  dialogTitle.value = '新建报价单'
  form.id = null
  form.quoteNumber = ''
  form.customerCode = ''
  form.salespersonId = ''
  form.quoteDate = new Date()
  form.validUntil = null
  form.paymentMethod = ''
  form.deliveryTerm = ''
  form.validityTerm = ''
  form.remarks = ''
  form.status = 'draft'
  form.totalAmount = 0
  form.currency = 'CNY'
  form.items = [{
    materialCode: '',
    description: '',
    wireSpec: '',
    formula: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    amount: 0
  }]
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogTitle.value = '编辑报价单'
  form.id = row.id
  form.quoteNumber = row.quoteNumber || ''
  form.customerCode = row.customerCode || row.customerId || row.customer_code || row.customerNo || ''
  form.salespersonId = row.salespersonId || row.salesperson_id || ''
  form.quoteDate = row.quoteDate ? new Date(row.quoteDate) : new Date()
  form.validUntil = row.validUntil ? new Date(row.validUntil) : null
  form.paymentMethod = row.paymentMethod || ''
  form.deliveryTerm = row.deliveryTerm || ''
  form.validityTerm = row.validityTerm || ''
  form.remarks = row.remark || row.remarks || ''
  form.status = row.status || 'draft'
  form.totalAmount = row.totalAmount || 0
  form.currency = row.currency || 'CNY'
  form.taxRate = row.taxRate || 0
  form.taxAmount = row.taxAmount || 0
  
  if (row.items && Array.isArray(row.items)) {
    form.items = row.items.map(item => ({ 
      materialCode: item.materialCode || item.material_code || '',
      description: item.description || item.product_name || '',
      wireSpec: item.wireSpec || item.specification || '',
      formula: item.formula || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unitPrice: item.unitPrice || item.unit_price || 0,
      amount: item.amount || item.total_price || 0
    }))
  } else {
    form.items = [{
      materialCode: '',
      description: '',
      wireSpec: '',
      formula: '',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 0,
      amount: 0
    }]
  }
  
  recalculateTotal()
  dialogVisible.value = true
}

function goToDetail(id) {
  router.push(`/quotes/${id}`)
}

async function openDetail(row) {
  loadingRow.value = row.id
  detailLoading.value = true
  detailQuote.value = null
  
  try {
    if (!row || !row.id) {
      throw new Error('无效的报价单')
    }
    
    const response = await quotesApi.get(row.id)
    
    if (!response || typeof response !== 'object') {
      throw new Error('获取到无效的报价单数据')
    }
    
    const data = response.data || response
    
    if (!data || typeof data !== 'object') {
      throw new Error('报价单数据格式错误')
    }
    
    const quoteId = data.id || data.quoteId || row.id
    if (!quoteId) {
      throw new Error('报价单数据中缺少ID')
    }
    
    let items = []
    try {
      const itemsResponse = await quotesApi.getQuoteItems(quoteId)
      if (itemsResponse && typeof itemsResponse === 'object') {
        items = itemsResponse.data || itemsResponse || []
      }
    } catch (itemsError) {
      console.warn('获取报价明细失败:', itemsError)
    }
    
    const quoteData = normalizeQuoteData(data)
    quoteData.items = Array.isArray(items) ? items : (quoteData.items || [])
    
    detailQuote.value = quoteData
    detailVisible.value = true
  } catch (error) {
    console.error('加载报价单详情失败:', error)
    ElMessage.error(error.message || '加载报价单详情失败')
  } finally {
    loadingRow.value = null
    detailLoading.value = false
  }
}



function handleDetailClose() {
  detailQuote.value = null
  detailLoading.value = false
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    if (!validateItems()) {
      return
    }
    
    if (form.items.length === 0) {
      ElMessage.warning('请至少添加一条报价明细')
      return
    }
    
    submitting.value = true

    recalculateTotal()

    // 清理 items 中的多余数据，只保留需要的字段
    const cleanItems = form.items.map(item => ({
      materialCode: item.materialCode,
      description: item.description,
      wireSpec: item.wireSpec || '',
      formula: item.formula || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      amount: item.amount
    }))

    const subtotal = form.items.reduce((sum, item) => sum + item.amount, 0)
    
    const quoteData = {
      customerCode: form.customerCode,
      salespersonId: form.salespersonId,
      quoteDate: form.quoteDate.toISOString().split('T')[0],
      validUntil: form.validUntil ? form.validUntil.toISOString().split('T')[0] : null,
      currency: form.currency,
      paymentMethod: form.paymentMethod,
      deliveryTerm: form.deliveryTerm,
      validityTerm: form.validityTerm,
      taxRate: form.taxRate,
      taxAmount: form.taxAmount,
      subtotal: subtotal,
      totalAmount: form.totalAmount,
      status: form.status,
      remark: form.remarks,
      items: cleanItems
    }

    if (form.id) {
      await quotesApi.update(form.id, quoteData)
      ElMessage.success('报价单更新成功')
    } else {
      await quotesApi.create(quoteData)
      ElMessage.success('报价单创建成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    if (error !== false) {
      console.error('保存报价单失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

async function handleSubmitForReview(row) {
  loadingRow.value = row.id
  try {
    await ElMessageBox.confirm('确定提交此报价单进行审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await quotesApi.update(row.id, { status: 'pending' })
    ElMessage.success('报价单已提交审核')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交失败')
    }
  } finally {
    loadingRow.value = null
  }
}

async function handleApprove(row) {
  loadingRow.value = row.id
  try {
    await ElMessageBox.confirm('确定核准此报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    const currentUser = await authApi.getCurrentUser()
    let approverName = '管理员'
    
    if (currentUser && typeof currentUser === 'object') {
      approverName = currentUser.name || currentUser.username || currentUser.realName || currentUser.nickname || '管理员'
      if (currentUser.department) {
        approverName += ` (${currentUser.department})`
      }
    }
    
    await quotesApi.update(row.id, { 
      status: 'approved',
      approverName: approverName,
      approveTime: new Date().toISOString(),
      approverId: currentUser?.id || null
    })
    ElMessage.success('报价单已核准通过')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '核准失败')
    }
  } finally {
    loadingRow.value = null
  }
}

async function handleReject(row) {
  loadingRow.value = row.id
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入拒绝原因：', '拒绝审核', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (!reason.trim()) {
      ElMessage.warning('请输入拒绝原因')
      return
    }

    await quotesApi.update(row.id, { 
      status: 'rejected',
      rejectReason: reason
    })
    ElMessage.success('报价单已拒绝')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    loadingRow.value = null
  }
}

async function handleSubmitQuoteForReview() {
  try {
    await ElMessageBox.confirm('确定提交此报价单进行审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    await quotesApi.update(detailQuote.value.id, { status: 'pending' })
    ElMessage.success('报价单已提交审核')
    detailQuote.value.status = 'pending'
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '提交失败')
    }
  }
}

async function handleApproveQuote() {
  try {
    await ElMessageBox.confirm('确定核准此报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    const currentUser = await authApi.getCurrentUser()
    let approverName = '管理员'
    
    if (currentUser && typeof currentUser === 'object') {
      approverName = currentUser.name || currentUser.username || currentUser.realName || currentUser.nickname || '管理员'
      if (currentUser.department) {
        approverName += ` (${currentUser.department})`
      }
    }
    
    await quotesApi.update(detailQuote.value.id, { 
      status: 'approved',
      approverName: approverName,
      approveTime: new Date().toISOString(),
      approverId: currentUser?.id || null
    })
    ElMessage.success('报价单已核准通过')
    detailQuote.value.status = 'approved'
    detailQuote.value.approverName = approverName
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '核准失败')
    }
  }
}

async function handleSendQuote() {
  try {
    await quotesApi.update(detailQuote.value.id, { status: 'sent' })
    ElMessage.success('报价单已发送')
    detailQuote.value.status = 'sent'
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '发送失败')
  }
}

async function handleConfirmQuote() {
  try {
    await ElMessageBox.confirm('确定确认此报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })

    await quotesApi.update(detailQuote.value.id, { status: 'confirmed' })
    ElMessage.success('报价单已确认')
    detailQuote.value.status = 'confirmed'
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

async function handleRejectQuote() {
  try {
    await ElMessageBox.confirm('确定拒绝此报价单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger'
    })

    await quotesApi.update(detailQuote.value.id, { status: 'rejected' })
    ElMessage.success('报价单已拒绝')
    detailQuote.value.status = 'rejected'
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

async function copyQuote(row) {
  loadingRow.value = row.id
  try {
    await quotesApi.copy(row.id)
    ElMessage.success('报价单已复制，新报价单已创建')
    loadData()
  } catch (error) {
    ElMessage.error(error.message || '复制失败')
  } finally {
    loadingRow.value = null
  }
}

async function handleDelete(row) {
  loadingRow.value = row.id
  try {
    await ElMessageBox.confirm(`确定删除报价单 "${row.quoteNumber}" 吗？此操作不可撤销。`, '确认删除', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })

    await quotesApi.delete(row.id)
    ElMessage.success('报价单已删除')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  } finally {
    loadingRow.value = null
  }
}

async function handleBatchDelete() {
  if (selectedRows.value.length === 0) return

  try {
    const deletedCount = selectedRows.value.length
    await ElMessageBox.confirm(`确定删除选中的 ${deletedCount} 个报价单吗？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const ids = selectedRows.value.map(row => row.id)
    await quotesApi.batchDelete(ids)
    ElMessage.success(`已成功删除 ${deletedCount} 个报价单`)
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

async function handleBatchSend() {
  if (selectedRows.value.length === 0) return

  const draftRows = selectedRows.value.filter(r => r.status === 'draft')
  if (draftRows.length === 0) {
    ElMessage.warning('没有可发送的草稿报价单')
    return
  }

  try {
    await ElMessageBox.confirm(`确定发送选中的 ${draftRows.length} 个报价单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })

    for (const row of draftRows) {
      await quotesApi.update(row.id, { status: 'sent' })
    }
    ElMessage.success(`已成功发送 ${draftRows.length} 个报价单`)
    selectedRows.value = []
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量发送失败')
    }
  }
}

function exportCsv() {
  if (tableData.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在导出数据...',
    background: 'rgba(0, 0, 0, 0.7)'
  })

  setTimeout(() => {
    try {
      const headers = [
        '报价单号', '客户', '报价人', '状态', '总金额', 
        '报价日期', '报价有效期铜价', '创建时间'
      ]

      const rows = tableData.value.map(row => [
        row.quoteNumber || '',
        getCustomerDisplayName(row),
        getSalespersonDisplayName(row),
        getStatusText(row.status),
        row.totalAmount ? `¥${row.totalAmount.toFixed(2)}` : '¥0.00',
        formatDate(row.quoteDate),
        extractCopperPrice(row.validityTerm) || '',
        formatDateTime(row.createdAt)
      ])

      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `报价单列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      loading.close()
      ElMessage.success(`成功导出 ${tableData.value.length} 条数据`)
    } catch (error) {
      loading.close()
      ElMessage.error('导出失败：' + error.message)
    }
  }, 500)
}

function exportQuotePdf(quoteId) {
  const id = quoteId || detailQuote.value?.id
  if (!id) {
    ElMessage.warning('无法获取报价单ID')
    return
  }
  window.open(`/api/quotes/${id}/export/pdf`, '_blank')
}

onMounted(() => {
  loadData()
  loadUsers()
  loadCustomers()
  loadSettings()
})
</script>

<style scoped>
.copper-info {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  padding: 12px 0;
}

.copper-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.copper-label {
  font-size: 13px;
  color: #909399;
}

.copper-value {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.copper-total {
  color: #e6a23c;
  font-size: 18px;
}

.filter-section {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.quotes-page {
  padding: 20px;
}

.text-gray {
  color: #909399;
}

.text-primary {
  color: #409eff;
}

.font-semibold {
  font-weight: 600;
}

.text-2xl {
  font-size: 24px;
}

.font-bold {
  font-weight: bold;
}

.mb-4 {
  margin-bottom: 16px;
}

.flex {
  display: flex;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.gap-2 {
  gap: 8px;
}

.gap-6 {
  gap: 24px;
}

.text-right {
  text-align: right;
}

.detail-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  color: #303133;
}

.el-dialog__body {
  max-height: 70vh;
  overflow-y: auto;
}

.quote-dialog :deep(.el-dialog__body) {
  max-height: 75vh;
  overflow-y: auto;
  padding: 20px 24px;
}

.quote-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.quote-form :deep(.el-row) {
  margin-bottom: 0;
}

.quote-items {
  margin: 16px 0;
}

.quote-items-table :deep(.el-input-number) {
  width: 100%;
}

.quote-items-table :deep(.el-input) {
  width: 100%;
}

.quote-items-table :deep(.el-select) {
  width: 100%;
}

.mt-2 {
  margin-top: 12px;
}

.mt-4 {
  margin-top: 20px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
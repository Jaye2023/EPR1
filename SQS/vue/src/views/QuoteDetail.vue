<template>
  <div class="quote-detail">
    <el-breadcrumb separator="/" class="mb-4">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ path: '/quotes' }">报价单管理</el-breadcrumb-item>
      <el-breadcrumb-item>报价单详情</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <div class="flex justify-between items-center">
        <div>
          <h2>报价单详情</h2>
          <p class="text-gray-500 text-sm mt-1">报价单号：{{ quote.quoteNumber || quote.id }}</p>
        </div>
        <div class="flex gap-2">
          <el-select v-model="quoteFormat" placeholder="选择格式" style="width: 160px;">
            <el-option label="标准格式" value="standard" />
            <el-option label="多铜价区间格式" value="multiCopper" />
          </el-select>
          <el-button @click="handlePrint">
            <el-icon><Printer /></el-icon> 打印
          </el-button>
          <el-button v-if="!isEditing && quote.status === 'draft'" type="primary" @click="startEdit">
            <el-icon><Edit /></el-icon> 编辑
          </el-button>
          <el-button v-if="isEditing" type="success" @click="saveEdit">
            <el-icon><Check /></el-icon> 保存
          </el-button>
          <el-button v-if="isEditing" @click="cancelEdit">
            <el-icon><CircleClose /></el-icon> 取消
          </el-button>
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon> 返回列表
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="loading" id="loadingIndicator" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-2 text-muted">加载中...</p>
    </div>

    <div v-else id="quoteContent" class="print-container">
      <div style="width: 210mm; min-height: 297mm; margin: 0 auto; padding: 12mm 15mm; font-family: 'SimSun', serif; position: relative; box-sizing: border-box; background: white;">
        <div style="text-align: center; padding-bottom: 10px; margin-bottom: 12px;">
          <h1 style="font-size: 26px; font-weight: bold; letter-spacing: 10px; margin: 0 0 6px 0;">广东美林电线电缆有限公司</h1>
          <p style="font-size: 11px; letter-spacing: 1.5px; margin: 0 0 4px 0; color: #333;">MAINLAND ELECTRIC WIRE &amp; CABLE CO., LTD.</p>
          <p style="font-size: 11px; letter-spacing: 0.5px; margin: 0 0 4px 0;">广东省东莞市虎门镇陈村工业区</p>
          <div style="font-size: 9px; margin-top: 4px;">
            <span style="float: left;">电话 TEL: 0769-88920080</span>
            <span style="float: right;">邮箱 EMAIL: ywk@gdmainland.com</span>
          </div>
          <div style="clear: both;"></div>
          <div style="margin-top: 14px;">
            <h2 style="font-size: 16px; font-weight: bold; letter-spacing: 8px; margin: 0;">报价单</h2>
            <p style="font-size: 10px; letter-spacing: 1.5px; margin: 4px 0 0 0;">QUOTATION</p>
          </div>
        </div>

        <div style="margin: 10px 0; font-size: 10px; line-height: 1.6;">
          <div>
            <span style="float: left;">客户名称 Customer Name: <strong><span>{{ quote.customer?.name || quote.customerName || '-' }}</span></strong></span>
            <span style="float: right;">日期 DATE: <strong><span>{{ formatDate(quote.quoteDate) || '-' }}</span></strong></span>
          </div>
          <div style="clear: both;"></div>
          <div style="margin-top: 4px;">
            <span>联系人 Customer Contact: <span>{{ quote.customer?.contactPerson || quote.contactPerson || '-' }}</span></span>
          </div>
        </div>

        <div style="margin-top: 10px;">
          <table v-if="quoteFormat === 'standard'" style="width: 100%; border-collapse: collapse; font-size: 9px; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #d4d4d4;">
                <th style="padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">序号<br><span style="font-weight: normal;">No.</span></th>
                <th style="padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">品 名 规 格<br><span style="font-weight: normal;">Item Name &amp; Specification</span></th>
                <th style="padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">单位<br><span style="font-weight: normal;">Unit</span></th>
                <th style="padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">单价（元）<br><span style="font-weight: normal;">Price (RMB)</span></th>
                <th style="padding: 8px 4px; text-align: center; font-weight: bold; border: 1px solid #000;">备注/特殊加工<br><span style="font-weight: normal;">Remarks</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in (isEditing ? editItems : quote.items)" :key="index">
                <td style="padding: 8px 4px; text-align: center; border: 1px solid #000;">{{ index + 1 }}</td>
                <td style="padding: 8px 4px; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input v-model="item.description" size="small" />
                  </template>
                  <template v-else>{{ item.description || '-' }}</template>
                </td>
                <td style="padding: 8px 4px; text-align: center; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-select v-model="item.unit" size="small" style="width: 60px;">
                      <el-option label="pcs" value="pcs" />
                      <el-option label="米" value="m" />
                      <el-option label="套" value="set" />
                    </el-select>
                  </template>
                  <template v-else>{{ item.unit || 'pcs' }}</template>
                </td>
                <td style="padding: 8px 4px; text-align: center; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input-number v-model="item.unitPrice" :min="0" :precision="4" size="small" style="width: 80px;" @change="recalculateAmount" />
                  </template>
                  <template v-else>{{ item.unitPrice ? item.unitPrice.toFixed(2) : '-' }}</template>
                </td>
                <td style="padding: 8px 4px; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input v-model="item.remarks" size="small" />
                  </template>
                  <template v-else>{{ item.remarks || '-' }}</template>
                </td>
              </tr>
            </tbody>
          </table>

          <table v-else style="width: 100%; border-collapse: collapse; font-size: 8px; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #d4d4d4;">
                <th style="padding: 6px 2px; text-align: center; font-weight: bold; border: 1px solid #000;">序号<br><span style="font-weight: normal;">No.</span></th>
                <th style="padding: 6px 2px; text-align: center; font-weight: bold; border: 1px solid #000;">品 名 规 格<br><span style="font-weight: normal;">Item Name &amp; Specification</span></th>
                <th style="padding: 6px 2px; text-align: center; font-weight: bold; border: 1px solid #000;">单位<br><span style="font-weight: normal;">Unit</span></th>
                <th v-for="(range, idx) in copperRanges" :key="idx" style="padding: 4px 2px; text-align: center; font-weight: bold; border: 1px solid #000; min-width: 55px;">
                  <div style="writing-mode: vertical-rl; text-orientation: mixed; margin: 0 auto;">{{ range.label }}</div>
                </th>
                <th style="padding: 6px 2px; text-align: center; font-weight: bold; border: 1px solid #000;">备注/特殊加工<br><span style="font-weight: normal;">Remarks</span></th>
              </tr>
              <tr style="background-color: #e8e8e8;">
                <td style="border: 1px solid #000;"></td>
                <td style="border: 1px solid #000;"></td>
                <td style="border: 1px solid #000;"></td>
                <td v-for="(range, idx) in copperRanges" :key="idx" style="padding: 2px; text-align: center; border: 1px solid #000;">
                  {{ range.max }}
                </td>
                <td style="border: 1px solid #000;"></td>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in (isEditing ? editItems : quote.items)" :key="index">
                <td style="padding: 6px 2px; text-align: center; border: 1px solid #000;">{{ index + 1 }}</td>
                <td style="padding: 6px 2px; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input v-model="item.description" size="small" />
                  </template>
                  <template v-else>{{ item.description || '-' }}</template>
                </td>
                <td style="padding: 6px 2px; text-align: center; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-select v-model="item.unit" size="small" style="width: 50px;">
                      <el-option label="pcs" value="pcs" />
                      <el-option label="米" value="m" />
                      <el-option label="套" value="set" />
                    </el-select>
                  </template>
                  <template v-else>{{ item.unit || 'pcs' }}</template>
                </td>
                <td v-for="(range, idx) in copperRanges" :key="idx" style="padding: 4px 2px; text-align: center; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input-number 
                      :model-value="getItemCopperPrice(item, idx) || 0" 
                      :min="0" 
                      :precision="4" 
                      size="small" 
                      style="width: 60px;"
                      @update:model-value="(val) => updateCopperPrice(item, idx, val)"
                    />
                  </template>
                  <template v-else>{{ getItemCopperPrice(item, idx) ? getItemCopperPrice(item, idx).toFixed(2) : '-' }}</template>
                </td>
                <td style="padding: 6px 2px; border: 1px solid #000;">
                  <template v-if="isEditing">
                    <el-input v-model="item.remarks" size="small" />
                  </template>
                  <template v-else>{{ item.remarks || '-' }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 10px; font-size: 9px; line-height: 1.5;">
          <div style="margin-bottom: 4px;">
            <strong>1.付款方式:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.paymentMethod" size="small" style="width: 400px;" />
            </template>
            <template v-else>
              <span>{{ quote.paymentMethod || '□现金；□月结____天（以电汇或________天的银行承兑汇票结清）；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>2.交货期限:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.deliveryTerm" size="small" style="width: 400px;" />
            </template>
            <template v-else>
              <span>{{ quote.deliveryTerm || '报价单双方确认后10-15工作日，以双方确认订单为准；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>3.品质材质要求:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.qualityRequirement" size="small" style="width: 500px;" />
            </template>
            <template v-else>
              <span>{{ quote.qualityRequirement || '产品质量无特殊备注要求以安规为准，环保符合ROHS、REACH、PAHS标准。插头铜脚为铜合金材质，没有特定指出适用于豁免条款含铅不高于40000PPM，如有特殊环保和工艺要求（如低铅、REACH等）价格另议；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>4.客户特殊要求:</strong>
            <span>以双方签认的样板或图纸为准，包装扎带等特殊要求备注写明；</span>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>5.增值税:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.taxRate" size="small" style="width: 50px;" />%
            </template>
            <template v-else>
              <span>{{ quote.taxRate ? '报价□包含 □不包含' + quote.taxRate + '%增值税发票款；' : '报价□包含 □不包含13%增值税发票款；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>6.货物交付:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.shippingInfo" size="small" style="width: 400px;" />
            </template>
            <template v-else>
              <span>{{ quote.shippingInfo || '此报价□包含 □不包含从我司至贵司运费，货物交付至贵司地址 广东省 中山市；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>7.报价有效期:</strong>
            <template v-if="isEditing">
              <el-input v-model="editQuote.validityTerm" size="small" style="width: 500px;" />
            </template>
            <template v-else>
              <span>{{ quote.validityTerm || '本报价依据 □铜价 100001-102000元/吨 报出，若铜价或原材料波动剧烈且本报价单未能及时签回，报价单须重新报价；' }}</span>
            </template>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>8.</strong>
            <span>本报价单作为合同的补充协议或合同本身，与合同正文具有同等的法律效力。</span>
          </div>
        </div>

        <div style="position: absolute; bottom: 18mm; left: 15mm; right: 15mm; font-size: 9px;">
          <div style="float: left; width: 48%;">
            <div style="text-align:left;margin-bottom: 4px;">客户签复:</div>
            <div style="margin-bottom: 6px;">(Your Signature)</div>
            <div style="border-bottom: 1px solid #000; margin-bottom: 6px; width: 260px;"></div>
            <div style="text-align: left; margin-top: 30px; margin-bottom: 35px;">
              <span style="display: inline-block; width: 50px; text-align: center; border-bottom: 1px solid #000; margin: 0 8px;"></span>
              <span>年</span>
              <span style="display: inline-block; width: 50px; text-align: center; border-bottom: 1px solid #000; margin: 0 8px;"></span>
              <span>月</span>
              <span style="display: inline-block; width: 50px; text-align: center; border-bottom: 1px solid #000; margin: 0 8px;"></span>
              <span>日</span>
            </div>
          </div>
          <div style="float: right; width: 48%;">
            <div style="text-align: left; margin-bottom: 4px;">报价人：<span>{{ typeof quote.salesperson === 'object' ? quote.salesperson.name : (quote.salesperson || '李小姐') }}</span></div>
            <div style="text-align: left; margin-bottom: 6px;">(Supplier)</div>
            <div style="border-bottom: 1px solid #000; margin: 0 auto 6px; width: 200px;"></div>
            <div style="text-align: left; margin-bottom: 4px;">核准:</div>
            <div style="text-align: left; margin-bottom: 6px;">(Approved By)</div>
            <div style="border-bottom: 1px solid #000; margin: 0 auto 8px; width: 200px;"></div>
            <div style="text-align: left;"><span>{{ formatDate(quote.quoteDate) || '-' }}</span></div>
          </div>
          <div style="clear: both;"></div>
        </div>
      </div>

      <div v-if="isEditing" style="margin-top: 20px; text-align: center;">
        <el-button type="success" size="large" @click="saveEdit">
          <el-icon><Check /></el-icon> 保存修改
        </el-button>
        <el-button size="large" @click="cancelEdit" class="ml-2">
          <el-icon><CircleClose /></el-icon> 取消编辑
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Printer, Edit, ArrowLeft, Check, CircleClose } from '@element-plus/icons-vue'
import { quotesApi } from '../api'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const isEditing = ref(false)
const quoteFormat = ref('standard')
const quote = ref({
  items: []
})
const editQuote = ref({})
const editItems = ref([])

const copperRanges = [
  { label: '92001-94000', min: 92001, max: 94000 },
  { label: '94001-96000', min: 94001, max: 96000 },
  { label: '96001-98000', min: 96001, max: 98000 },
  { label: '98001-100000', min: 98001, max: 100000 },
  { label: '100001-102000', min: 100001, max: 102000 },
  { label: '102001-104000', min: 102001, max: 104000 },
  { label: '104001-106000', min: 104001, max: 106000 },
  { label: '106001-108000', min: 106001, max: 108000 }
]

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getItemCopperPrice(item, index) {
  if (!item.copperPrices) return item.unitPrice || null
  return item.copperPrices[index] || null
}

function updateCopperPrice(item, index, value) {
  if (!item.copperPrices) {
    item.copperPrices = []
  }
  item.copperPrices[index] = value
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

async function loadQuote() {
  const id = route.params.id
  
  console.log('Loading quote with id:', id)
  
  if (!id || id === '' || id === 'undefined' || id === 'null') {
    console.error('无效的报价单ID:', id)
    ElMessage.error('无法获取报价单ID，请从报价单列表进入')
    loading.value = false
    return
  }
  
  loading.value = true
  try {
    console.log('Fetching quote data from API:', `/quotes/${id}`)
    const response = await quotesApi.get(id)
    
    console.log('API response received:', response)
    
    if (!response || typeof response !== 'object') {
      throw new Error('获取到无效的报价单数据')
    }
    
    const data = response.data || response
    
    console.log('Quote data after unwrap:', data)
    
    if (!data || typeof data !== 'object') {
      throw new Error('报价单数据格式错误')
    }
    
    const quoteId = data.id || data.quoteId || id
    if (!quoteId) {
      throw new Error('报价单数据中缺少ID')
    }
    
    console.log('Quote ID:', quoteId)
    
    let items = []
    try {
      console.log('Fetching quote items:', `/quotes/${quoteId}/items`)
      const itemsResponse = await quotesApi.getQuoteItems(quoteId)
      if (itemsResponse && typeof itemsResponse === 'object') {
        items = itemsResponse.data || itemsResponse || []
      }
      console.log('Fetched items:', items.length, 'items')
    } catch (itemsError) {
      console.warn('获取报价明细失败:', itemsError)
    }
    
    console.log('Loading quote:', id, data.quoteNumber || data.id)
    
    const normalizedData = normalizeQuoteData(data)
    normalizedData.items = Array.isArray(items) ? items.map(normalizeQuoteItem) : (normalizedData.items || [])
    
    console.log('Normalized quote data:', {
      id: normalizedData.id,
      quoteNumber: normalizedData.quoteNumber,
      itemCount: normalizedData.items.length
    })
    
    quote.value = normalizedData
    initEditData()
    loading.value = false
  } catch (error) {
    console.error('Failed to load quote:', error.message, error.stack)
    ElMessage.error(error.message || '加载报价单失败')
    loading.value = false
  }
}

function normalizeQuoteData(data) {
  const normalized = {
    id: data.id || data.quoteId || '',
    quoteNumber: data.quoteNumber || data.quote_no || data.quote_number || '',
    customerCode: data.customerCode || data.customer_code || data.customerId || '',
    salespersonId: data.salespersonId || data.salesperson_id || '',
    salespersonName: data.salespersonName || (data.salesperson && data.salesperson.name) || '',
    quoteDate: data.quoteDate || data.quote_date || '',
    validUntil: data.validUntil || data.valid_until || '',
    paymentMethod: data.paymentMethod || data.payment_method || '',
    deliveryTerm: data.deliveryTerm || data.delivery_term || '',
    validityTerm: data.validityTerm || data.validity_term || '',
    qualityRequirement: data.qualityRequirement || '',
    taxRate: data.taxRate || data.tax_rate || 0,
    shippingInfo: data.shippingInfo || '',
    currency: data.currency || 'CNY',
    subtotal: data.subtotal || data.sub_total || 0,
    taxAmount: data.taxAmount || data.tax_amount || 0,
    totalAmount: data.totalAmount || data.total_amount || 0,
    status: data.status || 'draft',
    remark: data.remark || data.remarks || '',
    items: [],
    createdAt: data.createdAt || data.created_at || '',
    updatedAt: data.updatedAt || data.updated_at || ''
  }
  
  if (data.customer && typeof data.customer === 'object') {
    normalized.customer = {
      name: data.customer.name || data.customer.customerName || '',
      contactPerson: data.customer.contactPerson || data.customer.contact_person || '',
      phone: data.customer.phone || data.customer.contactPhone || '',
      address: data.customer.address || ''
    }
    normalized.customerName = normalized.customer.name
  } else {
    normalized.customerName = data.customerName || ''
  }
  
  if (Array.isArray(data.items)) {
    normalized.items = data.items.map(item => ({
      id: item.id || '',
      materialCode: item.materialCode || item.material_code || '',
      description: item.description || item.product_name || '',
      wireSpec: item.wireSpec || item.specification || '',
      formula: item.formula || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      unitPrice: item.unitPrice || item.unit_price || 0,
      amount: item.amount || item.total_price || 0,
      remarks: item.remarks || '',
      copperPrices: Array.isArray(item.copperPrices) ? [...item.copperPrices] : []
    }))
  }
  
  return normalized
}

watch(() => route.params.id, () => {
  isEditing.value = false
  loadQuote()
})

function initEditData() {
  editQuote.value = {
    paymentMethod: quote.value.paymentMethod || '',
    deliveryTerm: quote.value.deliveryTerm || '',
    qualityRequirement: quote.value.qualityRequirement || '',
    taxRate: quote.value.taxRate || '',
    shippingInfo: quote.value.shippingInfo || '',
    validityTerm: quote.value.validityTerm || ''
  }
  editItems.value = JSON.parse(JSON.stringify(quote.value.items || []))
}

function startEdit() {
  isEditing.value = true
  initEditData()
}

function cancelEdit() {
  isEditing.value = false
  initEditData()
}

function recalculateAmount() {
  editItems.value.forEach(item => {
    item.amount = (item.unitPrice || 0) * (item.quantity || 1)
  })
}

async function saveEdit() {
  try {
    const updateData = {
      id: quote.value.id,
      items: editItems.value,
      paymentMethod: editQuote.value.paymentMethod,
      deliveryTerm: editQuote.value.deliveryTerm,
      qualityRequirement: editQuote.value.qualityRequirement,
      taxRate: editQuote.value.taxRate,
      shippingInfo: editQuote.value.shippingInfo,
      validityTerm: editQuote.value.validityTerm
    }
    
    await quotesApi.update(quote.value.id, updateData)
    ElMessage.success('保存成功')
    
    isEditing.value = false
    await loadQuote()
  } catch (error) {
    console.error('Failed to save quote:', error)
    ElMessage.error('保存失败')
  }
}

function handlePrint() {
  window.print()
}

function goBack() {
  router.push('/quotes')
}

onMounted(() => {
  loadQuote()
})
</script>

<style scoped>
.quote-detail {
  padding: 20px;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 20px;
}

.print-container {
  width: 100%;
}

@media print {
  body * {
    visibility: hidden;
  }
  .print-container,
  .print-container * {
    visibility: visible;
  }
  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  body {
    background: white;
  }
  .page-header,
  .el-breadcrumb,
  .el-select {
    display: none;
  }
}
</style>

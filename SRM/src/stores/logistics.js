import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useLogisticsStore = defineStore('logistics', () => {
  const asnList = ref([])
  const appointmentList = ref([])
  const exceptionList = ref([])
  const transitList = ref([])

  const mockAsnData = [
    {
      id: 'ASN20240120001',
      poNo: 'PO20240115001',
      supplier: '上海华腾电子',
      supplierCode: 'SUP001',
      shipDate: '2024-01-18',
      eta: '2024-01-20 10:00',
      items: [
        { materialCode: 'M001001', materialName: '电阻10K', spec: '0805', quantity: 10000, batch: 'B2024011801', mfgDate: '2024-01-15', expiryDate: '2026-01-15' },
        { materialCode: 'M001002', materialName: '电容10uF', spec: '0805', quantity: 5000, batch: 'B2024011802', mfgDate: '2024-01-16', expiryDate: '2026-01-16' }
      ],
      packages: 48,
      boxes: 240,
      pallets: 4,
      grossWeight: 120,
      volume: 4.5,
      carrier: '德邦物流',
      trackingNo: 'DB20240118001',
      plateNo: '沪A12345',
      driver: '张师傅',
      phone: '13800138001',
      attachments: ['装箱单.pdf', '合格证.pdf'],
      status: 'in_transit',
      createTime: '2024-01-18 09:30',
      updateTime: '2024-01-18 14:00'
    },
    {
      id: 'ASN20240120002',
      poNo: 'PO20240116002',
      supplier: '深圳精密科技',
      supplierCode: 'SUP002',
      shipDate: '2024-01-19',
      eta: '2024-01-21 14:00',
      items: [
        { materialCode: 'M002001', materialName: '连接器', spec: 'USB-C', quantity: 2000, batch: 'B2024011901', mfgDate: '2024-01-17', expiryDate: '2026-01-17' }
      ],
      packages: 12,
      boxes: 60,
      pallets: 1,
      grossWeight: 35,
      volume: 1.2,
      carrier: '顺丰速运',
      trackingNo: 'SF20240119002',
      plateNo: '粤B54321',
      driver: '李师傅',
      phone: '13900139002',
      attachments: ['装箱单.pdf'],
      status: 'shipped',
      createTime: '2024-01-19 10:00',
      updateTime: '2024-01-19 16:30'
    },
    {
      id: 'ASN20240120003',
      poNo: 'PO20240114003',
      supplier: '苏州塑胶制品',
      supplierCode: 'SUP003',
      shipDate: '2024-01-17',
      eta: '2024-01-19 09:00',
      items: [
        { materialCode: 'M003001', materialName: '塑料外壳', spec: '型号A', quantity: 1000, batch: 'B2024011701', mfgDate: '2024-01-15', expiryDate: '2026-01-15' },
        { materialCode: 'M003002', materialName: '橡胶垫圈', spec: '直径20mm', quantity: 5000, batch: 'B2024011702', mfgDate: '2024-01-16', expiryDate: '2026-01-16' }
      ],
      packages: 36,
      boxes: 180,
      pallets: 3,
      grossWeight: 85,
      volume: 3.2,
      carrier: '中通快递',
      trackingNo: 'ZT20240117003',
      plateNo: '苏C67890',
      driver: '王师傅',
      phone: '13700137003',
      attachments: ['装箱单.pdf', '合格证.pdf', '检测报告.pdf'],
      status: 'completed',
      createTime: '2024-01-17 08:00',
      updateTime: '2024-01-19 11:30'
    },
    {
      id: 'ASN20240120004',
      poNo: 'PO20240118004',
      supplier: '杭州五金制品',
      supplierCode: 'SUP004',
      shipDate: '',
      eta: '2024-01-22 16:00',
      items: [
        { materialCode: 'M004001', materialName: '螺丝M3', spec: '不锈钢', quantity: 10000, batch: 'B2024012001', mfgDate: '2024-01-19', expiryDate: '2026-01-19' }
      ],
      packages: 24,
      boxes: 120,
      pallets: 2,
      grossWeight: 60,
      volume: 2.0,
      carrier: '圆通速递',
      trackingNo: '',
      plateNo: '',
      driver: '',
      phone: '',
      attachments: [],
      status: 'draft',
      createTime: '2024-01-20 11:00',
      updateTime: '2024-01-20 11:00'
    },
    {
      id: 'ASN20240120005',
      poNo: 'PO20240117005',
      supplier: '北京光电科技',
      supplierCode: 'SUP005',
      shipDate: '2024-01-18',
      eta: '2024-01-20 11:00',
      items: [
        { materialCode: 'M005001', materialName: 'LED灯珠', spec: 'SMD3528', quantity: 20000, batch: 'B2024011801', mfgDate: '2024-01-16', expiryDate: '2026-01-16' }
      ],
      packages: 56,
      boxes: 280,
      pallets: 4,
      grossWeight: 45,
      volume: 5.0,
      carrier: 'EMS',
      trackingNo: 'EMS20240118005',
      plateNo: '京D11111',
      driver: '赵师傅',
      phone: '13600136005',
      attachments: ['装箱单.pdf'],
      status: 'partial_received',
      createTime: '2024-01-18 09:00',
      updateTime: '2024-01-20 10:30'
    }
  ]

  const mockAppointmentData = [
    {
      id: 'APT20240120001',
      supplier: '上海华腾电子',
      supplierCode: 'SUP001',
      poNo: 'PO20240115001',
      materialCode: 'M001001',
      materialName: '电阻10K',
      etaDate: '2024-01-20',
      etaTime: '10:00-12:00',
      transportType: '公路运输',
      plateNo: '沪A12345',
      driver: '张师傅',
      contact: '李经理',
      phone: '13800138001',
      remark: '货物易碎，小心轻放',
      status: 'approved',
      createTime: '2024-01-18 09:30',
      approveTime: '2024-01-18 14:00',
      approver: '王采购'
    },
    {
      id: 'APT20240120002',
      supplier: '深圳精密科技',
      supplierCode: 'SUP002',
      poNo: 'PO20240116002',
      materialCode: 'M002001',
      materialName: '连接器',
      etaDate: '2024-01-21',
      etaTime: '14:00-16:00',
      transportType: '航空运输',
      plateNo: '粤B54321',
      driver: '李师傅',
      contact: '陈经理',
      phone: '13900139002',
      remark: '',
      status: 'pending',
      createTime: '2024-01-19 10:00',
      approveTime: '',
      approver: ''
    },
    {
      id: 'APT20240120003',
      supplier: '苏州塑胶制品',
      supplierCode: 'SUP003',
      poNo: 'PO20240114003',
      materialCode: 'M003001',
      materialName: '塑料外壳',
      etaDate: '2024-01-19',
      etaTime: '09:00-11:00',
      transportType: '公路运输',
      plateNo: '苏C67890',
      driver: '王师傅',
      contact: '周经理',
      phone: '13700137003',
      remark: '',
      status: 'arrived',
      createTime: '2024-01-17 08:00',
      approveTime: '2024-01-17 10:00',
      approver: '赵采购'
    },
    {
      id: 'APT20240120004',
      supplier: '杭州五金制品',
      supplierCode: 'SUP004',
      poNo: 'PO20240118004',
      materialCode: 'M004001',
      materialName: '螺丝M3',
      etaDate: '2024-01-22',
      etaTime: '14:00-16:00',
      transportType: '公路运输',
      plateNo: '',
      driver: '',
      contact: '吴经理',
      phone: '13500135004',
      remark: '请安排叉车卸货',
      status: 'rejected',
      createTime: '2024-01-20 11:00',
      approveTime: '2024-01-20 13:00',
      approver: '王采购',
      rejectReason: '时间段已排满，请改约'
    }
  ]

  const mockExceptionData = [
    {
      id: 'EXC20240120001',
      type: 'DELAY',
      typeName: '到货延迟',
      asnNo: 'ASN20240120001',
      poNo: 'PO20240115001',
      supplier: '上海华腾电子',
      material: '电阻10K',
      expectedTime: '2024-01-20 10:00',
      actualTime: '2024-01-20 14:30',
      delayHours: 4.5,
      reason: '高速堵车',
      status: 'pending',
      handler: '',
      handleTime: '',
      createTime: '2024-01-20 10:30'
    },
    {
      id: 'EXC20240120002',
      type: 'SHORT',
      typeName: '短装',
      asnNo: 'ASN20240120005',
      poNo: 'PO20240117005',
      supplier: '北京光电科技',
      material: 'LED灯珠',
      expectedQty: 20000,
      actualQty: 19500,
      diffQty: 500,
      reason: '生产数量不足',
      status: 'processing',
      handler: '李采购',
      handleTime: '2024-01-20 11:00',
      createTime: '2024-01-20 10:30'
    },
    {
      id: 'EXC20240120003',
      type: 'DAMAGE',
      typeName: '破损',
      asnNo: 'ASN20240120003',
      poNo: 'PO20240114003',
      supplier: '苏州塑胶制品',
      material: '塑料外壳',
      damageQty: 20,
      damagePercent: 2,
      reason: '运输途中挤压',
      status: 'resolved',
      handler: '王采购',
      handleTime: '2024-01-19 15:00',
      createTime: '2024-01-19 11:30'
    }
  ]

  const mockTransitData = [
    {
      asnNo: 'ASN20240120001',
      poNo: 'PO20240115001',
      supplier: '上海华腾电子',
      carrier: '德邦物流',
      trackingNo: 'DB20240118001',
      status: 'in_transit',
      shipTime: '2024-01-18 14:00',
      eta: '2024-01-20 10:00',
      currentLocation: '上海市松江区',
      progress: 65,
      delayHours: 4.5,
      isDelayed: true
    },
    {
      asnNo: 'ASN20240120002',
      poNo: 'PO20240116002',
      supplier: '深圳精密科技',
      carrier: '顺丰速运',
      trackingNo: 'SF20240119002',
      status: 'shipped',
      shipTime: '2024-01-19 16:30',
      eta: '2024-01-21 14:00',
      currentLocation: '深圳市南山区',
      progress: 15,
      delayHours: 0,
      isDelayed: false
    },
    {
      asnNo: 'ASN20240120005',
      poNo: 'PO20240117005',
      supplier: '北京光电科技',
      carrier: 'EMS',
      trackingNo: 'EMS20240118005',
      status: 'partial_received',
      shipTime: '2024-01-18 09:00',
      eta: '2024-01-20 11:00',
      currentLocation: '仓库收货中',
      progress: 90,
      delayHours: 0,
      isDelayed: false
    }
  ]

  function initData() {
    asnList.value = mockAsnData
    appointmentList.value = mockAppointmentData
    exceptionList.value = mockExceptionData
    transitList.value = mockTransitData
  }

  function getAsnStatusLabel(status) {
    const labels = {
      draft: '草稿',
      submitted: '已提交',
      shipped: '已发运',
      in_transit: '运输中',
      partial_received: '部分收货',
      completed: '已完成',
      closed: '已关闭'
    }
    return labels[status] || status
  }

  function getAppointmentStatusLabel(status) {
    const labels = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
      arrived: '已到厂'
    }
    return labels[status] || status
  }

  function getExceptionTypeLabel(type) {
    const labels = {
      DELAY: '到货延迟',
      SHORT: '短装',
      OVER: '多装',
      DAMAGE: '破损',
      LABEL: '标签错误'
    }
    return labels[type] || type
  }

  function getExceptionStatusLabel(status) {
    const labels = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决'
    }
    return labels[status] || status
  }

  const pendingAppointments = computed(() => 
    appointmentList.value.filter(a => a.status === 'pending')
  )

  const inTransitAsns = computed(() => 
    asnList.value.filter(a => a.status === 'in_transit' || a.status === 'shipped')
  )

  const pendingExceptions = computed(() => 
    exceptionList.value.filter(e => e.status === 'pending')
  )

  return {
    asnList,
    appointmentList,
    exceptionList,
    transitList,
    initData,
    getAsnStatusLabel,
    getAppointmentStatusLabel,
    getExceptionTypeLabel,
    getExceptionStatusLabel,
    pendingAppointments,
    inTransitAsns,
    pendingExceptions
  }
})
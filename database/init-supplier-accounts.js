import { initDatabase, getDb } from './config.js'

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function initSupplierAccounts() {
  console.log('Initializing supplier accounts test data...')
  
  initDatabase()
  const db = getDb()

  const supplierAccounts = [
    {
      supplier_code: 'SUP001',
      login_email: 'contact@dongguan-copper.com',
      password: generatePassword(),
      company_name: '东莞市铜业公司',
      unified_social_credit_code: '91441900MA51W3X88Q',
      tax_type: 'general',
      contact_person: '张经理',
      contact_phone: '13800138001',
      address: '东莞市长安镇',
      bank_name: '工商银行',
      bank_account: '6222082010001234567',
      status: 'active',
      review_status: 'approved',
      remark: '主要供应商'
    },
    {
      supplier_code: 'SUP002',
      login_email: 'sales@shenzhen-plastic.com',
      password: generatePassword(),
      company_name: '深圳塑料制品厂',
      unified_social_credit_code: '91440300MA5DL8X88Y',
      tax_type: 'small',
      contact_person: '李小姐',
      contact_phone: '13800138002',
      address: '深圳市宝安区',
      bank_name: '建设银行',
      bank_account: '6227002010009876543',
      status: 'active',
      review_status: 'approved',
      remark: ''
    },
    {
      supplier_code: 'SUP003',
      login_email: 'info@guangzhou-machinery.com',
      password: generatePassword(),
      company_name: '广州机械设备公司',
      unified_social_credit_code: '91440100MA5K8X8888',
      tax_type: 'general',
      contact_person: '王先生',
      contact_phone: '13800138003',
      address: '广州市天河区',
      bank_name: '中国银行',
      bank_account: '6217850010001122334',
      status: 'pending_review',
      review_status: 'pending',
      remark: '待审核'
    },
    {
      supplier_code: 'SUP004',
      login_email: 'logistics@express-service.cn',
      password: generatePassword(),
      company_name: '物流运输服务',
      unified_social_credit_code: '91440300MA5H8X8888',
      tax_type: 'small',
      contact_person: '赵经理',
      contact_phone: '13800138004',
      address: '深圳市福田区',
      bank_name: '农业银行',
      bank_account: '6228481010005566778',
      status: 'active',
      review_status: 'approved',
      remark: '物流服务商'
    },
    {
      supplier_code: 'SUP005',
      login_email: 'support@shanghai-electronic.com',
      password: generatePassword(),
      company_name: '上海电子元件厂',
      unified_social_credit_code: '91310000MA1B8X8888',
      tax_type: 'general',
      contact_person: '刘主任',
      contact_phone: '13800138005',
      address: '上海市浦东新区',
      bank_name: '交通银行',
      bank_account: '6222620010009988776',
      status: 'temporary_frozen',
      review_status: 'approved',
      remark: '临时冻结'
    },
    {
      supplier_code: 'SUP006',
      login_email: 'business@beijing-packing.com',
      password: generatePassword(),
      company_name: '北京包装材料公司',
      unified_social_credit_code: '91110000MA018X8888',
      tax_type: 'small',
      contact_person: '陈经理',
      contact_phone: '13800138006',
      address: '北京市朝阳区',
      bank_name: '招商银行',
      bank_account: '6225880010002233445',
      status: 'active',
      review_status: 'approved',
      remark: ''
    },
    {
      supplier_code: 'SUP007',
      login_email: 'contact@chengdu-metal.com',
      password: generatePassword(),
      company_name: '成都金属加工厂',
      unified_social_credit_code: '91510100MA68X88888',
      tax_type: 'general',
      contact_person: '周厂长',
      contact_phone: '13800138007',
      address: '成都市高新区',
      bank_name: '民生银行',
      bank_account: '6226220010006677889',
      status: 'pending_activation',
      review_status: 'approved',
      remark: '待激活'
    },
    {
      supplier_code: 'SUP008',
      login_email: 'sales@hangzhou-chemical.com',
      password: generatePassword(),
      company_name: '杭州化工原料公司',
      unified_social_credit_code: '91330100MA28X88888',
      tax_type: 'general',
      contact_person: '吴经理',
      contact_phone: '13800138008',
      address: '杭州市萧山区',
      bank_name: '浦发银行',
      bank_account: '6225220010003344556',
      status: 'disabled',
      review_status: 'approved',
      remark: '已禁用'
    },
    {
      supplier_code: 'SUP009',
      login_email: 'info@wuhan-textile.com',
      password: generatePassword(),
      company_name: '武汉纺织材料厂',
      unified_social_credit_code: '91420100MA48X88888',
      tax_type: 'small',
      contact_person: '郑厂长',
      contact_phone: '13800138009',
      address: '武汉市汉阳区',
      bank_name: '光大银行',
      bank_account: '6226620010007788990',
      status: 'active',
      review_status: 'approved',
      remark: ''
    },
    {
      supplier_code: 'SUP010',
      login_email: 'business@nanjing-machinery.com',
      password: generatePassword(),
      company_name: '南京精密机械公司',
      unified_social_credit_code: '91320100MA38X88888',
      tax_type: 'general',
      contact_person: '孙工程师',
      contact_phone: '13800138010',
      address: '南京市江宁区',
      bank_name: '兴业银行',
      bank_account: '6229080010004455667',
      status: 'active',
      review_status: 'approved',
      remark: '精密设备供应商'
    },
    {
      supplier_code: 'SUP011',
      login_email: 'support@xian-optics.com',
      password: generatePassword(),
      company_name: '西安光电科技',
      unified_social_credit_code: '91610100MA18X88888',
      tax_type: 'general',
      contact_person: '马经理',
      contact_phone: '13800138011',
      address: '西安市高新区',
      bank_name: '华夏银行',
      bank_account: '6226330010005566778',
      status: 'active',
      review_status: 'approved',
      remark: ''
    },
    {
      supplier_code: 'SUP012',
      login_email: 'trade@xiamen-trade.com',
      password: generatePassword(),
      company_name: '厦门贸易公司',
      unified_social_credit_code: '91350200MA58X88888',
      tax_type: 'general',
      contact_person: '林经理',
      contact_phone: '13800138012',
      address: '厦门市思明区',
      bank_name: '中信银行',
      bank_account: '6226900010006677889',
      status: 'active',
      review_status: 'approved',
      remark: '贸易代理'
    },
    {
      supplier_code: 'SUP013',
      login_email: 'sales@qingdao-rubber.com',
      password: generatePassword(),
      company_name: '青岛橡胶制品',
      unified_social_credit_code: '91370200MA78X88888',
      tax_type: 'small',
      contact_person: '何厂长',
      contact_phone: '13800138013',
      address: '青岛市黄岛区',
      bank_name: '恒丰银行',
      bank_account: '6230210010007788990',
      status: 'active',
      review_status: 'approved',
      remark: ''
    },
    {
      supplier_code: 'SUP014',
      login_email: 'info@suzhou-electronics.com',
      password: generatePassword(),
      company_name: '苏州电子科技',
      unified_social_credit_code: '91320500MA88X88888',
      tax_type: 'general',
      contact_person: '罗经理',
      contact_phone: '13800138014',
      address: '苏州市工业园区',
      bank_name: '江苏银行',
      bank_account: '6228660010008899001',
      status: 'pending_review',
      review_status: 'pending',
      remark: '新供应商待审核'
    },
    {
      supplier_code: 'SUP015',
      login_email: 'contact@chongqing-auto.com',
      password: generatePassword(),
      company_name: '重庆汽车配件',
      unified_social_credit_code: '91500000MA98X88888',
      tax_type: 'general',
      contact_person: '梁经理',
      contact_phone: '13800138015',
      address: '重庆市渝北区',
      bank_name: '重庆银行',
      bank_account: '6224760010009900112',
      status: 'active',
      review_status: 'approved',
      remark: '汽车零部件'
    }
  ]

  const insertAccount = db.prepare(`
    INSERT OR REPLACE INTO supplier_accounts 
    (supplier_code, login_email, password, company_name, unified_social_credit_code, tax_type, contact_person, contact_phone, address, bank_name, bank_account, status, review_status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  let count = 0
  for (const account of supplierAccounts) {
    try {
      insertAccount.run(
        account.supplier_code,
        account.login_email,
        account.password,
        account.company_name,
        account.unified_social_credit_code,
        account.tax_type,
        account.contact_person,
        account.contact_phone,
        account.address,
        account.bank_name,
        account.bank_account,
        account.status,
        account.review_status,
        account.remark
      )
      count++
    } catch (e) {
      console.log(`  Skip ${account.supplier_code}: ${e.message}`)
    }
  }
  console.log(`Inserted ${count} supplier accounts`)

  const subAccounts = [
    { supplier_account_id: 1, login_email: 'business@dongguan-copper.com', password: generatePassword(), contact_person: '张业务', contact_phone: '13800138111', role: 'business', status: 'active' },
    { supplier_account_id: 1, login_email: 'finance@dongguan-copper.com', password: generatePassword(), contact_person: '李财务', contact_phone: '13800138112', role: 'finance', status: 'active' },
    { supplier_account_id: 2, login_email: 'sales1@shenzhen-plastic.com', password: generatePassword(), contact_person: '王销售', contact_phone: '13800138121', role: 'business', status: 'active' },
    { supplier_account_id: 4, login_email: 'warehouse@express-service.cn', password: generatePassword(), contact_person: '赵仓库', contact_phone: '13800138141', role: 'warehouse', status: 'active' },
    { supplier_account_id: 6, login_email: 'quality@beijing-packing.com', password: generatePassword(), contact_person: '陈质检', contact_phone: '13800138161', role: 'quality', status: 'active' },
    { supplier_account_id: 10, login_email: 'engineer@nanjing-machinery.com', password: generatePassword(), contact_person: '孙技术', contact_phone: '13800138201', role: 'business', status: 'active' }
  ]

  const insertSubAccount = db.prepare(`
    INSERT OR REPLACE INTO supplier_sub_accounts
    (supplier_account_id, login_email, password, contact_person, contact_phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  count = 0
  for (const sub of subAccounts) {
    try {
      insertSubAccount.run(
        sub.supplier_account_id,
        sub.login_email,
        sub.password,
        sub.contact_person,
        sub.contact_phone,
        sub.role,
        sub.status
      )
      count++
    } catch (e) {
      console.log(`  Skip sub account ${sub.login_email}: ${e.message}`)
    }
  }
  console.log(`Inserted ${count} supplier sub accounts`)

  console.log('\nSupplier accounts initialization completed!')
}

initSupplierAccounts()
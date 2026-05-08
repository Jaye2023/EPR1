# 报价系统 (Meilin Quotation System)

## 1. 项目概述

**项目名称**: 报价系统
**项目类型**: Web应用系统
**核心功能**: 完整的报价管理系统，支持报价单创建、产品管理、Excel导入导出
**目标用户**: 美林公司的报价人员和管理人员

## 2. 技术栈

- **后端框架**: Node.js + Express
- **数据库**: SQLite (轻量级，易于部署)
- **ORM**: Sequelize
- **Excel处理**: xlsx (读), exceljs (写)
- **PDF生成**: PDFKit
- **前端**: HTML5 + Vanilla JS + Bootstrap 5

## 3. 功能需求

### 3.1 产品管理
- 产品列表展示（分页、搜索）
- 产品详情查看
- 产品新增/编辑/删除
- 从Excel模板导入产品
- 支持字段：
  - ITEM (产品编号)
  - 产品名称规格 (DESCRIPTION&SPECIFICATION)
  - 插头单价 (元/个)
  - 线材单价 (元/M)
  - 长度 (M)
  - 尾部处理
  - 扎线
  - 端子护套
  - 尾部连接线
  - 料号
  - 单位
  - 单价
  - 币种
  - 备注
  - 电线规格
  - 电线单价
  - 铜丝价
  - 胶料单价
  - 毛利

### 3.2 报价单管理
- 报价单列表展示（分页、搜索、筛选）
- 报价单详情查看
- 报价单新增/编辑/删除
- 报价单条款信息：
  - 报价日期
  - 付款方式 (月结60天)
  - 交货期限 (10-15工作天)
  - 品质要求 (ROHS、REACH、PAHS)
  - 增值税 (包含13%)
  - 货物交付 (包含运费至广东中山)
  - 报价有效期 (铜价100001-102000元/吨)
  - 客户签名栏
  - 报价人: 朱建云
  - 核准栏
- 报价单导出为Excel/PDF
- 报价单复制功能

### 3.3 导入/导出功能
- 从Excel模板导入产品数据
- 导出报价单为Excel格式（符合原模板格式）
- 导出报价单为PDF格式

## 4. 数据模型

### 4.1 Product (产品)
```javascript
{
  id: INTEGER PRIMARY KEY,
  item: STRING,              // 产品编号
  description: TEXT,         // 产品名称规格
  plugPrice: DECIMAL(10,2),  // 插头单价(元/个)
  cablePrice: DECIMAL(10,2), // 线材单价(元/M)
  length: DECIMAL(10,2),     // 长度(M)
  tailProcessing: STRING,    // 尾部处理
  cableTie: STRING,          // 扎线
  terminalSleeve: STRING,     // 端子护套
  tailWire: STRING,          // 尾部连接线
  processCard: STRING,       // 料号
  unit: STRING,              // 单位
  unitPrice: DECIMAL(10,4),  // 单价
  currency: STRING,          // 币种
  remarks: TEXT,             // 备注
  wireSpec: STRING,          // 电线规格
  wirePrice: DECIMAL(10,2),  // 电线单价
  copperPrice: DECIMAL(10,2),// 铜丝价
  materialPrice: DECIMAL(10,2), // 胶料单价
  profitMargin: DECIMAL(10,2),  // 毛利
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

### 4.2 Quote (报价单)
```javascript
{
  id: INTEGER PRIMARY KEY,
  quoteNumber: STRING UNIQUE, // 报价单号
  quoteDate: DATE,           // 报价日期
  paymentMethod: STRING,     // 付款方式
  deliveryTerm: STRING,      // 交货期限
  qualityRequirement: STRING, // 品质要求
  taxRate: DECIMAL(5,2),     // 税率
  shippingInfo: STRING,      // 货运信息
  validityTerm: STRING,      // 有效期条款
  customerName: STRING,      // 客户名称
  customerSignature: STRING, // 客户签名
  salesperson: STRING,       // 报价人
  approver: STRING,          // 核准人
  status: STRING,            // 状态: draft/confirmed/sent/expired
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

### 4.3 QuoteItem (报价单明细)
```javascript
{
  id: INTEGER PRIMARY KEY,
  quoteId: INTEGER,          // 关联报价单
  productId: INTEGER,        // 关联产品
  itemNumber: INTEGER,       // 项号
  description: TEXT,         // 产品描述
  plugPrice: DECIMAL(10,2),  // 插头单价
  cablePrice: DECIMAL(10,2), // 线材单价
  length: DECIMAL(10,2),     // 长度
  quantity: INTEGER,         // 数量
  unitPrice: DECIMAL(10,4),  // 单价
  totalPrice: DECIMAL(12,4), // 总价
  remarks: TEXT,             // 备注
  createdAt: DATETIME,
  updatedAt: DATETIME
}
```

## 5. API 接口

### 5.1 产品接口
- `GET /api/products` - 获取产品列表
- `GET /api/products/:id` - 获取产品详情
- `POST /api/products` - 创建产品
- `PUT /api/products/:id` - 更新产品
- `DELETE /api/products/:id` - 删除产品
- `POST /api/products/import` - 从Excel导入产品

### 5.2 报价单接口
- `GET /api/quotes` - 获取报价单列表
- `GET /api/quotes/:id` - 获取报价单详情
- `POST /api/quotes` - 创建报价单
- `PUT /api/quotes/:id` - 更新报价单
- `DELETE /api/quotes/:id` - 删除报价单
- `POST /api/quotes/:id/copy` - 复制报价单
- `GET /api/quotes/:id/export/excel` - 导出为Excel
- `GET /api/quotes/:id/export/pdf` - 导出为PDF

### 5.3 其他接口
- `GET /api/health` - 健康检查

## 6. 页面结构

### 6.1 页面列表
- `/` - 首页/仪表盘
- `/products` - 产品管理页面
- `/products/new` - 新增产品页面
- `/products/:id` - 产品详情页面
- `/products/:id/edit` - 编辑产品页面
- `/quotes` - 报价单列表页面
- `/quotes/new` - 新建报价单页面
- `/quotes/:id` - 报价单详情页面
- `/quotes/:id/edit` - 编辑报价单页面

## 7. 验收标准

### 7.1 功能验收
- [ ] 可以查看产品列表并进行分页
- [ ] 可以新增、编辑、删除产品
- [ ] 可以从Excel模板导入产品数据
- [ ] 可以创建报价单并添加产品
- [ ] 可以查看、编辑、删除报价单
- [ ] 可以复制已有报价单
- [ ] 可以导出报价单为Excel格式
- [ ] 可以导出报价单为PDF格式

### 7.2 数据验收
- [ ] 产品数据正确保存到数据库
- [ ] 报价单数据正确保存到数据库
- [ ] Excel导入的数据格式正确
- [ ] Excel导出的格式符合原模板

### 7.3 界面验收
- [ ] 界面美观，布局合理
- [ ] 操作流畅，用户体验良好
- [ ] 响应式设计，支持不同屏幕尺寸
- [ ] 中文界面，符合国内用户习惯

## 8. 项目结构

```
baojia-system/
├── app.js                 # Express应用入口
├── package.json          # 项目依赖
├── config/
│   └── database.js       # 数据库配置
├── models/
│   ├── index.js          # Sequelize初始化
│   ├── product.js        # 产品模型
│   ├── quote.js          # 报价单模型
│   └── quoteItem.js      # 报价单明细模型
├── routes/
│   ├── index.js          # 路由入口
│   ├── products.js       # 产品路由
│   └── quotes.js         # 报价单路由
├── controllers/
│   ├── productController.js
│   └── quoteController.js
├── services/
│   ├── productService.js
│   ├── quoteService.js
│   ├── excelService.js
│   └── pdfService.js
├── public/
│   ├── css/
│   ├── js/
│   └── html/
├── uploads/              # 上传文件目录
└── data/                 # SQLite数据库目录
```

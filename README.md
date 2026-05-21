# 报价系统 (Meilin Quotation System)

> 企业级报价管理解决方案，整合ERP与SRM系统

## 📋 项目概述

本系统是一套完整的企业级报价管理解决方案，包含三个核心子系统：

| 子系统 | 简称 | 功能定位 | 技术架构 |
|--------|------|----------|----------|
| 报价系统 | SQS | 核心报价管理，产品管理，报价单创建与导出 | Vue3 + Element Plus |
| 企业资源规划 | ERP | 订单、库存、财务、人力资源管理 | Vue3 + Element Plus |
| 供应商关系管理 | SRM | 供应商管理、采购、合同、绩效评估 | Vue3 + Element Plus |
| 统一数据服务 | Database | 统一API服务，SQLite数据库 | Node.js + Express |

## 🛠️ 技术栈

### 前端（共用的 Vue3 技术栈）
- **框架**: Vue.js 3 (Composition API)
- **构建工具**: Vite
- **UI组件库**: Element Plus
- **路由**: Vue Router 4
- **样式**: SCSS + Bootstrap 5

### 后端
- **框架**: Node.js + Express.js
- **数据库**: SQLite (轻量级，易于部署)
- **ORM**: Sequelize
- **Excel处理**: xlsx (读)、exceljs (写)
- **PDF生成**: PDFKit

## 📁 项目结构

```
d:\DY/
├── SQS/                         # 报价系统核心
│   └── vue/
│       └── src/
│           ├── api/              # API接口定义
│           ├── components/       # 公共组件
│           ├── layouts/         # 布局组件
│           ├── router/          # 路由配置
│           ├── stores/          # 状态管理
│           ├── styles/         # 样式文件
│           └── views/          # 页面视图
│               ├── Dashboard.vue      # 仪表盘
│               ├── Products.vue       # 产品管理
│               ├── Quotes.vue         # 报价单列表
│               ├── QuoteDetail.vue    # 报价单详情
│               ├── QuoteCreate.vue    # 新建报价单
│               ├── Customers.vue      # 客户管理
│               ├── WireSpecs.vue      # 电线规格
│               ├── Plugs.vue          # 插头规格
│               ├── TailProcessings.vue # 尾加工
│               └── Settings.vue       # 系统设置
│
├── ERP/                         # 企业资源规划系统
│   └── src/
│       ├── components/           # 公共组件
│       ├── router/              # 路由配置
│       ├── stores/              # 状态管理
│       ├── styles/              # 样式文件
│       └── views/               # 页面视图
│           ├── Dashboard.vue     # 仪表盘
│           ├── Alerts.vue       # 预警管理
│           ├── CopperPrice.vue   # 铜价管理
│           ├── Customers.vue     # 客户管理
│           ├── Finance.vue       # 财务管理
│           ├── HR.vue           # 人力资源
│           ├── Inventory.vue     # 库存管理
│           ├── Orders.vue       # 订单管理
│           ├── Prices.vue       # 价格管理
│           ├── Production.vue   # 生产管理
│           └── Settings.vue     # 系统设置
│
├── SRM/                         # 供应商关系管理系统
│   └── src/
│       ├── components/           # 公共组件
│       ├── db/                  # 数据库配置
│       ├── router/              # 路由配置
│       ├── stores/              # 状态管理
│       ├── styles/              # 样式文件
│       ├── utils/               # 工具函数
│       └── views/               # 页面视图
│           ├── Dashboard.vue     # 仪表盘
│           ├── Suppliers.vue     # 供应商管理
│           ├── Purchase.vue      # 采购管理
│           ├── Contracts.vue    # 合同管理
│           ├── Performance.vue   # 绩效评估
│           ├── AsnManagement.vue # ASN管理
│           ├── DeliveryAppointment.vue # 交货预约
│           ├── InTransitTracking.vue   # 在途跟踪
│           ├── LogisticsReport.vue     # 物流报表
│           ├── Reconciliation.vue       # 对账管理
│           ├── SupplierAccounts.vue    # 供应商账户
│           ├── SupplierOrders.vue       # 供应商订单
│           ├── SupplierProfile.vue     # 供应商档案
│           ├── SyncConfig.vue           # 同步配置
│           ├── SyncMonitor.vue         # 同步监控
│           ├── UserManagement.vue      # 用户管理
│           ├── RoleManagement.vue      # 角色管理
│           └── SystemManagement.vue     # 系统管理
│
├── database/                    # 统一数据服务
│   ├── api.js                  # 数据库API
│   ├── unified-api-server.js   # 统一API服务
│   ├── unified.db              # SQLite数据库
│   └── init-*.js               # 数据初始化脚本
│
├── .hintrc                     # Web Hint配置
├── SPEC.md                     # 系统规格说明书
├── 流程.md                     # 业务流程图
├── 统一命名.md                 # 命名规范文档
├── 启动全部服务.bat            # Windows一键启动脚本
└── 关闭全部服务.bat            # Windows一键关闭脚本
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x

### 启动服务

**方式一：一键启动（推荐）**

```bash
# Windows - 双击运行
启动全部服务.bat
```

**方式二：手动启动**

```bash
# 启动统一数据服务 (端口: 3000)
cd database
node unified-api-server.js

# 启动SQS前端 (端口: 5173)
cd SQS/vue
npm run dev

# 启动ERP (端口: 5174)
cd ERP
npm run dev

# 启动SRM (端口: 5175)
cd SRM
npm run dev
```

### 访问地址

| 系统 | 地址 | 说明 |
|------|------|------|
| SQS报价系统 | http://localhost:5173 | 产品、报价单、客户管理 |
| ERP系统 | http://localhost:5174 | 订单、库存、财务、生产 |
| SRM系统 | http://localhost:5175 | 供应商、采购、合同管理 |
| 数据库服务 | http://localhost:3000 | 统一API服务 |

## 🔧 功能特性

### SQS报价系统
- ✅ 仪表盘 - 系统概览与数据统计
- ✅ 产品管理 - 列表、详情、增删改查
- ✅ 报价单管理 - 列表、详情、创建、编辑、复制
- ✅ 报价单审核流程 - 草稿→待审核→已核准/已拒绝→发送→确认
- ✅ 报价单导出 - Excel/PDF导出
- ✅ 客户管理 - 客户信息维护
- ✅ 电线规格管理 - 电线规格参数配置
- ✅ 插头规格管理 - 插头规格参数配置
- ✅ 尾加工管理 - 尾加工工序配置

### ERP系统
- ✅ 仪表盘 - 企业运营概览
- ✅ 预警管理 - 系统预警信息
- ✅ 铜价管理 - 原材料价格跟踪
- ✅ 客户管理 - 客户信息维护
- ✅ 订单管理 - 销售订单处理
- ✅ 库存管理 - 库存查询与预警
- ✅ 财务管理 - 财务收支管理
- ✅ 价格管理 - 价格策略配置
- ✅ 生产管理 - 生产计划与跟踪
- ✅ 人力资源 - 员工与部门管理

### SRM系统
- ✅ 仪表盘 - 供应商管理概览
- ✅ 供应商管理 - 供应商档案维护
- ✅ 供应商注册 - 供应商自主注册
- ✅ 采购管理 - 采购订单处理
- ✅ 合同管理 - 合同模板与执行
- ✅ 绩效评估 - 供应商绩效评分
- ✅ ASN管理 - 发货通知管理
- ✅ 交货预约 - 交货时间安排
- ✅ 在途跟踪 - 物流状态跟踪
- ✅ 物流报表 - 物流数据分析
- ✅ 对账管理 - 供应商对账
- ✅ 同步配置 - 数据同步设置
- ✅ 同步监控 - 同步任务监控
- ✅ 用户管理 - 系统用户管理
- ✅ 角色管理 - 权限角色配置
- ✅ 系统管理 - 系统参数配置

## 🔌 API接口

### 认证接口
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/auth/me` | 获取当前用户 |
| POST | `/api/auth/logout` | 用户登出 |

### 产品接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/products` | 获取产品列表 |
| GET | `/api/products/:id` | 获取产品详情 |
| POST | `/api/products` | 创建产品 |
| PUT | `/api/products/:id` | 更新产品 |
| DELETE | `/api/products/:id` | 删除产品 |
| POST | `/api/products/import` | Excel导入 |
| POST | `/api/products/parse` | 描述解析 |
| POST | `/api/products/calculate-price` | 价格计算 |

### 报价单接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/quotes` | 获取报价单列表 |
| GET | `/api/quotes/:id` | 获取报价单详情 |
| GET | `/api/quotes/:id/items` | 获取报价明细 |
| POST | `/api/quotes` | 创建报价单 |
| PUT | `/api/quotes/:id` | 更新报价单 |
| DELETE | `/api/quotes/:id` | 删除报价单 |
| POST | `/api/quotes/:id/copy` | 复制报价单 |
| GET | `/api/quotes/next-number` | 获取下一编号 |

### 客户接口
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/customers` | 获取客户列表 |
| GET | `/api/customers/:id` | 获取客户详情 |
| POST | `/api/customers` | 创建客户 |
| PUT | `/api/customers/:id` | 更新客户 |
| DELETE | `/api/customers/:id` | 删除客户 |

## 📊 数据模型

### SQS核心表
- **Product** - 产品信息
- **Quote** - 报价单主表
- **QuoteItem** - 报价单明细
- **Customer** - 客户信息
- **WireSpec** - 电线规格
- **Plug** - 插头规格

### ERP核心表
- **Order** - 订单信息
- **Inventory** - 库存记录
- **Finance** - 财务记录
- **Production** - 生产计划
- **Employee** - 员工信息

### SRM核心表
- **Supplier** - 供应商信息
- **PurchaseOrder** - 采购订单
- **Contract** - 合同信息
- **Performance** - 绩效记录

## � 安全机制

- JWT Token 用户认证
- 会话管理
- 角色权限控制
- 数据访问审计

## 📄 许可证

MIT License

## 📧 联系方式

如有问题或建议，请联系开发团队。

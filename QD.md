cd d:\BAOJIA\baojia-system ; npm start
（变成了后端数据逻辑）

cd d:\BAOJIA\baojia-system\vue 
npm run dev
（前端）

cd d:\BAOJIA\baojia-system && npm restart 2>&1

cd d:\BAOJIA\baojia-system\vue ; npm install

netstat -ano | Select-String -Pattern "3000,5173,5174,5175"


页面页功能的实现：
    创建标签页 store 来管理打开的标签页
    修改 MainLayout.vue 添加标签页区域
    实现标签页的添加、关闭、切换功能
    使用 keep-alive 缓存页面状态


    node app.js

        
          
          
ERP系统和SRM系统已更新侧边栏导航，风格与报价系统统一：

**统一的侧边栏风格：**
- 深色渐变背景 (#1f2d3d → #2d3e50)
- 可折叠侧边栏（展开220px / 收起64px）
- 菜单项悬停高亮效果
- 激活菜单项带渐变背景
- 顶部header和用户信息区域

**各系统主题色区分：**
| 系统 | 主题渐变色 | 端口 |
|------|-----------|------|
| 报价系统 | 蓝→绿 (#409eff → #67c23a) | 5173 |
| ERP系统 | 紫 (#667eea → #764ba2) | 5174 |
| SRM系统 | 粉→红 (#f093fb → #f5576c) | 5175 |

**ERP系统功能模块：** 仪表盘、库存管理、订单管理、财务管理、人力资源

**SRM系统功能模块：** 仪表盘、供应商管理、采购订单、合同管理、绩效评估

三个系统均已热更新生效，可直接访问：
- 报价系统：http://192.168.18.182:5173/
- ERP系统：http://192.168.18.182:5174/
- SRM系统：http://192.168.18.182:5175/


toolName: run_command
            
status: running
          
command: cd d:\BAOJIA\baojia-system && node app.js undefined
          

        
            
toolName: run_command
            
status: running
          
command: cd d:\BAOJIA\baojia-system\vue && npm run dev undefined
          

        
            
toolName: run_command
            
status: running
          
command: cd d:\BAOJIA\erp-vue && npm run dev undefined
          
全部系统已启动！

## 运行状态

| 系统 | 地址 | 状态 |
|-----|------|------|
| 报价系统后端API | http://localhost:3000 | ✅ 运行中 |
| 报价系统前端 | http://192.168.18.182:5173 | ✅ 运行中 |
| ERP系统前端 | http://192.168.18.182:5174 | ✅ 运行中 |
| SRM系统前端 | http://192.168.18.182:5175 | ✅ 运行中 |

现在可以在浏览器中访问：

- **报价系统**: http://192.168.18.182:5173
- **ERP系统**: http://192.168.18.182:5174
- **SRM系统**: http://192.168.18.182:5175

ERP系统新增订单时输入报价系统的物料编号（如 `0010002`）应该可以自动匹配了！
# Ticklo

Ticklo 是一个基于 Electron + Vue 3 的桌面应用，提供「打卡」与「待办事项」两大核心能力，目标是轻量、直观、离线可用。

## 项目定位

- 面向桌面端的个人打卡工具
- 通过本地数据库保存打卡历史与待办数据
- 提供“连续打卡”反馈，帮助维持习惯
- 采用多进程架构保证渲染层与系统能力隔离

## 核心功能

- 当日打卡/取消打卡（toggle）
- 连续打卡/最大连续打卡统计（写入用户表字段）
- 打卡日历可视化展示
- 今日待办事项：新增、勾选归档（归档确认弹窗）
- 首页概览统计：待办数量、今日已完成数量、完成率、最大连续打卡
- 个人资料编辑：头像、姓名、金句、性别、爱好
- 语录卡片展示（支持从接口获取）
- 自定义标题栏窗口控制（最小化/最大化/关闭）
- 主题切换：浅色 / 深色 / 毛玻璃

## 项目架构

本项目采用 Electron 典型三层结构：

### 1) Main（主进程）

- 入口：`src/main/index.js`
- IPC 拆分：`src/main/ipc/*`
- 职责：
  - 创建和管理窗口生命周期
  - 注册 IPC 事件与请求（用户/待办/打卡/应用信息等）
  - 读写 SQLite 数据库（better-sqlite3）
  - 请求外部语录 API 并返回给渲染层（带降级兜底）

### 2) Preload（预加载层）

- 路径：`src/preload/index.js`
- 职责：
  - 使用 `contextBridge` 向渲染层暴露受控 API（`window.api`）
  - 将窗口控制、打卡/待办/用户资料、统计数据等能力桥接给前端

### 3) Renderer（渲染进程）

- 路径：`src/renderer/src`
- 职责：
  - 基于 Vue 3 实现界面与交互
  - 通过 `window.api` 调用主进程能力
  - 管理页面状态（当前视图、主题、打卡展示、待办列表）

## 关键目录结构

```text
Ticklo
├─ src
│  ├─ main                 # 主进程入口与 IPC 处理
│  │  └─ ipc                # IPC 模块拆分（user/todo/checkin/app/window）
│  ├─ preload              # 预加载桥接层
│  └─ renderer
│     ├─ index.html        # 渲染进程 HTML 入口
│     └─ src
│        ├─ components     # Vue 组件（Home/Sidebar/TitleBar 等）
│        ├─ assets         # 样式资源
│        ├─ App.vue        # 根组件
│        └─ main.js        # Vue 启动入口
├─ electron.vite.config.mjs
├─ electron-builder.yml
└─ package.json
```

## 数据与通信

- 数据库：SQLite（better-sqlite3）
  - 表：`users`、`todos`、`completed_todos`、`check_ins`
  - 已完成事项清理：应用启动时自动清理非今日数据（`completed_todos`）
- 数据库存放位置：
  - 开发环境：`<项目根目录>/data/ticklo.db`
  - 打包后：`<安装目录>/data/ticklo.db`
- 通信方式：Renderer → Preload → Main（IPC）

## 技术栈

- 桌面框架：Electron
- 前端框架：Vue 3
- 构建工具：electron-vite + Vite
- 打包工具：electron-builder
- 代码规范：ESLint + Prettier
- 运行语言：JavaScript
- 数据存储：better-sqlite3（SQLite）

## 开发环境

- Node.js 18+（建议使用 LTS）
- npm 9+

## 安装与运行

### 1) 安装依赖

```bash
npm install
```

### 2) 启动开发模式

```bash
npm run dev
```

### 3) 代码检查与格式化

```bash
npm run lint
npm run format
```

### 4) 构建与打包

```bash
# 构建主进程 / 预加载 / 渲染进程
npm run build

# Windows 安装包
npm run build:win

# 仅输出解包目录
npm run build:unpack
```

### 5) 预览已构建应用

```bash
npm run start
```

## 当前状态

- `home`：用户信息卡片、概览统计、打卡日历、语录
- `todos`：待办事项新增、勾选归档（自定义确认弹窗）
- `settings`：个人资料编辑、主题切换、关于弹窗

## Windows 打包说明

- 配置文件：`electron-builder.yml`
- 产物目录：`dist/`
- 安装包：`dist/ticklo-<version>-setup.exe`
- NSIS 安装包已开启“选择安装目录”（`oneClick: false`，`allowToChangeInstallationDirectory: true`）
- 应用图标使用 `resources/icon.png`（Windows 也可使用 `.ico`，建议包含 256x256 以避免构建报错）

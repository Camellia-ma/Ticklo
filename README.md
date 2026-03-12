# Ticklo

Ticklo 是一个基于 Electron + Vue 3 的桌面打卡应用，目标是提供轻量、直观的每日打卡体验。  
当前版本已支持打卡记录、本地持久化、连续打卡统计、语录展示和窗口控制等核心能力。

## 项目定位

- 面向桌面端的个人打卡工具
- 通过本地存储保存打卡历史
- 提供“连续打卡”反馈，帮助维持习惯
- 采用多进程架构保证渲染层与系统能力隔离

## 核心功能

- 当日打卡/取消打卡（toggle）
- 连续打卡天数自动计算
- 打卡日历可视化展示
- 首页语录自动拉取与定时刷新
- 自定义标题栏窗口控制（最小化/最大化/关闭）
- 浅色/深色主题切换

## 项目架构

本项目采用 Electron 典型三层结构：

### 1) Main（主进程）

- 路径：`src/main/index.js`
- 职责：
  - 创建和管理窗口生命周期
  - 处理 IPC 事件与请求
  - 访问本地文件系统持久化打卡数据
  - 请求外部语录 API 并返回给渲染层

### 2) Preload（预加载层）

- 路径：`src/preload/index.js`
- 职责：
  - 使用 `contextBridge` 向渲染层暴露受控 API（`window.api`）
  - 将窗口控制、打卡读写、语录请求等能力桥接给前端

### 3) Renderer（渲染进程）

- 路径：`src/renderer/src`
- 职责：
  - 基于 Vue 3 实现界面与交互
  - 通过 `window.api` 调用主进程能力
  - 管理页面状态（当前视图、主题、打卡展示）

## 关键目录结构

```text
Ticklo
├─ src
│  ├─ main                 # 主进程入口与 IPC 处理
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

- 打卡数据文件：`app.getPath('userData')/check_in_data.json`
- 通信方式：Renderer -> Preload -> Main（IPC）

## 技术栈

- 桌面框架：Electron
- 前端框架：Vue 3
- 构建工具：electron-vite + Vite
- 打包工具：electron-builder
- 代码规范：ESLint + Prettier
- 运行语言：JavaScript

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

- `home` 页面已完成主要功能
- `search`、`settings` 视图仍为占位（开发中）

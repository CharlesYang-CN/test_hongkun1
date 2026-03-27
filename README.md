# Quiz Builder App

一个基于 React 18 + TypeScript + Vite 的测验管理应用，支持 API 导入、自定义创建、答题、结算回顾，以及断点续答和历史结果查看。

## 技术栈

- 前端框架: React 18 + TypeScript + Vite
- 样式方案: Tailwind CSS
- 图标库: Lucide React
- 路由: React Router v6
- 状态管理: Zustand + persist (LocalStorage)
- API: Open Trivia Database

## 环境配置

### 1. Node 与 npm

- 推荐 Node 18 或更高版本
- 推荐 npm 9 或更高版本

检查版本:

```bash
node -v
npm -v
```

### 2. 镜像源配置 (中国大陆建议)

为了提高依赖安装速度，建议使用清华镜像:

```bash
npm config set registry https://mirrors.tuna.tsinghua.edu.cn/npm/
npm config get registry
```

### 3. 安装依赖

在项目根目录执行:

```bash
npm install
```

## 主要功能

### 1. Quiz 管理

- 首页展示全部测验列表
- 区分来源标签: API 或 CUSTOM
- 支持删除测验
- 支持 Play 和 Continue

### 2. API 导入向导

- 三步导入流程: 条件选择 -> 加载/错误 -> 预览保存
- 支持分类、难度、题型、数量筛选
- 自动解码 base64 题目内容
- 自动处理 Open Trivia response_code 常见异常
- 接入 Session Token，减少重复题
- 支持导入前可用题量估算与前置校验

### 3. 自定义测验创建

- 支持设置测验标题与描述
- 支持动态添加/删除题目
- 按题型动态渲染输入项:
  - multiple: 正确答案 + 多个错误答案
  - boolean: True/False
  - short-answer: 简答题

### 4. 答题与结算

- 显示答题进度 (Question x of y)
- 支持上一题/下一题/提交
- 提交后计算总分与正确率
- 简答题按 trim + lowercase 容错比对

### 5. 回顾与复盘

- 展示每题用户答案与正确答案
- 使用颜色和图标显示对错
- 支持筛选: All / Incorrect / Unanswered
- 支持从结果页跳回指定题目重做
- 支持多次作答历史切换回看

### 6. 持久化能力

- 测验数据持久化
- 最近结果与历史结果持久化
- 进行中会话持久化 (刷新后可继续)

## 如何使用

### 1. 启动开发环境

```bash
npm run dev
```

打开终端输出的本地地址 (默认一般为 http://localhost:5173)

### 2. 使用流程建议

1. 在首页点击 Import from API 或 Create custom quiz
2. 保存测验后返回首页，从卡片点击 Play
3. 作答并提交，进入 Result 页面查看分数和答案回顾
4. 如中途离开，可在首页点击 Continue 恢复作答

### 3. 构建生产包

```bash
npm run build
```

### 4. 本地预览生产包

```bash
npm run preview
```

## 路由说明

- /: 首页 Dashboard
- /import: API 导入向导
- /create: 自定义测验创建
- /play/:quizId: 答题页
- /result: 结果页

## 目录概览

- src/pages: 页面级组件
- src/components: 可复用组件
- src/store: Zustand 全局状态
- src/services: API 服务层
- src/types: TypeScript 类型定义
- src/utils: 通用工具函数

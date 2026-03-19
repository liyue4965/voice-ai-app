# 工业仿真数字孪生编辑器 - 技术规格书

## 1. 项目概述

**项目名称**: Industrial Digital Twin Editor (IDTE)
**项目类型**: Web端3D可视化编辑器
**核心功能**: 工业场景数字孪生构建、3D编辑、数据绑定、实时渲染、可导出部署
**目标用户**: 工业仿真工程师、智慧工厂运维人员

## 2. 技术栈

- **3D引擎**: Three.js (r158+)
- **前端框架**: React 18 + TypeScript 5
- **状态管理**: Zustand
- **3D编辑器框架**: 基于Three.js自研（类似Three-Editor）
- **AI生图**: Stable Diffusion API / 兼容API（如ComfyUI）
- **打包工具**: Vite 5
- **样式**: CSS Modules + CSS Variables

## 3. 核心功能模块

### 3.1 3D场景编辑器
- [ ] 场景层级管理（树形结构）
- [ ] 模型导入（GLTF/GLB/OBJ/STL）
- [ ] 基础变换操作（移动/旋转/缩放）
- [ ] 几何体创建（立方体/球体/圆柱体等）
- [ ] 材质/纹理编辑
- [ ] 光照系统（环境光/方向光/点光源）
- [ ] 相机控制（轨道/平移/缩放）
- [ ] 辅助工具（网格/坐标轴/包围盒）

### 3.2 数据绑定系统
- [ ] 数据源管理（REST API/WebSocket/MQTT）
- [ ] 变量绑定界面
- [ ] 表达式解析（支持数学运算）
- [ ] 数据映射到3D属性（位置/颜色/透明度/可见性）
- [ ] 实时数据更新

### 3.3 实时渲染
- [ ] PBR材质渲染
- [ ] 阴影映射
- [ ] 后期处理（Bloom/SSAO/抗锯齿）
- [ ] 性能监控面板
- [ ] LOD支持

### 3.4 AI设计图转3D
- [ ] 图片上传/粘贴
- [ ] 调用SD API生成场景图
- [ ] 图生3D（Mesh提取）
- [ ] 智能布局建议

### 3.5 导出系统
- [ ] 导出为独立HTML文件
- [ ] 导出为可部署Web包
- [ ] 模板化项目导出
- [ ] 配置项导出（JSON）

## 4. 项目结构

```
industrial-digital-twin/
├── src/
│   ├── components/        # React组件
│   │   ├── Editor/        # 编辑器界面
│   │   ├── Viewport/      # 3D视口
│   │   ├── Sidebar/       # 侧边栏（属性/层级）
│   │   ├── Toolbar/       # 工具栏
│   │   └── DataPanel/     # 数据绑定面板
│   ├── core/              # 核心3D引擎
│   │   ├── Scene.ts       # 场景管理
│   │   ├── Selection.ts   # 选择系统
│   │   ├── Transform.ts   # 变换控制
│   │   ├── Materials.ts   # 材质系统
│   │   └── Export.ts      # 导出引擎
│   ├── services/          # 服务层
│   │   ├── DataService.ts # 数据绑定服务
│   │   ├── AIGenerator.ts # AI生成服务
│   │   └── Storage.ts     # 本地存储
│   ├── stores/            # Zustand状态
│   │   ├── sceneStore.ts  # 场景状态
│   │   ├── editorStore.ts # 编辑器状态
│   │   └── dataStore.ts   # 数据状态
│   ├── types/             # TypeScript类型
│   └── utils/             # 工具函数
├── public/
│   └── templates/         # 导出模板
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 5. 开发计划

### Phase 1: 基础框架（1-2周）
- [ ] 项目初始化
- [ ] 3D视口搭建
- [ ] 基础物体创建
- [ ] 变换控制器

### Phase 2: 编辑器核心（2-3周）
- [ ] 层级管理器
- [ ] 属性面板
- [ ] 材质编辑
- [ ] 场景保存/加载

### Phase 3: 数据绑定（2周）
- [ ] 数据源接入
- [ ] 变量绑定UI
- [ ] 实时更新机制

### Phase 4: AI功能（2周）
- [ ] 图片上传
- [ ] SD API集成
- [ ] 3D生成pipeline

### Phase 5: 导出与优化（1周）
- [ ] 导出功能
- [ ] 性能优化
- [ ] Bug修复

## 6. 验收标准

1. 能够创建、编辑、保存3D工业场景
2. 支持模型导入和数据绑定
3. 能够导出为可运行的Web应用
4. AI功能能够根据图片生成基础3D场景
5. 页面加载时间 < 3s，运行时帧率 > 30fps

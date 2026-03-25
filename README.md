# VoiceAI 语音转文字 App

🎙️ 一款简洁高效的语音转文字应用，支持实时录音和语音识别。

## 功能特点

- 🎤 **实时录音** - 点击开始，再次点击停止
- 📝 **语音转文字** - 录音完成后自动识别为文字
- 📊 **波纹动画** - 录音时显示炫酷的波纹动画效果
- 📋 **一键复制** - 快速复制识别结果
- 📜 **历史记录** - 保存每次录音和识别结果
- 🎨 **深色主题** - 科技感深色UI设计

## 界面预览

```
┌─────────────────────────────────┐
│  ← 语音转文字              👤   │
├─────────────────────────────────┤
│                                 │
│      🔴 录音按钮（带波纹动画）  │
│         ⏱ 00:00:00             │
│       "点击开始录音"           │
│                                 │
├─────────────────────────────────┤
│   🏠       🎙️        👤        │
│   首页     录音       我的      │
└─────────────────────────────────┘
```

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **录音**: expo-av
- **导航**: @react-navigation/bottom-tabs
- **图标**: @expo/vector-icons (Ionicons)

## 运行项目

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/liyue4965/voice-ai-app.git
cd voice-ai-app

# 2. 安装依赖
npm install

# 3. 启动项目
npx expo start
```

### 运行平台

```bash
# Android
npx expo start --android

# iOS
npx expo start --ios

# Web
npx expo start --web
```

### 构建 APK

```bash
# Android
eas build -p android --profile development
```

## 项目结构

```
voice-ai-app/
├── App.tsx           # 主应用代码
├── app.json          # Expo 配置
├── package.json      # 依赖配置
├── index.js          # 入口文件
└── SPEC.md           # 设计规范
```

## 后续规划

- [ ] 接入真实语音识别API（讯飞/阿里云/百度）
- [ ] 支持多语言识别
- [ ] 音频文件上传转写
- [ ] 导出为PDF/TXT
- [ ] 微信小程序版本

## 许可证

MIT License

## 联系方式

如有问题，欢迎提交 Issue 或 Pull Request。
# VoiceAI 语音转文字 App

🎙️ 一款简洁高效的语音转文字应用，支持实时录音和语音识别。

## 功能特点

### ✅ 已完成
- 🎤 **实时录音** - 点击开始，再次点击停止
- 📝 **语音转文字** - 录音完成后自动识别为文字
- 📊 **波纹动画** - 录音时显示炫酷的波纹动画效果
- 📋 **一键复制** - 快速复制识别结果
- 🌐 **多语言识别** - 支持中文、英语、日语、韩语、法语、德语
- 📁 **音频文件上传** - 支持上传音频/视频文件转写
- 📜 **历史记录** - 保存每次录音和识别结果
- 🎨 **深色主题** - 科技感深色UI设计
- 📤 **导出分享** - 支持复制和分享识别结果

### 🔄 开发中
- [ ] 接入真实语音识别API（讯飞/阿里云/百度）
- [ ] 导出为PDF/TXT
- [ ] 微信小程序版本

## 界面预览

```
┌─────────────────────────────────┐
│  ← 语音转文字              👤   │
├─────────────────────────────────┤
│  识别语言：[中文] [英语] [日语] │
├─────────────────────────────────┤
│  [📁 音频转文字]  [🎬 视频转文字]│
│  [🌐 语音翻译]   [🎵 音频变速] │
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
- **文件选择**: expo-document-picker
- **文件系统**: expo-file-system
- **导航**: @react-navigation/bottom-tabs
- **图标**: @expo/vector-icons (Ionicons)

## 运行项目

### 前置要求

- Node.js 18+
- npm 或 yarn
- Expo CLI

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
├── App.tsx           # 主应用代码（所有页面）
├── app.json          # Expo 配置
├── package.json      # 依赖配置
├── index.js          # 入口文件
├── README.md         # 说明文档
└── SPEC.md           # 设计规范
```

## 页面说明

1. **首页** - 语言选择 + 功能卡片 + 录音入口 + 识别结果
2. **录音页** - 大圆形录音按钮 + 计时器
3. **我的页** - 用户信息 + 历史记录 + 设置

## API 接入说明

项目目前使用模拟数据进行语音识别。要接入真实API，需要：

### 讯飞语音识别
```javascript
// 安装讯飞SDK
npm install iff-asr

// 在 recognizeSpeech 函数中调用
const result = await iflytek.asr(audioFile);
```

### 阿里云语音识别
```javascript
// 安装阿里云SDK
npm install @alicloud/nls-filetrans

// 调用API
const result = await nls.transcribe(filePath);
```

### 百度语音识别
```javascript
// 安装百度SDK
npm install baidu-aip

// 调用API
const result = await client.asr(audioData, 'wav', 16000);
```

### OpenAI Whisper API
```javascript
// 直接调用 Whisper API
const formData = new FormData();
formData.append('file', audioFile);
formData.append('model', 'whisper-1');

const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${API_KEY}` },
  body: formData
});
```

## 后续规划

- [ ] 接入真实语音识别API（讯飞/阿里云/百度）
- [ ] 导出为PDF/TXT
- [ ] 微信小程序版本

## 许可证

MIT License

## 联系方式

如有问题，欢迎提交 Issue 或 Pull Request。
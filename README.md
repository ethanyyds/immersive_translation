# 沉浸式翻译插件（克隆版）

一个功能完整的浏览器翻译插件，采用前后端分离架构，支持网页内容的实时翻译。

## ✨ 特性

- 🌐 **智能翻译**：基于腾讯云翻译服务，提供高质量翻译
- 🎯 **沉浸式体验**：在原文下方直接显示译文，保持页面布局
- 🔒 **安全设计**：API 密钥安全存储在后端，用户无需配置
- 🚀 **一键翻译**：简洁的用户界面，点击即可翻译整个页面
- 🔄 **防重复翻译**：智能识别已翻译内容，避免重复处理
- 🏗️ **前后端分离**：插件前端 + Python 后端服务
- 📚 **更多元素**：除了段落，还支持标题、列表等常见文本元素的翻译
- 📝 **列表友好**：译文直接插入列表项内部，保持 HTML 结构

## 📁 项目结构

```
immersive_translation/
├── plugin/                 # 浏览器插件前端
│   ├── manifest.json      # 插件配置文件
│   ├── popup.html         # 弹窗界面
│   ├── popup.js           # 弹窗逻辑
│   ├── content.js         # 内容脚本（页面注入）
│   └── background.js      # 后台脚本（API通信）
├── server/                 # Python 后端服务
│   ├── app.py             # Flask 服务器主文件
│   ├── requirements.txt   # Python 依赖
│   ├── .env.example       # 环境变量模板
│   └── .gitignore         # Git 忽略文件
└── README.md              # 项目说明
```

## 🛠️ 技术栈

### 前端（浏览器插件）
- **Manifest V3**：Chrome 扩展最新规范
- **JavaScript**：原生 JS，无框架依赖
- **Chrome Extension APIs**：标签页操作、消息传递、存储等

### 后端（翻译服务）
- **Python 3.13+**：主要编程语言
- **Flask**：轻量级 Web 框架
- **腾讯云 SDK**：官方翻译服务接口
- **Flask-CORS**：跨域请求支持

## 🚀 快速开始

### 前置要求

1. **Python 3.13+**
2. **Chrome 浏览器**
3. **腾讯云账号**（需要开通文本翻译服务）

### 1. 克隆项目

```bash
git clone https://github.com/ethanyyds/immersive_translation.git
cd immersive_translation
```

### 2. 配置后端服务

#### 创建虚拟环境
```bash
cd server
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# 或 venv\Scripts\activate  # Windows
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

#### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的腾讯云密钥
# TENCENTCLOUD_SECRET_ID="你的SecretId"
# TENCENTCLOUD_SECRET_KEY="你的SecretKey"
```

#### 启动服务器
```bash
python3 app.py
```

服务器将在 `http://127.0.0.1:8000` 启动。

### 3. 安装浏览器插件

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目中的 `plugin` 目录
6. 插件安装完成！

### 4. 使用插件

1. 访问任意英文网页
2. 点击浏览器工具栏中的插件图标
3. 点击"翻译当前页面"按钮
4. 等待翻译完成，译文将显示在原文下方

## 🔧 开发指南

### API 接口

后端服务提供以下接口：

#### POST /translate
翻译文本接口

**请求体：**
```json
{
  "text": "Hello, world!"
}
```

**响应：**
```json
{
  "translatedText": "你好，世界！"
}
```

### 插件通信流程

1. **用户点击翻译按钮** → `popup.js`
2. **发送翻译指令** → `content.js`
3. **提取页面文本** → `content.js`
4. **请求翻译服务** → `background.js`
5. **调用后端API** → `server/app.py`
6. **返回翻译结果** → `content.js`
7. **注入译文到页面** → 用户看到翻译

## 🔐 安全说明

- ✅ API 密钥安全存储在后端服务器
- ✅ 插件前端不包含任何敏感信息
- ✅ 使用环境变量管理配置
- ✅ `.env` 文件已加入 `.gitignore`

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题，请通过 GitHub Issues 联系。

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

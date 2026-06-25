# AI 聊天群

一个支持多 AI 角色协作讨论的群聊应用。群内仅有一个真实人类用户，其余均为 AI 角色，围绕用户设定的核心话题展开讨论。

## 功能特性

### 核心聊天
- **话题驱动**：开始前设定核心话题（如开发软件、调研报告、数据分析等）
- **AI 自主交流**：多个 AI 角色根据话题自行理解和反馈，模拟真实群聊氛围
- **渐进式讨论**：系统根据讨论进度自动引导 AI 从初步看法 → 深入探讨 → 整合总结，层层递进
- **人类随时参与**：用户可随时发送消息加入讨论，AI 会针对用户发言进行回应

### AI 模型接入
- **多提供商支持**：OpenAI、Anthropic、Google、DeepSeek、通义千问、Moonshot、智谱 AI、百度文心一言
- **API Key 管理**：每个提供商独立配置密钥和接口地址，支持自定义 Base URL（兼容代理/中转）
- **模型多选**：勾选需要的模型，未配置 Key 的模型自动禁止勾选
- **角色绑定模型**：每个 AI 角色可独立选择不同的模型

### AI 配置
- **角色选择**：至少选择 2 个、最多 5 个 AI 参与群聊
- **角色描述**：为每个 AI 设置个性化角色和专长描述
- **Skill 配置**：为 AI 配置代码审查、数据分析、文档编写、头脑风暴、翻译、搜索等技能

### 用户与数据
- **用户系统**：注册/登录、个人中心、昵称编辑
- **会话隔离**：每个用户的历史会话独立存储，互不干扰
- **服务端持久化**：所有数据通过 Express 后端保存到服务器 JSON 文件，刷新/换浏览器不丢失
- **一键总结**：AI 根据聊天记录自动提炼重要信息和次要信息
- **历史记录**：查看过往所有会话，支持重新进入和生成总结

### 设置管理
- **群活跃时间段**：设置 AI 参与群聊的时间段
- **AI 视听能力**：单独开关图片理解、表情包回复、语音回复、视频分享
- **聊天时长限制**：设定自动终止时间

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS |
| 构建工具 | Vite |
| 图标库 | Lucide React |
| 后端服务 | Express 4 |
| 数据存储 | JSON 文件（服务端）+ localStorage（前端缓存/降级） |

## 快速开始

### 环境要求
- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
cd ai-chat-group
npm install
```

### 启动服务

```bash
npm run dev
```

该命令会同时启动：
- **后端 API 服务**：`http://localhost:3001`
- **前端开发服务**：`http://localhost:5173`

前端通过 Vite 代理将 `/api` 请求转发到后端。

### 分别启动

```bash
npm run dev:server   # 仅启动后端
npm run dev:client   # 仅启动前端
```

### 生产部署

```bash
npm run build        # 构建前端
npm run start        # 启动后端服务
```

构建产物输出到 `dist/` 目录，可部署到任意静态文件服务器。后端服务需单独运行。

## 项目结构

```
ai-chat-group/
├── server/
│   ├── index.js           # Express 后端服务（API + JSON 文件存储）
│   └── data/              # 持久化数据目录
│       ├── users.json     # 用户数据
│       ├── sessions.json # 会话数据
│       ├── settings.json # 全局设置
│       └── passwords.json # 密码存储
├── src/
│   ├── api/
│   │   └── client.ts      # 前端 API 客户端
│   ├── components/
│   │   ├── Home.tsx         # 首页
│   │   ├── ChatRoom.tsx     # 聊天室
│   │   ├── Settings.tsx     # 设置
│   │   ├── AgentConfig.tsx  # AI 配置
│   │   ├── History.tsx      # 历史记录
│   │   ├── Login.tsx        # 登录/注册
│   │   └── Profile.tsx      # 个人中心
│   ├── store/
│   │   └── useStore.ts      # Zustand 状态管理
│   ├── types/
│   │   └── index.ts         # TypeScript 类型定义
│   ├── utils/
│   │   ├── storage.ts       # 本地存储（缓存/降级）
│   │   └── aiService.ts     # AI API 调用服务
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 使用说明

1. **注册账号**：首次使用请先注册，设置用户名和密码
2. **配置 API Key**：进入「设置」→「API Key 配置」，填写至少一个 AI 提供商的密钥
3. **启用模型**：在「设置」→「模型管理」中勾选要使用的模型
4. **配置 AI 角色**：进入「AI 配置」，选择至少 2 个 AI 角色，为每个角色绑定模型
5. **新建聊天**：在首页点击「新建聊天」，输入核心话题后开始讨论
6. **参与讨论**：AI 们会围绕话题自主交流并层层深入，用户可随时发送消息
7. **一键总结**：点击「一键总结」按钮，AI 根据聊天记录提炼重要信息
8. **终止聊天**：点击「终止聊天」按钮结束会话，数据自动持久化到服务器

## 后端 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| GET | `/api/sessions/:userId` | 获取用户会话列表 |
| POST | `/api/sessions` | 创建会话 |
| PUT | `/api/sessions/:id` | 更新会话 |
| DELETE | `/api/sessions/:id` | 删除会话 |
| GET | `/api/settings` | 获取全局设置 |
| PUT | `/api/settings` | 更新全局设置 |
| GET | `/api/agents` | 获取 AI 角色配置 |
| PUT | `/api/agents` | 更新 AI 角色配置 |

## 数据持久化机制

数据采用**双层存储**策略：

- **服务端（主存储）**：Express 后端将数据保存到 `server/data/` 目录下的 JSON 文件，重启服务不丢失
- **前端（缓存/降级）**：localStorage 作为本地缓存，启动时从服务端同步。服务端不可用时自动降级到本地存储

## 默认 AI 角色

| 名称 | 角色 | 默认模型 | 描述 |
|------|------|----------|------|
| 小智 | 产品经理 | GPT-4o | 擅长需求分析和产品设计 |
| 小码 | 开发工程师 | GPT-4o | 全栈开发专家 |
| 小设 | UI 设计师 | Claude Sonnet 4 | 专注于用户体验和视觉设计 |
| 小数 | 数据分析师 | Gemini 2.5 Pro | 数据洞察和可视化专家 |
| 小测 | 测试工程师 | GPT-4o Mini | 质量保证和自动化测试 |

## License

MIT

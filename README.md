# Chatwoot AI Webhook v2.0

一个功能强大的Chatwoot智能客服与AI服务集成系统，支持多种AI提供商、完整的事件处理和实时监控。

## ✨ 主要特性

- 🤖 **多AI提供商支持**: OpenAI、Azure OpenAI、智谱AI、百度文心一言、通义千问
- 📊 **完整事件处理**: 支持所有Chatwoot webhook事件类型
- 📈 **实时监控**: 内置日志系统和性能监控
- 🔄 **智能重试**: 自动重试机制和错误恢复
- 🎯 **类型安全**: 完整的TypeScript类型定义
- 🚀 **高性能**: 优化的响应时间和资源使用

## 🚀 快速开始

### 1. 环境变量配置

创建 `.env.local` 文件并配置以下环境变量：

\`\`\`bash
# 必需配置
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_TOKEN=sk-your-api-token-here

# AI提供商配置 (可选，系统会自动检测)
AI_PROVIDER=openai  # openai, azure, zhipu, baidu, qwen

# AI模型配置 (可选)
AI_MODEL=gpt-3.5-turbo
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.7

# 系统提示词 (可选)
AI_SYSTEM_PROMPT=你是一个专业的客服助手，请用友好、专业的语气回答用户问题。

# Chatwoot配置 - 用于发送AI回复到聊天界面
CHATWOOT_URL=https://your-chatwoot-instance.com
CHATWOOT_BOT_TOKEN=your-bot-access-token
\`\`\`

### 2. 启动服务

\`\`\`bash
npm install
npm run dev
\`\`\`

### 3. 配置Chatwoot

#### 步骤1：创建Bot用户（用于发送AI回复）
1. 在Chatwoot管理后台进入 Settings → Agents
2. 点击 "Add Agent" 创建一个新的代理用户
3. 设置用户名为 "AI Assistant" 或类似名称
4. 记录该用户的邮箱，稍后需要用到

#### 步骤2：获取Bot Access Token
1. 进入 Settings → Integrations → API
2. 点击 "Add API Key"
3. 选择刚创建的Bot用户
4. 复制生成的Access Token，这就是 `CHATWOOT_BOT_TOKEN`

#### 步骤3：配置Webhook
1. 进入 Settings → Integrations → Webhooks
2. 点击 "Add new webhook"
3. 输入webhook URL：`https://your-domain.com/api/webhook/chatwoot`
4. 选择触发事件："Message Created"
5. 保存配置

## 📋 支持的AI接口

本系统支持兼容OpenAI API格式的AI服务：

- OpenAI GPT系列
- Azure OpenAI
- 国内AI服务商（如智谱AI、百度文心等）
- 自部署的兼容接口

## 🔧 API端点

- `POST /api/webhook/chatwoot` - 接收Chatwoot消息
- `GET /api/health` - 健康检查

## 🛡️ 安全说明

- 所有敏感配置通过环境变量管理
- 支持HTTPS部署
- 自动过滤非用户消息
- 错误信息不暴露敏感数据

## 📝 消息格式

### Chatwoot发送格式：
\`\`\`json
{
  "message_type": "incoming",
  "content": "用户消息内容",
  "conversation": { "id": "会话ID" },
  "sender": { "name": "用户名" }
}
\`\`\`

### 返回格式：
\`\`\`json
{
  "success": true,
  "message": "AI回复内容",
  "conversation_id": "会话ID",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## 🔍 故障排除

1. **AI接口连接失败**
   - 检查 `AI_API_URL` 是否正确
   - 验证 `AI_API_TOKEN` 是否有效
   - 确认网络连接正常

2. **Chatwoot无响应**
   - 检查webhook URL配置
   - 验证触发事件设置
   - 查看服务器日志

3. **环境变量未生效**
   - 确认 `.env.local` 文件位置正确
   - 重启开发服务器
   - 检查变量名拼写

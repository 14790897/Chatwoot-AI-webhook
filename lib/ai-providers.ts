// AI Service Providers Configuration
import { AIConfig, AIResponse } from "@/types/chatwoot";
import { logger } from "@/lib/logger";

export interface AIProvider {
  name: string;
  baseUrl: string;
  defaultModel: string;
  supportedModels: string[];
  formatRequest: (message: string, config: AIConfig) => any;
  parseResponse: (response: any) => string;
  headers: (token: string) => Record<string, string>;
}

// OpenAI Compatible Provider
export const openaiProvider: AIProvider = {
  name: "OpenAI",
  baseUrl: "https://api.openai.com/v1/chat/completions",
  defaultModel: "gpt-3.5-turbo",
  supportedModels: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"],
  formatRequest: (message: string, config: AIConfig) => ({
    model: process.env.AI_MODEL || "gpt-3.5-turbo",
    messages: [
      { role: "system", content: config.systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  }),
  parseResponse: (data: any) => 
    data.choices?.[0]?.message?.content || 
    data.response || 
    data.text || 
    data.content,
  headers: (token: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "User-Agent": "Chatwoot-AI-Webhook/2.0",
  }),
};

// Azure OpenAI Provider
export const azureProvider: AIProvider = {
  name: "Azure OpenAI",
  baseUrl: "", // Will be set from environment
  defaultModel: "gpt-35-turbo",
  supportedModels: ["gpt-35-turbo", "gpt-4", "gpt-4-32k"],
  formatRequest: (message: string, config: AIConfig) => ({
    messages: [
      { role: "system", content: config.systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  }),
  parseResponse: (data: any) => data.choices?.[0]?.message?.content,
  headers: (token: string) => ({
    "Content-Type": "application/json",
    "api-key": token,
    "User-Agent": "Chatwoot-AI-Webhook/2.0",
  }),
};

// 智谱AI Provider
export const zhipuProvider: AIProvider = {
  name: "智谱AI",
  baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
  defaultModel: "glm-4",
  supportedModels: ["glm-4", "glm-3-turbo"],
  formatRequest: (message: string, config: AIConfig) => ({
    model: process.env.AI_MODEL || "glm-4",
    messages: [
      { role: "system", content: config.systemPrompt },
      { role: "user", content: message },
    ],
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  }),
  parseResponse: (data: any) => data.choices?.[0]?.message?.content,
  headers: (token: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "User-Agent": "Chatwoot-AI-Webhook/2.0",
  }),
};

// 百度文心一言 Provider
export const baiduProvider: AIProvider = {
  name: "百度文心一言",
  baseUrl: "https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions",
  defaultModel: "ernie-bot",
  supportedModels: ["ernie-bot", "ernie-bot-turbo"],
  formatRequest: (message: string, config: AIConfig) => ({
    messages: [
      { role: "user", content: `${config.systemPrompt}\n\n${message}` },
    ],
    max_output_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
  }),
  parseResponse: (data: any) => data.result,
  headers: (token: string) => ({
    "Content-Type": "application/json",
    "User-Agent": "Chatwoot-AI-Webhook/2.0",
  }),
};

// 通义千问 Provider
export const qwenProvider: AIProvider = {
  name: "通义千问",
  baseUrl: "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation",
  defaultModel: "qwen-turbo",
  supportedModels: ["qwen-turbo", "qwen-plus", "qwen-max"],
  formatRequest: (message: string, config: AIConfig) => ({
    model: process.env.AI_MODEL || "qwen-turbo",
    input: {
      messages: [
        { role: "system", content: config.systemPrompt },
        { role: "user", content: message },
      ],
    },
    parameters: {
      max_tokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
      temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    },
  }),
  parseResponse: (data: any) => data.output?.text || data.output?.choices?.[0]?.message?.content,
  headers: (token: string) => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    "User-Agent": "Chatwoot-AI-Webhook/2.0",
  }),
};

// Provider Registry
export const providers: Record<string, AIProvider> = {
  openai: openaiProvider,
  azure: azureProvider,
  zhipu: zhipuProvider,
  baidu: baiduProvider,
  qwen: qwenProvider,
};

// Get provider based on environment or URL
export function getAIProvider(): AIProvider {
  const providerName = process.env.AI_PROVIDER?.toLowerCase();
  
  if (providerName && providers[providerName]) {
    return providers[providerName];
  }

  // Auto-detect based on URL
  const aiUrl = process.env.AI_API_URL?.toLowerCase();
  if (aiUrl) {
    if (aiUrl.includes("openai.azure.com")) {
      return azureProvider;
    } else if (aiUrl.includes("bigmodel.cn")) {
      return zhipuProvider;
    } else if (aiUrl.includes("baidubce.com")) {
      return baiduProvider;
    } else if (aiUrl.includes("dashscope.aliyuncs.com")) {
      return qwenProvider;
    }
  }

  // Default to OpenAI
  return openaiProvider;
}

// Enhanced AI call function with provider support
export async function callAIWithProvider(
  message: string,
  config: AIConfig,
  retries: number = 3
): Promise<AIResponse> {
  const provider = getAIProvider();
  const maxRetries = retries;
  let lastError: Error | null = null;
  const startTime = Date.now();

  // Use provider URL or fallback to config URL
  const apiUrl = config.aiUrl || provider.baseUrl;

  logger.info(`开始AI调用`, {
    provider: provider.name,
    model: process.env.AI_MODEL || provider.defaultModel,
    messageLength: message.length,
  }, 'ai_call');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptStart = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const requestBody = provider.formatRequest(message, config);
      const headers = provider.headers(config.aiToken!);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const raw = await response.text();

      if (!response.ok) {
        throw new Error(
          `${provider.name} API错误 ${response.status}: ${response.statusText}\n${raw.slice(0, 200)}`
        );
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        throw new Error(`响应解析失败: ${raw.slice(0, 200)}`);
      }

      const content = provider.parseResponse(data);
      if (!content || typeof content !== 'string') {
        throw new Error("AI返回了无效响应");
      }

      const totalDuration = Date.now() - startTime;

      // 记录成功的AI调用
      logger.logAICall(
        true,
        totalDuration,
        provider.name,
        process.env.AI_MODEL || provider.defaultModel
      );

      return { success: true, content: content.trim() };

    } catch (error) {
      lastError = error as Error;
      const attemptDuration = Date.now() - attemptStart;

      logger.warn(`${provider.name} 调用失败 (尝试 ${attempt}/${maxRetries})`, {
        error: error.message,
        attempt,
        duration: attemptDuration,
        provider: provider.name,
      }, 'ai_call');

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  const totalDuration = Date.now() - startTime;
  const errorMessage = `${provider.name} 调用失败，已重试${maxRetries}次: ${lastError?.message || "未知错误"}`;

  // 记录失败的AI调用
  logger.logAICall(
    false,
    totalDuration,
    provider.name,
    process.env.AI_MODEL || provider.defaultModel,
    errorMessage
  );

  return {
    success: false,
    error: errorMessage,
  };
}

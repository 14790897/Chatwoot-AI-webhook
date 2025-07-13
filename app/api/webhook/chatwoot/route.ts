import { type NextRequest, NextResponse } from "next/server"
import {
  WebhookPayload,
  MessageCreatedPayload,
  AIConfig,
  WebhookResponse,
  WebhookEventType,
} from "@/types/chatwoot";
import { callAIWithProvider, getAIProvider } from "@/lib/ai-providers";
import { logger, withPerformanceLogging } from "@/lib/logger";

// 从环境变量读取AI配置
const getAIConfig = (): AIConfig => ({
  aiUrl: process.env.AI_API_URL,
  aiToken: process.env.AI_API_TOKEN,
  systemPrompt:
    process.env.AI_SYSTEM_PROMPT ||
    "你是一个专业的客服助手，请用友好、专业的语气回答用户问题。",
});

// 使用新的日志系统替换原有的日志函数
const logWebhookEvent = (
  event: WebhookEventType,
  data: any,
  level: "info" | "error" | "warn" = "info",
  duration?: number
) => {
  logger.logWebhookEvent(event, data, level, duration);
};

// 验证webhook payload
const validateWebhookPayload = (
  body: any
): { isValid: boolean; error?: string } => {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "请求体必须是有效的JSON对象" };
  }

  if (!body.event) {
    return { isValid: false, error: "缺少必需的 'event' 字段" };
  }

  const supportedEvents: WebhookEventType[] = [
    "conversation_created",
    "conversation_updated",
    "conversation_status_changed",
    "message_created",
    "message_updated",
    "webwidget_triggered",
    "conversation_typing_on",
    "conversation_typing_off",
  ];

  if (!supportedEvents.includes(body.event)) {
    return { isValid: false, error: `不支持的事件类型: ${body.event}` };
  }

  return { isValid: true };
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookPayload: WebhookPayload | null = null;

  try {
    const body = await request.json();
    webhookPayload = body as WebhookPayload;

    // 记录接收到的webhook事件
    logger.info(`接收到webhook事件: ${body.event}`, {
      event: body.event,
      conversation_id: body.conversation?.id || body.id,
    });

    // 验证请求格式
    const validation = validateWebhookPayload(body);
    if (!validation.isValid) {
      const duration = Date.now() - startTime;
      logWebhookEvent(
        body.event,
        { error: validation.error },
        "error",
        duration
      );
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // 根据事件类型处理
    const response = await withPerformanceLogging(
      handleWebhookEvent,
      `处理${body.event}事件`
    )(body as WebhookPayload);

    // 记录处理结果
    const duration = Date.now() - startTime;
    if (response.success) {
      logWebhookEvent(body.event, { response }, "info", duration);
    } else {
      logWebhookEvent(body.event, { error: response.error }, "error", duration);
    }

    return NextResponse.json(response, {
      status: response.success ? 200 : 500,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "未知错误";
    const duration = Date.now() - startTime;

    logger.error("Webhook处理异常", {
      error: errorMessage,
      event: webhookPayload?.event,
      duration,
      stack: error instanceof Error ? error.stack : undefined,
    });

    logWebhookEvent(
      (webhookPayload?.event as WebhookEventType) || "message_created",
      { error: errorMessage },
      "error",
      duration
    );

    return NextResponse.json(
      {
        success: false,
        error: "服务器内部错误",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

// 处理不同类型的webhook事件
async function handleWebhookEvent(
  payload: WebhookPayload
): Promise<WebhookResponse> {
  const timestamp = new Date().toISOString();

  switch (payload.event) {
    case "message_created":
      return await handleMessageCreated(payload as MessageCreatedPayload);

    case "conversation_created":
      return {
        success: true,
        message: "会话已创建",
        conversation_id: (payload as any).id,
        timestamp,
      };

    case "conversation_updated":
      return {
        success: true,
        message: "会话已更新",
        conversation_id: (payload as any).id,
        timestamp,
      };

    case "conversation_status_changed":
      return {
        success: true,
        message: "会话状态已改变",
        conversation_id: (payload as any).id,
        timestamp,
      };

    case "message_updated":
      return {
        success: true,
        message: "消息已更新",
        conversation_id: (payload as any).conversation?.id,
        timestamp,
      };

    case "webwidget_triggered":
      return {
        success: true,
        message: "网页小部件已触发",
        conversation_id: (payload as any).current_conversation?.id,
        timestamp,
      };

    case "conversation_typing_on":
    case "conversation_typing_off":
      return {
        success: true,
        message: `用户${
          payload.event === "conversation_typing_on" ? "开始" : "停止"
        }输入`,
        conversation_id: (payload as any).conversation?.id,
        timestamp,
      };

    default:
      return {
        success: false,
        error: `不支持的事件类型: ${(payload as any).event}`,
        timestamp,
      };
  }
}

// 处理消息创建事件
async function handleMessageCreated(
  payload: MessageCreatedPayload
): Promise<WebhookResponse> {
  const timestamp = new Date().toISOString();

  // 只处理用户发送的消息
  if (payload.message_type !== "incoming") {
    return {
      success: true,
      message: "忽略非用户消息",
      conversation_id: payload.conversation?.id,
      timestamp,
    };
  }

  // 检查AI配置
  const config = getAIConfig();
  if (!config.aiUrl || !config.aiToken) {
    return {
      success: false,
      error: "AI配置未完成，请检查环境变量 AI_API_URL 和 AI_API_TOKEN",
      conversation_id: payload.conversation?.id,
      timestamp,
    };
  }

  // 调用AI接口（支持多种提供商）
  const aiResponse = await callAIWithProvider(payload.content, config);

  if (!aiResponse.success) {
    return {
      success: false,
      error: "AI调用失败",
      details: aiResponse.error,
      conversation_id: payload.conversation?.id,
      timestamp,
    };
  }

  return {
    success: true,
    message: aiResponse.content,
    conversation_id: payload.conversation?.id,
    timestamp,
  };
}

export async function GET() {
  const config = getAIConfig();
  const provider = getAIProvider();

  return NextResponse.json({
    configured: !!(config.aiUrl && config.aiToken),
    systemPrompt: config.systemPrompt,
    hasUrl: !!config.aiUrl,
    hasToken: !!config.aiToken,
    provider: {
      name: provider.name,
      defaultModel: provider.defaultModel,
      supportedModels: provider.supportedModels,
    },
    supportedEvents: [
      "conversation_created",
      "conversation_updated",
      "conversation_status_changed",
      "message_created",
      "message_updated",
      "webwidget_triggered",
      "conversation_typing_on",
      "conversation_typing_off",
    ],
    aiModel: process.env.AI_MODEL || provider.defaultModel,
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "1000"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
}

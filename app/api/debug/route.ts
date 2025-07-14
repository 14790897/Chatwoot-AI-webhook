import { NextResponse } from "next/server";
import { callAIWithProvider, getAIProvider } from "@/lib/ai-providers";

// 调试端点 - 用于排查AI回复问题
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasAiUrl: !!process.env.AI_API_URL,
      hasAiToken: !!process.env.AI_API_TOKEN,
      hasChatwootUrl: !!process.env.CHATWOOT_URL,
      hasChatwootToken: !!process.env.CHATWOOT_BOT_TOKEN,
      aiProvider: process.env.AI_PROVIDER || "auto-detect",
      aiModel: process.env.AI_MODEL || "default",
    },
    config: {
      aiUrl: process.env.AI_API_URL ? "已配置" : "未配置",
      aiToken: process.env.AI_API_TOKEN ? "已配置" : "未配置", 
      chatwootUrl: process.env.CHATWOOT_URL ? "已配置" : "未配置",
      chatwootToken: process.env.CHATWOOT_BOT_TOKEN ? "已配置" : "未配置",
      systemPrompt: process.env.AI_SYSTEM_PROMPT || "使用默认提示词",
    },
    provider: getAIProvider(),
    // 添加Chatwoot账户信息说明
    chatwootInfo: {
      note: "Account ID 来自 Chatwoot webhook payload",
      explanation: "当 Chatwoot 发送 webhook 时，会在 payload.account.id 中包含账户ID",
      apiPathFormat: "/api/v1/accounts/{account_id}/conversations/{conversation_id}/messages",
      yourChatwootUrl: process.env.CHATWOOT_URL,
      expectedAccountId: "通常是 1（如果只有一个账户）",
    },
  };

  return NextResponse.json(diagnostics);
}

// 测试AI调用
export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: "需要提供测试消息" },
        { status: 400 }
      );
    }

    const config = {
      aiUrl: process.env.AI_API_URL,
      aiToken: process.env.AI_API_TOKEN,
      systemPrompt: process.env.AI_SYSTEM_PROMPT || "你是一个专业的客服助手。",
    };

    console.log("开始AI调用测试:", {
      message,
      hasUrl: !!config.aiUrl,
      hasToken: !!config.aiToken,
      provider: getAIProvider().name,
    });

    const startTime = Date.now();
    const aiResponse = await callAIWithProvider(message, config);
    const duration = Date.now() - startTime;

    console.log("AI调用测试结果:", {
      success: aiResponse.success,
      duration,
      responseLength: aiResponse.content?.length,
      error: aiResponse.error,
    });

    return NextResponse.json({
      success: true,
      aiResponse,
      duration,
      config: {
        hasUrl: !!config.aiUrl,
        hasToken: !!config.aiToken,
        provider: getAIProvider().name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI调用测试异常:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: "AI调用测试失败",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

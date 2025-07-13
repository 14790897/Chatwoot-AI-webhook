import { type NextRequest, NextResponse } from "next/server"

// 从环境变量读取AI配置
const getAIConfig = () => ({
  aiUrl: process.env.AI_API_URL,
  aiToken: process.env.AI_API_TOKEN,
  systemPrompt: process.env.AI_SYSTEM_PROMPT || "你是一个专业的客服助手，请用友好、专业的语气回答用户问题。",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // 验证请求格式
    if (!body.content || !body.message_type) {
      return NextResponse.json({ error: "无效的请求格式" }, { status: 400 })
    }

    // 只处理用户发送的消息
    if (body.message_type !== "incoming") {
      return NextResponse.json({ message: "忽略非用户消息" })
    }

    // 检查AI配置
    const config = getAIConfig()
    if (!config.aiUrl || !config.aiToken) {
      return NextResponse.json({ error: "AI配置未完成，请检查环境变量 AI_API_URL 和 AI_API_TOKEN" }, { status: 500 })
    }

    // 调用自定义AI接口
    const aiResponse = await callCustomAI(body.content, config)

    if (!aiResponse.success) {
      return NextResponse.json({ error: "AI调用失败", details: aiResponse.error }, { status: 500 })
    }

    // 返回符合Chatwoot格式的响应
    return NextResponse.json({
      success: true,
      message: aiResponse.content,
      conversation_id: body.conversation?.id,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Webhook处理错误:", error)
    return NextResponse.json({ error: "服务器内部错误", details: error.message }, { status: 500 })
  }
}

async function callCustomAI(userMessage: string, config: ReturnType<typeof getAIConfig>) {
  try {
    const response = await fetch(config.aiUrl!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.aiToken}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // 根据你的AI接口调整
        messages: [
          { role: "system", content: config.systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    const contentType = response.headers.get("content-type") || ""
    const raw = await response.text()

    if (!response.ok) {
      throw new Error(`AI接口返回错误 ${response.status}: ${response.statusText}\n${raw.slice(0, 200)}`)
    }

    // 如果是 JSON，解析并提取文本；否则直接返回文本
    let aiText = raw
    if (contentType.includes("application/json")) {
      try {
        const data = JSON.parse(raw)
        aiText = data.choices?.[0]?.message?.content ?? data.response ?? data.text ?? raw
      } catch {
        // JSON 解析失败时保留原始文本
      }
    }

    return { success: true, content: aiText.trim() }
  } catch (error) {
    console.error("AI调用错误:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function GET() {
  const config = getAIConfig()
  return NextResponse.json({
    configured: !!(config.aiUrl && config.aiToken),
    systemPrompt: config.systemPrompt,
    hasUrl: !!config.aiUrl,
    hasToken: !!config.aiToken,
  })
}

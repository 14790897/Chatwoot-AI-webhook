"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DebugPage() {
  const [message, setMessage] = useState("你好，我需要帮助");
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const testAI = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      setResult(data);
      console.log("AI测试结果:", data);
    } catch (error) {
      setResult({ error: "测试失败", details: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  const getDiagnostics = async () => {
    try {
      const response = await fetch("/api/debug");
      const data = await response.json();
      setDiagnostics(data);
      console.log("诊断信息:", data);
    } catch (error) {
      setDiagnostics({ error: "获取诊断信息失败" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">AI回复调试工具</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>系统诊断</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={getDiagnostics} className="mb-4">
            获取诊断信息
          </Button>
          {diagnostics && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI调用测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="输入测试消息..."
            rows={3}
          />
          <Button onClick={testAI} disabled={isLoading}>
            {isLoading ? "测试中..." : "测试AI回复"}
          </Button>
          {result && (
            <div className="space-y-2">
              <h3 className="font-semibold">测试结果:</h3>
              {result.success && result.aiResponse?.success && (
                <div className="bg-green-50 border border-green-200 p-3 rounded">
                  <p className="text-green-800 font-medium">✅ AI回复成功</p>
                  <p className="text-sm mt-2">{result.aiResponse.content}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    耗时: {result.duration}ms | 提供商: {result.config?.provider}
                  </p>
                </div>
              )}
              {(!result.success || !result.aiResponse?.success) && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-red-800 font-medium">❌ AI回复失败</p>
                  <p className="text-sm mt-2">
                    {result.error || result.aiResponse?.error || "未知错误"}
                  </p>
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  查看完整响应
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Payload 示例</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            这是一个典型的Chatwoot message_created事件中包含的ID信息：
          </p>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
{`{
  "event": "message_created",
  "id": 123,                    // 消息ID
  "content": "用户发送的消息",
  "conversation": {
    "id": 456,                  // 会话ID  
    "display_id": 456           // 界面显示的会话ID
  },
  "account": {
    "id": 1,                    // 账户ID (发送回复时需要)
    "name": "Your Company"
  },
  "contact": {
    "id": 789,                  // 联系人ID
    "name": "用户名"
  },
  "inbox": {
    "id": 101,                  // 收件箱ID
    "name": "网站聊天"
  },
  "sender": {
    "id": 789,                  // 发送者ID (通常等于contact.id)
    "name": "用户名"
  }
}`}
          </pre>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>关键ID说明：</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• <code>account.id</code> 和 <code>conversation.id</code> 用于构建发送回复的API路径</li>
              <li>• API路径格式：<code>/api/v1/accounts/{"{account.id}"}/conversations/{"{conversation.id}"}/messages</code></li>
              <li>• 如果发送失败，通常是这两个ID获取有问题</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

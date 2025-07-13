"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Copy, Send, Webhook } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WebhookDashboard() {
  const [testMessage, setTestMessage] = useState("你好，我想了解一下你们的产品")
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const webhookUrl =
    typeof window !== "undefined" ? `${window.location.origin}/api/webhook/chatwoot` : "/api/webhook/chatwoot"

  const handleTestWebhook = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/webhook/chatwoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_type: "incoming",
          content: testMessage,
          conversation: { id: "test-123" },
          sender: { name: "测试用户" },
        }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      setTestResult({ error: "测试失败", details: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Chatwoot AI Webhook</h1>
          <p className="text-gray-600">自定义AI对接Chatwoot智能客服系统</p>
        </div>

        <Tabs defaultValue="webhook" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhook信息
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              测试接口
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webhook">
            <Card>
              <CardHeader>
                <CardTitle>Webhook配置信息</CardTitle>
                <CardDescription>在Chatwoot中配置以下webhook地址</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value={webhookUrl} readOnly />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>请求方法</Label>
                  <Badge variant="secondary">POST</Badge>
                </div>

                <div className="space-y-2">
                  <Label>Content-Type</Label>
                  <Badge variant="secondary">application/json</Badge>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    请确保在Chatwoot的集成设置中正确配置此webhook地址，并选择相应的触发事件。
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Chatwoot配置步骤：</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>登录Chatwoot管理后台</li>
                    <li>进入 Settings → Integrations → Webhooks</li>
                    <li>点击 "Add new webhook"</li>
                    <li>粘贴上面的Webhook URL</li>
                    <li>选择触发事件（建议选择 "Message Created"）</li>
                    <li>保存配置</li>
                  </ol>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">环境变量配置：</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <code className="bg-gray-200 px-2 py-1 rounded">AI_API_URL</code> - AI接口地址
                    </div>
                    <div>
                      <code className="bg-gray-200 px-2 py-1 rounded">AI_API_TOKEN</code> - AI接口Token
                    </div>
                    <div>
                      <code className="bg-gray-200 px-2 py-1 rounded">AI_SYSTEM_PROMPT</code> - 系统提示词（可选）
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>测试Webhook</CardTitle>
                <CardDescription>模拟Chatwoot发送消息来测试AI响应</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testMessage">测试消息</Label>
                  <Textarea
                    id="testMessage"
                    placeholder="输入要测试的消息..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button onClick={handleTestWebhook} disabled={isLoading || !testMessage} className="w-full">
                  {isLoading ? "测试中..." : "发送测试"}
                </Button>

                {testResult && (
                  <div className="space-y-2">
                    <Label>测试结果</Label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm overflow-auto">{JSON.stringify(testResult, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

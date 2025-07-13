"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Copy,
  Send,
  Webhook,
  Settings,
  Activity,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WebhookDashboard() {
  const [testMessage, setTestMessage] =
    useState("你好，我想了解一下你们的产品");
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState("message_created");
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhook/chatwoot`
      : "/api/webhook/chatwoot";

  // 获取配置信息
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/webhook/chatwoot");
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error("获取配置失败:", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // 生成测试数据
  const generateTestPayload = (eventType: string, message: string) => {
    const basePayload = {
      event: eventType,
      account: { id: 1, name: "测试账户" },
      timestamp: new Date().toISOString(),
    };

    switch (eventType) {
      case "message_created":
        return {
          ...basePayload,
          id: Math.floor(Math.random() * 1000),
          content: message,
          message_type: "incoming",
          content_type: "text",
          content_attributes: {},
          source_id: "test-source",
          sender: { id: 1, name: "测试用户", type: "contact" },
          contact: { id: 1, name: "测试用户" },
          conversation: { id: 123, display_id: 123 },
        };
      case "conversation_created":
        return {
          ...basePayload,
          id: Math.floor(Math.random() * 1000),
          status: "open",
          inbox_id: 1,
          contact_inbox: { id: 1, contact_id: 1, inbox_id: 1 },
        };
      default:
        return {
          ...basePayload,
          conversation: { id: 123, display_id: 123 },
        };
    }
  };

  const handleTestWebhook = async () => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const payload = generateTestPayload(selectedEvent, testMessage);

      const response = await fetch("/api/webhook/chatwoot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      setTestResult({
        ...result,
        requestPayload: payload,
        status: response.status,
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: "测试失败",
        details: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Chatwoot AI Webhook
          </h1>
          <p className="text-gray-600">自定义AI对接Chatwoot智能客服系统</p>
        </div>

        <Tabs defaultValue="webhook" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="webhook" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhook信息
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              配置状态
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
                <CardDescription>
                  在Chatwoot中配置以下webhook地址
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex items-center gap-2">
                    <Input value={webhookUrl} readOnly />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(webhookUrl)}
                    >
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
                      <code className="bg-gray-200 px-2 py-1 rounded">
                        AI_API_URL
                      </code>{" "}
                      - AI接口地址
                    </div>
                    <div>
                      <code className="bg-gray-200 px-2 py-1 rounded">
                        AI_API_TOKEN
                      </code>{" "}
                      - AI接口Token
                    </div>
                    <div>
                      <code className="bg-gray-200 px-2 py-1 rounded">
                        AI_SYSTEM_PROMPT
                      </code>{" "}
                      - 系统提示词（可选）
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  系统配置状态
                </CardTitle>
                <CardDescription>查看当前系统配置和AI服务状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingConfig ? (
                  <div className="flex items-center justify-center py-8">
                    <Activity className="w-6 h-6 animate-spin" />
                    <span className="ml-2">加载配置信息...</span>
                  </div>
                ) : config ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>配置状态</Label>
                        <div className="flex items-center gap-2">
                          {config.configured ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                          <Badge
                            variant={
                              config.configured ? "default" : "destructive"
                            }
                          >
                            {config.configured ? "已配置" : "未配置"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>AI提供商</Label>
                        <Badge variant="outline">
                          {config.provider?.name || "未知"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>AI模型</Label>
                        <Badge variant="secondary">{config.aiModel}</Badge>
                      </div>

                      <div className="space-y-2">
                        <Label>版本</Label>
                        <Badge variant="outline">{config.version}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>支持的事件类型</Label>
                      <div className="flex flex-wrap gap-2">
                        {config.supportedEvents?.map((event: string) => (
                          <Badge
                            key={event}
                            variant="outline"
                            className="text-xs"
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>AI参数配置</Label>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                        <div>最大Token数: {config.maxTokens}</div>
                        <div>温度参数: {config.temperature}</div>
                        <div>
                          支持的模型:{" "}
                          {config.provider?.supportedModels?.join(", ")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>系统提示词</Label>
                      <Textarea
                        value={config.systemPrompt}
                        readOnly
                        rows={3}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      无法获取配置信息，请检查服务器状态。
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>测试Webhook</CardTitle>
                <CardDescription>
                  模拟不同类型的Chatwoot事件来测试系统响应
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>事件类型</Label>
                    <Select
                      value={selectedEvent}
                      onValueChange={setSelectedEvent}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择事件类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="message_created">
                          消息创建 (message_created)
                        </SelectItem>
                        <SelectItem value="conversation_created">
                          会话创建 (conversation_created)
                        </SelectItem>
                        <SelectItem value="conversation_updated">
                          会话更新 (conversation_updated)
                        </SelectItem>
                        <SelectItem value="conversation_status_changed">
                          会话状态改变
                        </SelectItem>
                        <SelectItem value="webwidget_triggered">
                          网页小部件触发
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>配置状态</Label>
                    <div className="flex items-center gap-2 pt-2">
                      {config?.configured ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm">
                        {config?.configured ? "AI已配置" : "AI未配置"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedEvent === "message_created" && (
                  <div className="space-y-2">
                    <Label htmlFor="testMessage">测试消息内容</Label>
                    <Textarea
                      id="testMessage"
                      placeholder="输入要测试的消息..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                <Button
                  onClick={handleTestWebhook}
                  disabled={
                    isLoading ||
                    (selectedEvent === "message_created" && !testMessage)
                  }
                  className="w-full"
                >
                  {isLoading ? "测试中..." : `测试 ${selectedEvent} 事件`}
                </Button>

                {testResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label>测试结果</Label>
                      <Badge
                        variant={testResult.success ? "default" : "destructive"}
                      >
                        {testResult.success ? "成功" : "失败"}
                      </Badge>
                      {testResult.status && (
                        <Badge variant="outline">
                          HTTP {testResult.status}
                        </Badge>
                      )}
                    </div>

                    {testResult.success && testResult.message && (
                      <div className="space-y-2">
                        <Label className="text-sm">AI响应内容</Label>
                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                          <p className="text-sm text-green-800">
                            {testResult.message}
                          </p>
                        </div>
                      </div>
                    )}

                    {testResult.error && (
                      <div className="space-y-2">
                        <Label className="text-sm">错误信息</Label>
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                          <p className="text-sm text-red-800">
                            {testResult.error}
                          </p>
                          {testResult.details && (
                            <p className="text-xs text-red-600 mt-1">
                              {testResult.details}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm">完整响应</Label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <pre className="text-xs overflow-auto max-h-40">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

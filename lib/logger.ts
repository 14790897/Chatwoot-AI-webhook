// Enhanced logging and monitoring system
import { WebhookEventType } from "@/types/chatwoot";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  event: WebhookEventType | 'system' | 'ai_call' | 'unknown';
  message: string;
  data?: any;
  duration?: number;
  conversationId?: string | number;
  userId?: string | number;
}

export interface SystemMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  aiCallsCount: number;
  aiCallsSuccess: number;
  aiCallsFailed: number;
  lastActivity: string;
  uptime: number;
  eventCounts: Record<WebhookEventType, number>;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // 最多保存1000条日志
  private metrics: SystemMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    aiCallsCount: 0,
    aiCallsSuccess: 0,
    aiCallsFailed: 0,
    lastActivity: new Date().toISOString(),
    uptime: Date.now(),
    eventCounts: {
      conversation_created: 0,
      conversation_updated: 0,
      conversation_status_changed: 0,
      message_created: 0,
      message_updated: 0,
      webwidget_triggered: 0,
      conversation_typing_on: 0,
      conversation_typing_off: 0,
    },
  };

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private addLog(entry: Omit<LogEntry, "id" | "timestamp">): void {
    const logEntry: LogEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(logEntry);

    // 保持日志数量在限制内
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // 输出到控制台
    const logMessage = `[${
      logEntry.timestamp
    }] ${logEntry.level.toUpperCase()}: ${logEntry.message}`;

    switch (logEntry.level) {
      case "error":
        console.error(logMessage, logEntry.data);
        break;
      case "warn":
        console.warn(logMessage, logEntry.data);
        break;
      case "debug":
        console.debug(logMessage, logEntry.data);
        break;
      default:
        console.log(logMessage, logEntry.data);
    }
  }

  info(
    message: string,
    data?: any,
    event: WebhookEventType | "system" | "ai_call" = "system"
  ): void {
    this.addLog({ level: "info", message, data, event });
  }

  warn(
    message: string,
    data?: any,
    event: WebhookEventType | "system" | "ai_call" = "system"
  ): void {
    this.addLog({ level: "warn", message, data, event });
  }

  error(
    message: string,
    data?: any,
    event: WebhookEventType | "system" | "ai_call" = "system"
  ): void {
    this.addLog({ level: "error", message, data, event });
    this.metrics.failedRequests++;
  }

  debug(
    message: string,
    data?: any,
    event: WebhookEventType | "system" | "ai_call" = "system"
  ): void {
    if (process.env.NODE_ENV === "development") {
      this.addLog({ level: "debug", message, data, event });
    }
  }

  // 记录webhook事件
  logWebhookEvent(
    event: WebhookEventType,
    data: any,
    level: "info" | "warn" | "error" = "info",
    duration?: number
  ): void {
    this.metrics.totalRequests++;
    this.metrics.lastActivity = new Date().toISOString();

    if (this.metrics.eventCounts[event] !== undefined) {
      this.metrics.eventCounts[event]++;
    }

    if (level === "info") {
      this.metrics.successfulRequests++;
    }

    if (duration) {
      // 更新平均响应时间
      const totalTime =
        this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
        duration;
      this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
    }

    // 构建详细的消息描述
    let messageDetail = `Webhook事件: ${event}`;

    // 根据事件类型添加具体信息
    if (event === "message_created" && data.content) {
      const content =
        data.content.length > 50
          ? data.content.substring(0, 50) + "..."
          : data.content;
      const sender = data.sender?.name || data.contact?.name || "未知用户";
      messageDetail += ` | 用户: ${sender} | 内容: "${content}"`;
    } else if (event === "conversation_created") {
      messageDetail += ` | 新会话创建`;
    } else if (event === "conversation_status_changed") {
      messageDetail += ` | 状态变更: ${data.status || "未知"}`;
    }

    this.addLog({
      level,
      message: messageDetail,
      data: {
        event,
        conversation_id: data.conversation?.id || data.id,
        user_id: data.sender?.id || data.user?.id,
        content: data.content,
        message_type: data.message_type,
        sender_name: data.sender?.name || data.contact?.name,
        status: data.status,
        duration: duration ? `${duration}ms` : undefined,
        // 只在错误时包含完整数据
        ...(level === "error" ? { full_data: data } : {}),
      },
      event,
      duration,
      conversationId: data.conversation?.id || data.id,
      userId: data.sender?.id || data.user?.id,
    });
  }

  // 记录AI调用
  logAICall(
    success: boolean,
    duration: number,
    provider: string,
    model: string,
    error?: string,
    messageLength?: number,
    responseLength?: number
  ): void {
    this.metrics.aiCallsCount++;

    if (success) {
      this.metrics.aiCallsSuccess++;
      this.info(
        `AI调用成功 | ${provider} ${model} | ${duration}ms${
          responseLength ? ` | 响应长度: ${responseLength}字符` : ""
        }`,
        {
          provider,
          model,
          duration: `${duration}ms`,
          success: true,
          messageLength,
          responseLength,
        },
        "ai_call"
      );
    } else {
      this.metrics.aiCallsFailed++;
      this.error(
        `AI调用失败 | ${provider} ${model} | ${duration}ms | 错误: ${error}`,
        {
          provider,
          model,
          duration: `${duration}ms`,
          success: false,
          error,
          messageLength,
        },
        "ai_call"
      );
    }
  }

  // 获取日志
  getLogs(
    limit?: number,
    level?: LogEntry["level"],
    event?: string
  ): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    if (event) {
      filteredLogs = filteredLogs.filter((log) => log.event === event);
    }

    return limit ? filteredLogs.slice(0, limit) : filteredLogs;
  }

  // 获取系统指标
  getMetrics(): SystemMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.metrics.uptime,
    };
  }

  // 清除日志
  clearLogs(): void {
    this.logs = [];
  }

  // 重置指标
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      aiCallsCount: 0,
      aiCallsSuccess: 0,
      aiCallsFailed: 0,
      lastActivity: new Date().toISOString(),
      uptime: Date.now(),
      eventCounts: {
        conversation_created: 0,
        conversation_updated: 0,
        conversation_status_changed: 0,
        message_created: 0,
        message_updated: 0,
        webwidget_triggered: 0,
        conversation_typing_on: 0,
        conversation_typing_off: 0,
      },
    };
  }

  // 获取健康状态
  getHealthStatus(): {
    status: "healthy" | "warning" | "error";
    checks: Record<string, boolean>;
    message: string;
  } {
    const checks = {
      hasRecentActivity:
        Date.now() - new Date(this.metrics.lastActivity).getTime() < 300000, // 5分钟内有活动
      lowErrorRate:
        this.metrics.totalRequests === 0 ||
        this.metrics.failedRequests / this.metrics.totalRequests < 0.1, // 错误率低于10%
      aiCallsWorking:
        this.metrics.aiCallsCount === 0 ||
        this.metrics.aiCallsSuccess / this.metrics.aiCallsCount > 0.8, // AI调用成功率高于80%
    };

    const failedChecks = Object.entries(checks).filter(
      ([_, passed]) => !passed
    );

    let status: "healthy" | "warning" | "error" = "healthy";
    let message = "系统运行正常";

    if (failedChecks.length > 0) {
      status = failedChecks.length >= 2 ? "error" : "warning";
      message = `检查失败: ${failedChecks.map(([check]) => check).join(", ")}`;
    }

    return { status, checks, message };
  }
}

// 单例实例
export const logger = new Logger();

// 性能监控装饰器
export function withPerformanceLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: any[]) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.debug(`${name} 执行完成`, { duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${name} 执行失败`, { error: error.message, duration });
      throw error;
    }
  }) as T;
}

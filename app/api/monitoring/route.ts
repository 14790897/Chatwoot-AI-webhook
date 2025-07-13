import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const level = searchParams.get('level') as any;
    const event = searchParams.get('event');

    switch (action) {
      case 'metrics':
        return NextResponse.json({
          success: true,
          data: logger.getMetrics(),
          timestamp: new Date().toISOString(),
        });

      case 'logs':
        return NextResponse.json({
          success: true,
          data: logger.getLogs(limit, level, event),
          timestamp: new Date().toISOString(),
        });

      case 'health':
        const health = logger.getHealthStatus();
        return NextResponse.json({
          success: true,
          data: health,
          timestamp: new Date().toISOString(),
        }, { 
          status: health.status === 'error' ? 500 : 200 
        });

      default:
        return NextResponse.json({
          success: false,
          error: "不支持的操作",
          supportedActions: ['metrics', 'logs', 'health'],
        }, { status: 400 });
    }
  } catch (error) {
    logger.error("监控API错误", { error: error.message });
    return NextResponse.json({
      success: false,
      error: "服务器内部错误",
      details: error.message,
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'logs':
        logger.clearLogs();
        return NextResponse.json({
          success: true,
          message: "日志已清除",
          timestamp: new Date().toISOString(),
        });

      case 'metrics':
        logger.resetMetrics();
        return NextResponse.json({
          success: true,
          message: "指标已重置",
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: false,
          error: "不支持的操作",
          supportedActions: ['logs', 'metrics'],
        }, { status: 400 });
    }
  } catch (error) {
    logger.error("监控API删除操作错误", { error: error.message });
    return NextResponse.json({
      success: false,
      error: "服务器内部错误",
      details: error.message,
    }, { status: 500 });
  }
}

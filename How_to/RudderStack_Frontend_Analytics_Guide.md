# 前端用户行为数据采集系统 - RudderStack + Supabase

## 概述

本系统使用开源的 RudderStack 作为数据采集中台，结合 Supabase 数据库，实现前端用户行为数据的采集、处理和存储。支持 Vercel 部署环境，提供完整的事件追踪和用户行为分析能力。

## 系统架构

```
前端应用 (React/Next.js)
    ↓ (事件发送)
RudderStack JavaScript SDK
    ↓ (HTTP POST)
本地 RudderStack 服务 (Docker)
    ↓ (Webhook 转发)
Next.js API 端点 (/api/analytics/webhook)
    ↓ (数据存储)
Supabase 数据库 (dev.user_events, dev.sessions)
```

## 核心组件

### 1. 前端分析服务
- **文件**: `src/services/analytics.ts`
- **功能**: RudderStack SDK 初始化和事件发送
- **配置**: 使用本地 RudderStack 服务，禁用云端配置获取

### 2. React 集成
- **Provider**: `src/providers/AnalyticsProvider.tsx`
- **Hook**: `src/hooks/useAnalytics.ts`
- **类型定义**: `src/types/analyticsTypes.ts`
- **工具函数**: `src/utils/analyticsHelpers.ts`

### 3. 后端处理
- **API 端点**: `pages/api/analytics/webhook.ts`
- **功能**: 接收 RudderStack 事件，验证并存储到 Supabase

### 4. Docker 服务
- **配置文件**: `docker-compose.rudderstack.yml`
- **工作空间配置**: `rudderstack/config/workspaceConfig.json`

## 服务管理

### 启动服务

1. **启动 Supabase** (如果未启动):
```bash
# 在项目根目录
supabase start
```

2. **启动 RudderStack 服务**:
```bash
docker-compose -f docker-compose.rudderstack.yml up -d
```

3. **启动 Next.js 应用**:
```bash
npm run dev
```

### 停止服务

```bash
# 停止 RudderStack
docker-compose -f docker-compose.rudderstack.yml down

# 停止 Supabase
supabase stop
```

### 服务状态检查

```bash
# 检查 Docker 容器状态
docker ps

# 检查 RudderStack 服务健康状态
curl http://localhost:8102/health

# 检查 Supabase 连接
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT 1"
```

## 配置管理

### 环境变量 (.env.local)

```env
# RudderStack 配置
NEXT_PUBLIC_RUDDERSTACK_WRITE_KEY=your-dev-write-key
NEXT_PUBLIC_RUDDERSTACK_DATA_PLANE_URL=http://localhost:8102
RUDDERSTACK_WEBHOOK_SECRET=dev-webhook-secret

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### RudderStack 配置 (rudderstack/config/workspaceConfig.json)

```json
{
  "sources": [{
    "id": "1pYpnSEfaRJmdyfF4tuvJBw5gu8",
    "name": "JavaScript Source", 
    "writeKey": "your-dev-write-key",
    "destinations": [{
      "id": "1pYpnSEfaRJmdyfF4tuvJBw5gu9",
      "name": "Webhook Destination",
      "config": {
        "webhookUrl": "http://host.docker.internal:5173/api/analytics/webhook",
        "webhookMethod": "POST"
      }
    }]
  }]
}
```

## 数据流程

### 1. 事件采集

前端组件中使用 `useAnalytics` hook：

```typescript
const { trackChatMessage, trackWidgetInteraction } = useAnalytics();

// 聊天消息事件
trackChatMessage('sent', {
  message_length: message.length,
  intelligent_mode: isIntelligentMode,
  input_method: 'text'
});

// Widget 交互事件
trackWidgetInteraction('click', {
  widget_type: 'chat_input',
  action: 'focus'
});
```

### 2. 数据处理

webhook API (`pages/api/analytics/webhook.ts`) 处理流程：
1. **签名验证**: 验证来自 RudderStack 的请求
2. **数据解析**: 提取事件数据和用户信息
3. **UUID 验证**: 处理 user_id 的 UUID 格式要求
4. **数据存储**: 保存到 `dev.user_events` 表
5. **会话更新**: 更新 `dev.sessions` 表的统计信息

### 3. 数据库结构

**user_events 表**:
- event_name: 事件名称
- user_id: 用户UUID (可为null)
- anonymous_id: 匿名用户ID
- session_id: 会话ID
- properties: 事件属性 (JSONB)
- timestamp: 事件时间戳
- 其他元数据字段

**sessions 表**:
- session_id: 会话标识符
- user_id: 关联用户ID
- message_count: 消息计数
- metadata: 会话元数据 (JSONB)
- last_activity: 最后活动时间

## 调试和监控

### 1. 前端调试

在浏览器控制台查看：
```javascript
// 检查 Analytics 服务状态
window.analytics // 应该显示 RudderAnalytics 实例

// 查看网络请求
// Network 面板中应有向 localhost:8102 的请求
```

### 2. 服务端调试

查看 RudderStack 日志：
```bash
docker logs rudder_backend --tail=50 -f
```

查看数据库中的事件：
```sql
-- 查看最新的事件
SELECT event_name, user_id, anonymous_id, created_at 
FROM dev.user_events 
ORDER BY created_at DESC 
LIMIT 10;

-- 查看会话统计
SELECT session_id, message_count, last_activity 
FROM dev.sessions 
ORDER BY last_activity DESC 
LIMIT 10;
```

### 3. API 端点测试

直接测试 webhook：
```bash
curl -X POST http://localhost:5173/api/analytics/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "track",
    "event": "TEST_EVENT",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "properties": {"test": "value"}
  }'
```

## 优化空间

### 1. 性能优化

**批量处理**:
```javascript
// 实现事件缓冲区，批量发送
const eventBuffer = [];
const flushInterval = 5000; // 5秒

function bufferEvent(event) {
  eventBuffer.push(event);
  if (eventBuffer.length >= 50) {
    flushEvents();
  }
}
```

**数据压缩**:
- 使用 gzip 压缩 webhook 请求体
- 减少不必要的事件属性

**连接池优化**:
```javascript
// 在 webhook API 中使用连接池
const supabase = createClient(url, key, {
  db: { 
    poolConfig: {
      max: 20,
      min: 5,
      acquireTimeoutMillis: 30000,
    }
  }
});
```

### 2. 数据质量

**数据验证**:
```javascript
// 添加更严格的事件数据验证
function validateEvent(event) {
  const schema = {
    event_name: { type: 'string', required: true, maxLength: 100 },
    user_id: { type: 'uuid', required: false },
    properties: { type: 'object', maxSize: '50KB' }
  };
  
  return validate(event, schema);
}
```

**数据去重**:
```sql
-- 在数据库层面添加唯一性约束
ALTER TABLE dev.user_events 
ADD CONSTRAINT unique_event_per_session 
UNIQUE (session_id, event_name, timestamp);
```

### 3. 监控和告警

**健康检查端点**:
```javascript
// pages/api/analytics/health.ts
export default function handler(req, res) {
  const checks = {
    database: await checkDatabaseConnection(),
    rudderstack: await checkRudderStackConnection(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(checks);
}
```

**错误追踪**:
```javascript
// 集成 Sentry 或类似工具
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { component: 'analytics-webhook' },
  extra: { eventData, requestId }
});
```

## 扩展性

### 1. 多环境支持

**环境配置管理**:
```javascript
// src/config/analytics.ts
const configs = {
  development: {
    dataPlaneUrl: 'http://localhost:8102',
    writeKey: 'dev-key',
    debugMode: true
  },
  production: {
    dataPlaneUrl: 'https://rudderstack.yourcompany.com',
    writeKey: process.env.RUDDERSTACK_WRITE_KEY,
    debugMode: false
  }
};

export const analyticsConfig = configs[process.env.NODE_ENV];
```

### 2. 目标数据源扩展

**添加新的目标**:
```json
// 在 workspaceConfig.json 中添加更多目标
{
  "destinations": [
    {
      "name": "Webhook Destination",
      "config": { "webhookUrl": "..." }
    },
    {
      "name": "PostgreSQL Warehouse",
      "destinationDefinitionId": "postgres-id",
      "config": { "host": "...", "database": "..." }
    },
    {
      "name": "Google Analytics",
      "destinationDefinitionId": "ga-id", 
      "config": { "trackingId": "GA-XXXXXX" }
    }
  ]
}
```

### 3. 实时数据处理

**WebSocket 集成**:
```javascript
// 实现实时事件流
const eventStream = new WebSocket('ws://localhost:8103/events');

eventStream.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // 实时更新仪表板
  updateDashboard(data);
};
```

**流处理集成**:
- Apache Kafka 集成用于大规模事件流
- Redis Streams 用于实时事件处理
- ClickHouse 用于时间序列分析

### 4. 高级分析功能

**用户行为分析**:
```javascript
// src/analytics/userJourney.ts
export class UserJourneyAnalyzer {
  constructor(private db: SupabaseClient) {}
  
  async getFunnel(steps: string[]) {
    // 计算转化漏斗
  }
  
  async getCohortAnalysis(dateRange: DateRange) {
    // 用户留存分析
  }
  
  async getSessionRecording(sessionId: string) {
    // 会话回放功能
  }
}
```

**A/B 测试集成**:
```javascript
// 与实验平台集成
const experiment = await getExperiment('new-ui-test');
trackEvent('experiment_exposure', {
  experiment_id: experiment.id,
  variant: experiment.variant,
  user_id: userId
});
```

## 生产环境部署

### 1. Vercel 部署配置

```json
// vercel.json
{
  "env": {
    "RUDDERSTACK_WEBHOOK_SECRET": "@rudderstack-webhook-secret",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  },
  "functions": {
    "pages/api/analytics/webhook.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. 安全配置

**API 安全**:
- 实现请求频率限制
- 添加 IP 白名单
- 使用 HTTPS 加密传输

**数据隐私**:
- 实现数据脱敏
- 支持 GDPR 合规性
- 添加数据保留政策

## 故障排除

### 常见问题

1. **RudderStack 连接失败**:
   - 检查 Docker 服务状态
   - 验证端口映射 (8102)
   - 检查防火墙设置

2. **数据未保存到 Supabase**:
   - 检查 webhook URL 配置
   - 验证数据库连接
   - 查看 API 错误日志

3. **前端事件未发送**:
   - 检查 Analytics 初始化状态
   - 验证环境变量配置
   - 查看浏览器控制台错误

### 日志分析

```bash
# RudderStack 日志
docker logs rudder_backend | grep ERROR

# Next.js 应用日志
npm run dev 2>&1 | grep analytics

# Supabase 连接测试
curl -X POST http://localhost:54321/rest/v1/user_events \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## 总结

本系统提供了完整的前端用户行为数据采集解决方案，具有良好的可扩展性和维护性。通过合理的架构设计和配置管理，可以支持从开发环境到生产环境的平滑迁移，并为后续的数据分析和业务洞察提供坚实的基础。
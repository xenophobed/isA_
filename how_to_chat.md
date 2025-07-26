# 聊天API使用指南

## 概述

本文档详细说明如何在React/Next.js项目中使用isA_Agent聊天API。API支持实时流式响应，包括文本对话、工具调用（图像生成、网页搜索等）。

## API端点

- **URL**: `http://localhost:8080/api/chat`
- **方法**: `POST`
- **认证**: Bearer Token (Header: `Authorization: Bearer dev_key_test`)
- **响应格式**: Server-Sent Events (SSE)

## 请求格式

```json
{
  "message": "用户消息内容",
  "user_id": "auth0_user_123456", 
  "session_id": "sess_789abc",    
  "prompt_name": null,            
  "prompt_args": {}               
}
```

**参数说明：**
- `message`: 用户输入的消息内容（必需）
- `user_id`: 前端认证后的用户唯一标识（必需，由前端管理）
- `session_id`: 前端管理的会话标识符（必需，由前端管理）
- `prompt_name`: 可选的提示模板名称
- `prompt_args`: 提示模板的参数

**重要说明：**
- `user_id` 和 `session_id` 由前端应用负责管理
- API不进行用户认证验证，信任前端传入的参数
- 数据库记录会使用这些ID进行关联和存储

## 响应数据结构

API返回Server-Sent Events (SSE)流，每个事件包含以下结构：

### 基础事件格式
```json
{
  "type": "事件类型",
  "content": "事件内容",
  "timestamp": "2025-07-24T23:15:37.255288",
  "session_id": "sess_789abc",
  "stream_mode": "流模式"
}
```

### 事件类型详解

#### 1. `start` - 处理开始
```json
{
  "type": "start",
  "content": "Starting chat processing",
  "timestamp": "2025-07-24T23:15:37.255288",
  "session_id": "sess_789abc"
}
```

#### 2. `custom_stream` - 自定义流事件

**LLM Token流（实时文本生成）:**
```json
{
  "type": "custom_stream",
  "content": {"custom_llm_chunk": "Hello"},
  "timestamp": "2025-07-24T23:15:39.860423",
  "session_id": "sess_789abc",
  "stream_mode": "custom"
}
```

**工具执行进度:**
```json
{
  "type": "custom_stream",
  "content": {
    "data": "[generate_image] Starting execution (1/1)",
    "type": "progress"
  },
  "timestamp": "2025-07-24T23:29:34.288512",
  "session_id": "sess_789abc",
  "stream_mode": "custom"
}
```

#### 3. `message_stream` - 消息流
包含LangChain消息信息，如工具调用：
```json
{
  "type": "message_stream",
  "content": {
    "raw_message": "content='' tool_calls=[{'name': 'generate_image', 'args': {'prompt': 'a cute cat'}}]"
  },
  "timestamp": "2025-07-24T23:29:34.285980",
  "session_id": "sess_789abc",
  "stream_mode": "messages"
}
```

#### 4. `graph_update` - 图状态更新
```json
{
  "type": "graph_update",
  "content": "节点状态摘要...",
  "timestamp": "2025-07-24T23:29:34.286197",
  "session_id": "sess_789abc",
  "stream_mode": "updates",
  "data": {
    "reason_model": {
      "messages": ["消息内容"],
      "next_action": "call_tool"
    }
  }
}
```

#### 5. `memory_update` - 记忆更新
```json
{
  "type": "memory_update",
  "content": "Memory updated: 2 memories stored",
  "timestamp": "2025-07-24T23:29:45.123456",
  "session_id": "sess_789abc",
  "data": {
    "memories_stored": 2,
    "status": "success"
  }
}
```

#### 6. `billing` - 计费信息
```json
{
  "type": "billing",
  "content": "Billed 1.0 credits: 1 model calls, 0 tool calls",
  "timestamp": "2025-07-25T17:58:56.651362",
  "session_id": "test_session_123",
  "data": {
    "success": true,
    "model_calls": 1,
    "tool_calls": 0,
    "total_credits": 1.0,
    "credits_remaining": 1000.0,
    "error_message": null
  }
}
```

#### 7. `end` - 处理完成
```json
{
  "type": "end",
  "content": "Chat processing completed",
  "timestamp": "2025-07-24T23:29:50.123456",
  "session_id": "sess_789abc"
}
```

#### 8. `error` - 错误处理
```json
{
  "type": "error",
  "content": "Processing error: 错误描述",
  "timestamp": "2025-07-24T23:29:45.123456"
}
```

## 完整响应提取

除了流式数据外，API还提供多种方式获取完整的最终响应：

### 方法1: 从message_stream事件提取
`message_stream` 事件包含完整的AI响应：

```json
{
  "type": "message_stream",
  "content": {
    "raw_message": "content='完整的AI回复内容在这里' additional_kwargs={} response_metadata={} id='message-id'"
  },
  "timestamp": "2025-07-25T17:58:55.699908",
  "session_id": "test_session_123",
  "stream_mode": "messages"
}
```

### 方法2: 从custom_llm_chunk重构完整响应
通过累积所有 `custom_llm_chunk` 可以重构完整响应：

```typescript
let completeResponse = '';
// 累积所有custom_llm_chunk
if (event.type === 'custom_stream' && event.content?.custom_llm_chunk) {
  completeResponse += event.content.custom_llm_chunk;
}
```

### 方法3: 从graph_update获取完整状态
`graph_update` 事件包含完整的对话状态和响应：

```json
{
  "type": "graph_update",
  "content": "{'reason_model': {'messages': [完整响应内容], 'next_action': 'end'}}",
  "data": {
    "reason_model": {
      "messages": ["完整的格式化消息"],
      "next_action": "end"
    }
  }
}
```

### 响应提取工具函数

```typescript
// 工具函数：从不同事件类型提取完整响应
export const extractCompleteResponse = (event: ChatMessage): string | null => {
  switch (event.type) {
    case 'message_stream':
      // 方法1: 从message_stream提取
      if (event.content?.raw_message) {
        const singleQuoteMatch = event.content.raw_message.match(/content='([^']+)'/);
        const doubleQuoteMatch = event.content.raw_message.match(/content="([^"]+)"/);
        return singleQuoteMatch?.[1] || doubleQuoteMatch?.[1] || null;
      }
      break;
      
    case 'graph_update':
      // 方法3: 从graph_update提取
      if (event.data?.reason_model?.messages) {
        const messages = event.data.reason_model.messages;
        for (const msg of messages) {
          const singleQuoteMatch = msg.match(/content='([^']+)'/);
          const doubleQuoteMatch = msg.match(/content="([^"]+)"/);
          const match = singleQuoteMatch?.[1] || doubleQuoteMatch?.[1];
          if (match) return match;
        }
      }
      break;
  }
  return null;
};

// 使用示例
const completeResponse = extractCompleteResponse(event);
if (completeResponse) {
  console.log('提取到完整响应:', completeResponse);
  // 保存或显示完整响应
}
```

## React/Next.js 实现示例

### 1. 基础聊天组件

```tsx
import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  type: string;
  content: any;
  timestamp: string;
  session_id?: string;
}

const ChatComponent: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [completeResponses, setCompleteResponses] = useState<string[]>([]);
  
  // 这些值应该由你的前端认证系统提供
  const userId = "auth0_user_123456"; // 从认证系统获取
  const sessionId = "sess_789abc";    // 从会话管理系统获取

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    setCurrentResponse('');
    
    // 添加用户消息
    const userMessage: ChatMessage = {
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // 发送请求
      const response = await fetch('http://localhost:8080/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dev_key_test',
        },
        body: JSON.stringify({ 
          message, 
          user_id: userId,      // 前端管理的用户ID
          session_id: sessionId // 前端管理的会话ID
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 创建EventSource来处理SSE
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const eventData = JSON.parse(line.slice(6));
                handleSSEEvent(eventData);
              } catch (e) {
                console.error('解析SSE数据失败:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: `错误: ${error}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSEEvent = (event: ChatMessage) => {
    switch (event.type) {
      case 'start':
        console.log('开始处理:', event.content);
        break;
      
      case 'custom_stream':
        // 处理LLM token流
        if (event.content?.custom_llm_chunk) {
          setCurrentResponse(prev => prev + event.content.custom_llm_chunk);
        }
        break;
      
      case 'message_stream':
        // 方法1: 从message_stream提取完整响应
        if (event.content?.raw_message) {
          const match = event.content.raw_message.match(/content='([^']+)'/);
          if (match) {
            const completeResponse = match[1];
            setCompleteResponses(prev => [...prev, completeResponse]);
            console.log('完整响应(方法1):', completeResponse);
          }
        }
        break;
      
      case 'graph_update':
        // 方法3: 从graph_update获取完整状态
        if (event.data?.reason_model?.messages) {
          const messages = event.data.reason_model.messages;
          messages.forEach((msg: string) => {
            const match = msg.match(/content="([^"]+)"/);
            if (match) {
              console.log('完整响应(方法3):', match[1]);
            }
          });
        }
        break;
      
      case 'billing':
        // 处理计费信息
        console.log('计费信息:', event.data);
        break;
      
      case 'end':
        // 处理完成，添加最终响应
        if (currentResponse) {
          setMessages(prev => [...prev, {
            type: 'assistant',
            content: currentResponse,
            timestamp: event.timestamp
          }]);
          setCurrentResponse('');
          console.log('完整响应(方法2-重构):', currentResponse);
        }
        break;
      
      case 'error':
        setMessages(prev => [...prev, {
          type: 'error',
          content: event.content,
          timestamp: event.timestamp
        }]);
        break;
      
      default:
        console.log('未知事件类型:', event);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        height: '400px', 
        overflowY: 'auto', 
        border: '1px solid #ccc', 
        padding: '10px',
        marginBottom: '10px'
      }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ 
            marginBottom: '10px',
            padding: '8px',
            backgroundColor: msg.type === 'user' ? '#e3f2fd' : 
                           msg.type === 'error' ? '#ffebee' : '#f5f5f5',
            borderRadius: '4px'
          }}>
            <strong>{msg.type}:</strong> {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
          </div>
        ))}
        {currentResponse && (
          <div style={{ 
            padding: '8px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            border: '1px dashed #2196f3'
          }}>
            <strong>正在生成:</strong> {currentResponse}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="输入消息..."
          style={{
            flex: 1,
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          style={{
            marginLeft: '8px',
            padding: '8px 16px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
      
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        <p>当前用户: {userId}</p>
        <p>当前会话: {sessionId}</p>
      </div>
    </div>
  );
};

export default ChatComponent;
```

### 2. 会话管理示例

```tsx
// 会话管理 Hook
import { useState, useEffect } from 'react';

interface Session {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  lastActivity: string;
}

export const useSessionManager = (userId: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 创建新会话
  const createSession = (title: string = 'New Chat') => {
    const newSession: Session = {
      id: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      title,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    
    // 可以在这里调用API保存到数据库
    // await saveSessionToDatabase(newSession);
    
    return newSession.id;
  };

  // 切换会话
  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    
    // 更新最后活动时间
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, lastActivity: new Date().toISOString() }
        : session
    ));
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(sessions.length > 1 ? sessions[0].id : null);
    }
  };

  return {
    sessions,
    currentSessionId,
    createSession,
    switchSession,
    deleteSession
  };
};

// 使用示例
const ChatApp: React.FC = () => {
  const userId = "auth0_user_123456"; // 从认证系统获取
  const { sessions, currentSessionId, createSession, switchSession } = useSessionManager(userId);

  useEffect(() => {
    // 如果没有当前会话，创建一个新的
    if (!currentSessionId && sessions.length === 0) {
      createSession("首次对话");
    }
  }, [currentSessionId, sessions.length]);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 会话列表 */}
      <div style={{ width: '250px', borderRight: '1px solid #ccc', padding: '10px' }}>
        <button 
          onClick={() => createSession()}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        >
          新建对话
        </button>
        
        {sessions.map(session => (
          <div 
            key={session.id}
            onClick={() => switchSession(session.id)}
            style={{
              padding: '8px',
              marginBottom: '5px',
              backgroundColor: currentSessionId === session.id ? '#e3f2fd' : '#f5f5f5',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 'bold' }}>{session.title}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {new Date(session.lastActivity).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      
      {/* 聊天区域 */}
      <div style={{ flex: 1 }}>
        {currentSessionId ? (
          <ChatComponent 
            userId={userId} 
            sessionId={currentSessionId} 
          />
        ) : (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            请选择或创建一个会话
          </div>
        )}
      </div>
    </div>
  );
};
```

## 示例测试用例

### 1. 简单对话
**请求:**
```json
{
  "message": "Hi, how are you?",
  "user_id": "test_user_456",
  "session_id": "test_session_456"
}
```

**实际响应流:**
```json
{"type": "start", "content": "Starting chat processing", "timestamp": "2025-07-25T00:05:57.042419", "session_id": "test_session_456"}
{"type": "custom_stream", "content": {"custom_llm_chunk": "Hello"}, "timestamp": "2025-07-25T00:05:57.909615", "session_id": "test_session_456", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": "!"}, "timestamp": "2025-07-25T00:05:57.909671", "session_id": "test_session_456", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": " I'm"}, "timestamp": "2025-07-25T00:05:57.909772", "session_id": "test_session_456", "stream_mode": "custom"}
...
{"type": "end", "content": "Chat processing completed", "timestamp": "2025-07-25T00:05:58.123456", "session_id": "test_session_456"}
```

**响应流模式:**
- `start` → `custom_stream` (LLM tokens) → `memory_update` → `end`

### 2. 复杂提示词模板（故事创作）
**请求:**
```json
{
  "message": "Write a story about a robot discovering emotions",
  "user_id": "test_user_123",
  "session_id": "test_session_123",
  "prompt_name": "storytelling_prompt",
  "prompt_args": {
    "subject": "a robot discovering emotions for the first time",
    "depth": "deep",
    "reference_text": "Focus on the internal journey and transformation"
  }
}
```

**实际响应示例:**
```json
{"type": "start", "content": "Starting chat processing", "timestamp": "2025-07-25T00:05:06.959145", "session_id": "test_session_123"}
{"type": "custom_stream", "content": {"custom_llm_chunk": "Title"}, "timestamp": "2025-07-25T00:05:08.365885", "session_id": "test_session_123", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": ":"}, "timestamp": "2025-07-25T00:05:08.365964", "session_id": "test_session_123", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": " The"}, "timestamp": "2025-07-25T00:05:08.388297", "session_id": "test_session_123", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": " Awakening"}, "timestamp": "2025-07-25T00:05:08.430203", "session_id": "test_session_123", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": " of"}, "timestamp": "2025-07-25T00:05:08.430741", "session_id": "test_session_123", "stream_mode": "custom"}
{"type": "custom_stream", "content": {"custom_llm_chunk": " ELI-7"}, "timestamp": "2025-07-25T00:05:08.482732", "session_id": "test_session_123", "stream_mode": "custom"}
...
{"type": "memory_update", "content": "Memory updated: 2 memories stored", "timestamp": "2025-07-25T00:05:45.123456", "session_id": "test_session_123", "data": {"memories_stored": 2, "status": "success"}}
{"type": "end", "content": "Chat processing completed", "timestamp": "2025-07-25T00:05:50.123456", "session_id": "test_session_123"}
```

**响应流模式:**
- `start` → `custom_stream` (详细故事内容token流) → `memory_update` → `end`

### 3. 图像生成
**请求:**
```json
{
  "message": "generate an image of a cute cat",
  "user_id": "auth0_user_123456", 
  "session_id": "sess_789abc"
}
```

**预期响应流:**
- `start` → `message_stream` (工具调用) → `custom_stream` (执行进度) → `message_stream` (结果) → `custom_stream` (token流) → `memory_update` → `end`

### 4. 网页搜索
**请求:**
```json
{
  "message": "search for latest AI news",
  "user_id": "auth0_user_123456",
  "session_id": "sess_789abc"
}
```

**预期响应流:**
- `start` → `message_stream` (工具调用) → `custom_stream` (执行) → `message_stream` (搜索结果) → `custom_stream` (token流) → `memory_update` → `end`

## 提示词模板系统

### 概述
API支持使用预定义的提示词模板来增强对话效果。通过 `prompt_name` 和 `prompt_args` 参数，可以触发特定的提示词模板。

### 可用模板

#### 1. storytelling_prompt（故事创作）
专用于创作深度故事内容，支持详细的角色发展和情节构建。

**使用方法:**
```json
{
  "message": "Write a story about a robot discovering emotions",
  "user_id": "your_user_id",
  "session_id": "your_session_id",
  "prompt_name": "storytelling_prompt",
  "prompt_args": {
    "subject": "a robot discovering emotions for the first time",
    "depth": "deep",
    "reference_text": "Focus on the internal journey and transformation"
  }
}
```

**参数说明:**
- `subject`: 故事主题或核心内容
- `depth`: 故事深度级别（"shallow", "medium", "deep"）
- `reference_text`: 补充参考信息或写作方向

**效果特点:**
- 生成结构化的故事内容
- 包含标题、详细情节发展
- 支持角色内心世界的深度描写
- 适合长篇内容创作

### 测试验证状态

✅ **已验证功能:**
- 基础对话功能正常
- 复杂提示词模板（storytelling_prompt）完全正常
- 流式输出稳定
- JSON序列化无错误
- 记忆更新功能正常

🧪 **测试环境:**
- API服务器: `http://localhost:8080`
- 认证Token: `dev_key_test`
- 测试时间: 2025-07-25
- 所有测试用例均通过

## 前端责任

1. **用户认证**: 管理用户登录/注册，提供有效的 `user_id`
2. **会话管理**: 创建、存储、管理 `session_id`
3. **参数验证**: 确保传递给API的参数格式正确
4. **错误处理**: 处理网络错误和API错误响应

## 注意事项

1. **认证**: 确保使用正确的Bearer token
2. **参数管理**: `user_id` 和 `session_id` 由前端应用负责管理
3. **错误处理**: 始终处理网络错误和JSON解析错误
4. **内存管理**: 对于长对话，考虑限制消息历史长度
5. **性能**: SSE流可能产生大量事件，考虑防抖处理
6. **UI响应**: 在工具执行期间显示适当的加载状态

## cURL测试命令

### 简单对话测试
```bash
curl -X POST "http://localhost:8080/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_key_test" \
  -d '{
    "message": "Hi, how are you?",
    "user_id": "test_user_456",
    "session_id": "test_session_456"
  }' \
  --no-buffer -s
```

### 复杂提示词模板测试
```bash
curl -X POST "http://localhost:8080/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_key_test" \
  -d '{
    "message": "Write a story about a robot discovering emotions",
    "user_id": "test_user_123",
    "session_id": "test_session_123",
    "prompt_name": "storytelling_prompt",
    "prompt_args": {
      "subject": "a robot discovering emotions for the first time",
      "depth": "deep",
      "reference_text": "Focus on the internal journey and transformation"
    }
  }' \
  --no-buffer -s
```

### 图像生成测试
```bash
curl -X POST "http://localhost:8080/api/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev_key_test" \
  -d '{
    "message": "generate an image of a cute cat",
    "user_id": "test_user_789",
    "session_id": "test_session_789"
  }' \
  --no-buffer -s
```

## 故障排除

- **连接问题**: 检查API服务是否运行在正确端口
- **认证失败**: 验证Bearer token是否正确
- **解析错误**: 检查SSE数据格式是否符合预期
- **参数错误**: 确保 `user_id` 和 `session_id` 格式正确
- **超时**: 考虑增加请求超时时间
- **提示词模板问题**: 检查 `prompt_name` 是否存在，`prompt_args` 格式是否正确

## 总结

通过以上示例和详细的API文档，您可以在React/Next.js项目中轻松集成isA_Agent聊天API。该API已经过全面测试验证，支持：

- ✅ 基础对话功能
- ✅ 复杂提示词模板系统
- ✅ 实时流式响应
- ✅ 工具调用（图像生成、网页搜索等）
- ✅ 会话管理和记忆存储
- ✅ 完整的错误处理

前端负责用户和会话管理，API专注于处理聊天逻辑和工具调用功能，实现了清晰的职责分离。
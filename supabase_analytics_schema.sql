-- ============================================================================
-- Supabase Analytics Schema - 用户行为数据分析表结构
-- ============================================================================
-- 用于存储来自 RudderStack 的用户行为事件数据
-- 优化查询性能和分析需求

-- 用户事件表 - 核心事件数据
CREATE TABLE user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 事件基础信息
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 用户标识
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_id VARCHAR(100),
    session_id VARCHAR(100),
    
    -- 事件属性 (JSON 存储灵活的事件数据)
    properties JSONB DEFAULT '{}',
    
    -- 页面和设备上下文
    page_url TEXT,
    page_path VARCHAR(500),
    page_title VARCHAR(200),
    referrer TEXT,
    
    -- 设备和环境信息
    user_agent TEXT,
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    screen_width INTEGER,
    screen_height INTEGER,
    
    -- 地理位置 (可选)
    country VARCHAR(2),
    region VARCHAR(100), 
    city VARCHAR(100),
    timezone VARCHAR(50),
    
    -- 创建和更新时间
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 索引提示
    CONSTRAINT valid_timestamp CHECK (timestamp <= NOW() + INTERVAL '1 hour')
);

-- 用户会话表 - 会话级别的聚合数据
CREATE TABLE user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- 用户信息
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_id VARCHAR(100),
    
    -- 会话时间
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ,
    session_duration INTEGER, -- 秒数
    
    -- 会话统计
    page_views INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    
    -- 会话上下文
    entry_page TEXT,
    exit_page TEXT,
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100), 
    utm_campaign VARCHAR(100),
    
    -- 设备信息
    device_type VARCHAR(20),
    browser VARCHAR(50),
    os VARCHAR(50),
    
    -- 会话质量指标
    bounce_rate DECIMAL(5,4), -- 跳出率
    engagement_score INTEGER, -- 1-10 参与度评分
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 聊天交互表 - 专门存储聊天相关数据
CREATE TABLE chat_interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 关联信息
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    
    -- 消息信息
    message_type VARCHAR(20) CHECK (message_type IN ('sent', 'received')),
    message_length INTEGER,
    message_id VARCHAR(100),
    
    -- 交互细节
    input_method VARCHAR(20), -- typing, paste, voice, drag_drop
    typing_duration INTEGER, -- 输入耗时(毫秒)
    thinking_time INTEGER, -- 思考时间(毫秒)
    revision_count INTEGER DEFAULT 0, -- 修改次数
    
    -- 智能模式设置
    intelligent_mode VARCHAR(20) CHECK (intelligent_mode IN ('reactive', 'collaborative', 'proactive')),
    
    -- Widget 上下文
    widget_type VARCHAR(50),
    widget_id VARCHAR(100),
    
    -- 时间戳
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widget 使用分析表
CREATE TABLE widget_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 用户和会话
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    
    -- Widget 信息
    widget_type VARCHAR(50) NOT NULL,
    widget_id VARCHAR(100),
    action VARCHAR(50), -- open, close, interact, hover, configure
    
    -- 交互详情
    interaction_type VARCHAR(20), -- click, hover, keyboard, touch
    duration INTEGER, -- 交互持续时间(毫秒)
    
    -- 位置和尺寸
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    
    -- 上下文
    source_widget VARCHAR(50), -- 从哪个widget切换过来
    target_widget VARCHAR(50), -- 切换到哪个widget
    
    -- 额外属性
    properties JSONB DEFAULT '{}',
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 性能监控表
CREATE TABLE performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 用户信息
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id VARCHAR(100),
    
    -- 性能指标
    metric_name VARCHAR(100) NOT NULL, -- page_load, api_response, input_lag 等
    duration INTEGER NOT NULL, -- 毫秒
    
    -- 上下文信息
    endpoint VARCHAR(200), -- API 端点
    method VARCHAR(10), -- HTTP 方法
    status_code INTEGER, -- 响应状态码
    
    -- 环境信息
    browser VARCHAR(50),
    device_type VARCHAR(20),
    network_type VARCHAR(20),
    
    -- 用户感知
    perceived_slow BOOLEAN DEFAULT FALSE, -- 用户是否感知到慢
    abandoned BOOLEAN DEFAULT FALSE, -- 是否因为慢而放弃操作
    
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 索引优化 - 提高查询性能
-- ============================================================================

-- 用户事件表索引
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_session_id ON user_events(session_id);
CREATE INDEX idx_user_events_event_name ON user_events(event_name);
CREATE INDEX idx_user_events_timestamp ON user_events(timestamp DESC);
CREATE INDEX idx_user_events_properties ON user_events USING GIN(properties);

-- 用户会话表索引
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_start ON user_sessions(session_start DESC);

-- 聊天交互表索引
CREATE INDEX idx_chat_interactions_user_id ON chat_interactions(user_id);
CREATE INDEX idx_chat_interactions_session_id ON chat_interactions(session_id);
CREATE INDEX idx_chat_interactions_timestamp ON chat_interactions(timestamp DESC);

-- Widget 分析表索引
CREATE INDEX idx_widget_analytics_user_id ON widget_analytics(user_id);
CREATE INDEX idx_widget_analytics_widget_type ON widget_analytics(widget_type);
CREATE INDEX idx_widget_analytics_timestamp ON widget_analytics(timestamp DESC);

-- 性能指标表索引
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX idx_performance_metrics_metric_name ON performance_metrics(metric_name);
CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp DESC);

-- ============================================================================
-- 行级安全策略 (RLS) - 数据安全
-- ============================================================================

-- 启用 RLS
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY; 
ALTER TABLE chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的数据
CREATE POLICY "Users can only access their own events" ON user_events
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own sessions" ON user_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own chat data" ON chat_interactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own widget data" ON widget_analytics
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own performance data" ON performance_metrics
    FOR ALL USING (auth.uid() = user_id);

-- 管理员可以访问所有数据 (可选)
-- CREATE POLICY "Admins can access all data" ON user_events
--     FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- 实用视图 - 简化常见查询
-- ============================================================================

-- 用户活动概览视图
CREATE VIEW user_activity_summary AS
SELECT 
    user_id,
    DATE(created_at) as activity_date,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(CASE WHEN event_name LIKE 'CHAT_%' THEN 1 END) as chat_events,
    COUNT(CASE WHEN event_name LIKE 'WIDGET_%' THEN 1 END) as widget_events,
    MIN(created_at) as first_activity,
    MAX(created_at) as last_activity
FROM user_events 
WHERE user_id IS NOT NULL
GROUP BY user_id, DATE(created_at);

-- 热门功能使用统计
CREATE VIEW feature_usage_stats AS
SELECT 
    event_name,
    COUNT(*) as usage_count,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(CASE 
        WHEN properties->>'duration' IS NOT NULL 
        THEN (properties->>'duration')::INTEGER 
    END) as avg_duration,
    DATE(created_at) as usage_date
FROM user_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY event_name, DATE(created_at)
ORDER BY usage_count DESC;

-- ============================================================================
-- 数据清理函数 - 定期清理过期数据
-- ============================================================================

-- 清理超过90天的事件数据
CREATE OR REPLACE FUNCTION cleanup_old_events()
RETURNS void AS $$
BEGIN
    DELETE FROM user_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM user_sessions 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM chat_interactions 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM widget_analytics 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 创建定期清理任务 (需要 pg_cron 扩展)
-- SELECT cron.schedule('cleanup_analytics', '0 2 * * *', 'SELECT cleanup_old_events();');
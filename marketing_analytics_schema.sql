-- =====================================================
-- Marketing Analytics Database Schema
-- =====================================================
-- 为营销阶段用户行为数据采集设计的表结构
-- 支持从匿名访客到注册用户的完整转化追踪

-- =====================================================
-- 1. 营销事件主表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.marketing_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 事件基础信息
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- 'pageview', 'interaction', 'conversion'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 用户标识 (匿名或已识别)
    anonymous_id VARCHAR(100),
    user_id VARCHAR(255) REFERENCES dev.users(user_id),
    session_id VARCHAR(100),
    
    -- 页面和内容信息
    page_name VARCHAR(100),
    page_url TEXT,
    page_title VARCHAR(200),
    referrer TEXT,
    
    -- UTM 营销归因参数
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- 事件特定属性
    properties JSONB DEFAULT '{}',
    
    -- 技术信息
    user_agent TEXT,
    ip_address INET,
    browser VARCHAR(50),
    os VARCHAR(50),
    device_type VARCHAR(20) CHECK (device_type IN ('desktop', 'tablet', 'mobile')),
    screen_width INTEGER,
    screen_height INTEGER,
    
    -- 地理位置
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_marketing_events_anonymous_id ON dev.marketing_events(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_user_id ON dev.marketing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_session_id ON dev.marketing_events(session_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_timestamp ON dev.marketing_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_marketing_events_utm_source ON dev.marketing_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_marketing_events_event_name ON dev.marketing_events(event_name);
CREATE INDEX IF NOT EXISTS idx_marketing_events_page_name ON dev.marketing_events(page_name);

-- =====================================================
-- 2. 用户归因表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.user_attribution (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES dev.users(user_id),
    anonymous_id VARCHAR(100) NOT NULL,
    
    -- 首次触点归因
    first_touch_channel VARCHAR(50),
    first_touch_source VARCHAR(100),
    first_touch_medium VARCHAR(100),
    first_touch_campaign VARCHAR(100),
    first_touch_content VARCHAR(100),
    first_touch_timestamp TIMESTAMP WITH TIME ZONE,
    first_touch_page VARCHAR(100),
    first_touch_utm JSONB,
    
    -- 最后触点归因
    last_touch_channel VARCHAR(50),
    last_touch_source VARCHAR(100),
    last_touch_medium VARCHAR(100),
    last_touch_campaign VARCHAR(100),
    last_touch_content VARCHAR(100),
    last_touch_timestamp TIMESTAMP WITH TIME ZONE,
    last_touch_page VARCHAR(100),
    last_touch_utm JSONB,
    
    -- 转化信息
    landing_page TEXT,
    conversion_timestamp TIMESTAMP WITH TIME ZONE,
    registration_method VARCHAR(50), -- 'email', 'google', 'github' etc.
    days_to_conversion INTEGER,
    hours_to_conversion INTEGER,
    touchpoint_count INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    page_view_count INTEGER DEFAULT 0,
    
    -- 转化路径 (存储完整的触点链)
    conversion_path TEXT[], -- ['organic/google', 'social/linkedin', 'direct']
    channel_sequence VARCHAR(500), -- 'organic -> social -> direct'
    
    -- 价值信息
    customer_lifetime_value DECIMAL(10,2),
    first_purchase_value DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_user_attribution_anonymous_id ON dev.user_attribution(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_user_attribution_first_touch_source ON dev.user_attribution(first_touch_source);
CREATE INDEX IF NOT EXISTS idx_user_attribution_conversion_timestamp ON dev.user_attribution(conversion_timestamp);

-- =====================================================
-- 3. 营销漏斗表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.marketing_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 用户标识
    anonymous_id VARCHAR(100),
    user_id VARCHAR(255) REFERENCES dev.users(user_id),
    session_id VARCHAR(100),
    
    -- 漏斗阶段
    stage VARCHAR(50) NOT NULL CHECK (stage IN (
        'visitor',           -- 访客 (首次访问)
        'engaged_visitor',   -- 互动访客 (多页浏览/长停留)
        'lead',             -- 潜在客户 (表单填写/内容下载)
        'qualified_lead',   -- 合格潜客 (产品演示/定价查看)
        'trial_user',       -- 试用用户 (注册账户)
        'paying_customer',  -- 付费客户
        'advocate'          -- 推荐者
    )),
    
    previous_stage VARCHAR(50),
    stage_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 转化信息
    converted BOOLEAN DEFAULT FALSE,
    conversion_trigger VARCHAR(100), -- 触发转化的具体行为
    conversion_time_seconds INTEGER, -- 在此阶段停留时间
    drop_off_reason VARCHAR(200),
    
    -- 关联信息
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    referrer TEXT,
    landing_page TEXT,
    
    -- 阶段特定数据
    stage_properties JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_marketing_funnel_anonymous_id ON dev.marketing_funnel(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_marketing_funnel_user_id ON dev.marketing_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_marketing_funnel_stage ON dev.marketing_funnel(stage);
CREATE INDEX IF NOT EXISTS idx_marketing_funnel_timestamp ON dev.marketing_funnel(stage_timestamp);

-- =====================================================
-- 4. 营销活动表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.marketing_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 活动信息
    campaign_name VARCHAR(200) NOT NULL,
    campaign_id VARCHAR(100) UNIQUE NOT NULL,
    campaign_type VARCHAR(50), -- 'paid_search', 'social', 'email', 'content', 'referral'
    
    -- UTM 标识
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    
    -- 活动时间
    start_date DATE,
    end_date DATE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    
    -- 预算和目标
    budget DECIMAL(10,2),
    target_audience TEXT,
    campaign_goals TEXT[],
    
    -- 元数据
    campaign_metadata JSONB DEFAULT '{}',
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_campaign_id ON dev.marketing_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_utm_source ON dev.marketing_campaigns(utm_source);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON dev.marketing_campaigns(status);

-- =====================================================
-- 5. A/B 测试表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.ab_tests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 测试信息
    test_name VARCHAR(200) NOT NULL,
    test_id VARCHAR(100) UNIQUE NOT NULL,
    hypothesis TEXT,
    test_type VARCHAR(50), -- 'page_variant', 'feature_flag', 'pricing', 'cta'
    
    -- 测试配置
    variants JSONB NOT NULL, -- [{"name": "control", "traffic": 50}, {"name": "variant_a", "traffic": 50}]
    traffic_allocation INTEGER DEFAULT 100, -- 参与测试的流量百分比
    
    -- 测试范围
    target_pages TEXT[],
    target_audience JSONB,
    
    -- 测试时间
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- 成功指标
    primary_metric VARCHAR(100), -- 'conversion_rate', 'signup_rate', 'revenue_per_visitor'
    secondary_metrics TEXT[],
    
    -- 状态和结果
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    winner_variant VARCHAR(100),
    confidence_level DECIMAL(5,2),
    test_results JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. A/B 测试参与表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.ab_test_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    test_id VARCHAR(100) REFERENCES dev.ab_tests(test_id),
    anonymous_id VARCHAR(100),
    user_id VARCHAR(255) REFERENCES dev.users(user_id),
    
    -- 参与信息
    variant_assigned VARCHAR(100) NOT NULL,
    assignment_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 转化信息
    converted BOOLEAN DEFAULT FALSE,
    conversion_timestamp TIMESTAMP WITH TIME ZONE,
    conversion_value DECIMAL(10,2),
    
    -- 会话信息
    session_id VARCHAR(100),
    first_exposure_page VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_ab_test_participations_test_id ON dev.ab_test_participations(test_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_participations_anonymous_id ON dev.ab_test_participations(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_ab_test_participations_user_id ON dev.ab_test_participations(user_id);

-- =====================================================
-- 7. 营销内容互动表
-- =====================================================
CREATE TABLE IF NOT EXISTS dev.content_engagement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 用户标识
    anonymous_id VARCHAR(100),
    user_id VARCHAR(255) REFERENCES dev.users(user_id),
    session_id VARCHAR(100),
    
    -- 内容信息
    content_type VARCHAR(50), -- 'blog_post', 'video', 'demo', 'whitepaper', 'webinar'
    content_id VARCHAR(100),
    content_title VARCHAR(300),
    content_category VARCHAR(100),
    
    -- 互动信息
    engagement_type VARCHAR(50), -- 'view', 'click', 'download', 'share', 'like', 'comment'
    engagement_value VARCHAR(200), -- 具体互动内容
    engagement_duration INTEGER, -- 互动持续时间(秒)
    
    -- 上下文信息
    page_url TEXT,
    referrer TEXT,
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100),
    
    -- 内容位置
    content_position VARCHAR(100), -- 'hero', 'sidebar', 'footer', 'inline'
    scroll_depth_percentage INTEGER,
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_content_engagement_anonymous_id ON dev.content_engagement(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_content_engagement_user_id ON dev.content_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_content_engagement_content_type ON dev.content_engagement(content_type);
CREATE INDEX IF NOT EXISTS idx_content_engagement_timestamp ON dev.content_engagement(timestamp);

-- =====================================================
-- 8. 创建视图用于分析
-- =====================================================

-- 营销漏斗转化率视图
CREATE OR REPLACE VIEW dev.marketing_funnel_conversion AS
SELECT 
    stage,
    COUNT(*) as total_users,
    COUNT(*) FILTER (WHERE converted = true) as converted_users,
    ROUND(
        COUNT(*) FILTER (WHERE converted = true) * 100.0 / NULLIF(COUNT(*), 0), 
        2
    ) as conversion_rate,
    AVG(conversion_time_seconds) as avg_time_in_stage
FROM dev.marketing_funnel
GROUP BY stage
ORDER BY 
    CASE stage 
        WHEN 'visitor' THEN 1
        WHEN 'engaged_visitor' THEN 2  
        WHEN 'lead' THEN 3
        WHEN 'qualified_lead' THEN 4
        WHEN 'trial_user' THEN 5
        WHEN 'paying_customer' THEN 6
        WHEN 'advocate' THEN 7
    END;

-- UTM 来源效果视图
CREATE OR REPLACE VIEW dev.utm_source_performance AS
SELECT 
    utm_source,
    utm_medium,
    utm_campaign,
    COUNT(DISTINCT anonymous_id) as unique_visitors,
    COUNT(*) as total_events,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) FILTER (WHERE event_name = 'user_registered') as conversions,
    ROUND(
        COUNT(*) FILTER (WHERE event_name = 'user_registered') * 100.0 / 
        NULLIF(COUNT(DISTINCT anonymous_id), 0), 
        2
    ) as conversion_rate
FROM dev.marketing_events
WHERE utm_source IS NOT NULL
GROUP BY utm_source, utm_medium, utm_campaign
ORDER BY conversions DESC;

-- 每日营销指标视图
CREATE OR REPLACE VIEW dev.daily_marketing_metrics AS
SELECT 
    DATE(timestamp) as date,
    COUNT(DISTINCT anonymous_id) as unique_visitors,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(*) FILTER (WHERE event_name = 'landing_page_entered') as landing_page_visits,
    COUNT(*) FILTER (WHERE event_name = 'cta_clicked') as cta_clicks,
    COUNT(*) FILTER (WHERE event_name = 'user_registered') as registrations,
    COUNT(*) FILTER (WHERE page_name = 'pricing') as pricing_page_views,
    ROUND(
        COUNT(*) FILTER (WHERE event_name = 'user_registered') * 100.0 / 
        NULLIF(COUNT(DISTINCT anonymous_id), 0), 
        2
    ) as visitor_to_registration_rate
FROM dev.marketing_events
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- =====================================================
-- 9. 数据库函数
-- =====================================================

-- 合并匿名用户数据到注册用户
CREATE OR REPLACE FUNCTION dev.merge_anonymous_to_user(
    p_anonymous_id VARCHAR(100),
    p_user_id VARCHAR(255)
) RETURNS VOID AS $$
BEGIN
    -- 更新营销事件表
    UPDATE dev.marketing_events 
    SET user_id = p_user_id 
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    
    -- 更新漏斗表
    UPDATE dev.marketing_funnel 
    SET user_id = p_user_id 
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    
    -- 更新内容互动表
    UPDATE dev.content_engagement 
    SET user_id = p_user_id 
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    
    -- 更新A/B测试参与表
    UPDATE dev.ab_test_participations 
    SET user_id = p_user_id 
    WHERE anonymous_id = p_anonymous_id AND user_id IS NULL;
    
END;
$$ LANGUAGE plpgsql;

-- 更新漏斗阶段
CREATE OR REPLACE FUNCTION dev.update_funnel_stage(
    p_anonymous_id VARCHAR(100),
    p_user_id VARCHAR(255),
    p_new_stage VARCHAR(50),
    p_trigger VARCHAR(100)
) RETURNS VOID AS $$
DECLARE
    current_stage VARCHAR(50);
BEGIN
    -- 获取当前最高阶段
    SELECT stage INTO current_stage
    FROM dev.marketing_funnel 
    WHERE (p_user_id IS NOT NULL AND user_id = p_user_id) 
       OR (p_user_id IS NULL AND anonymous_id = p_anonymous_id)
    ORDER BY 
        CASE stage 
            WHEN 'visitor' THEN 1
            WHEN 'engaged_visitor' THEN 2
            WHEN 'lead' THEN 3
            WHEN 'qualified_lead' THEN 4
            WHEN 'trial_user' THEN 5
            WHEN 'paying_customer' THEN 6
            WHEN 'advocate' THEN 7
        END DESC
    LIMIT 1;
    
    -- 如果新阶段更高级，则插入新记录
    IF current_stage IS NULL OR 
       (CASE p_new_stage 
            WHEN 'visitor' THEN 1
            WHEN 'engaged_visitor' THEN 2
            WHEN 'lead' THEN 3
            WHEN 'qualified_lead' THEN 4
            WHEN 'trial_user' THEN 5
            WHEN 'paying_customer' THEN 6
            WHEN 'advocate' THEN 7
        END) > 
       (CASE COALESCE(current_stage, 'visitor')
            WHEN 'visitor' THEN 1
            WHEN 'engaged_visitor' THEN 2
            WHEN 'lead' THEN 3
            WHEN 'qualified_lead' THEN 4
            WHEN 'trial_user' THEN 5
            WHEN 'paying_customer' THEN 6
            WHEN 'advocate' THEN 7
        END) THEN
        
        INSERT INTO dev.marketing_funnel (
            anonymous_id, user_id, stage, previous_stage, 
            conversion_trigger, converted
        ) VALUES (
            p_anonymous_id, p_user_id, p_new_stage, current_stage, 
            p_trigger, TRUE
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. 权限设置
-- =====================================================

-- 确保应用用户有适当权限
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA dev TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA dev TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA dev TO postgres;

-- 为只读分析用户创建权限
-- CREATE ROLE marketing_analyst;
-- GRANT CONNECT ON DATABASE postgres TO marketing_analyst;
-- GRANT USAGE ON SCHEMA dev TO marketing_analyst;
-- GRANT SELECT ON ALL TABLES IN SCHEMA dev TO marketing_analyst;

-- =====================================================
-- 11. 示例数据插入 (用于测试)
-- =====================================================

-- 插入示例营销活动
INSERT INTO dev.marketing_campaigns (
    campaign_name, campaign_id, campaign_type,
    utm_source, utm_medium, utm_campaign,
    start_date, end_date, budget, status
) VALUES 
    ('Google Search - AI Tools', 'google_search_ai_2024', 'paid_search',
     'google', 'cpc', 'ai_tools_search', 
     '2024-09-01', '2024-12-31', 5000.00, 'active'),
    ('LinkedIn Professional AI', 'linkedin_ai_pros_2024', 'social',
     'linkedin', 'social', 'ai_professionals',
     '2024-09-15', '2024-11-15', 3000.00, 'active');

-- 插入示例A/B测试
INSERT INTO dev.ab_tests (
    test_name, test_id, test_type, hypothesis,
    variants, target_pages, primary_metric, status
) VALUES (
    'Homepage Hero CTA Test', 'homepage_cta_test_2024', 'cta',
    'Changing CTA from "Get Started" to "Try Free Now" will increase signup rate',
    '[{"name": "control", "traffic": 50, "cta_text": "Get Started"}, {"name": "variant_a", "traffic": 50, "cta_text": "Try Free Now"}]',
    ARRAY['/', '/home'],
    'signup_rate', 'running'
);

COMMENT ON TABLE dev.marketing_events IS '营销事件主表 - 存储所有营销阶段的用户行为事件';
COMMENT ON TABLE dev.user_attribution IS '用户归因表 - 追踪用户从首次接触到转化的完整路径';
COMMENT ON TABLE dev.marketing_funnel IS '营销漏斗表 - 记录用户在不同漏斗阶段的进展';
COMMENT ON TABLE dev.marketing_campaigns IS '营销活动表 - 管理和追踪营销活动效果';
COMMENT ON TABLE dev.ab_tests IS 'A/B测试表 - 配置和管理A/B测试';
COMMENT ON TABLE dev.content_engagement IS '内容互动表 - 追踪用户与营销内容的互动行为';
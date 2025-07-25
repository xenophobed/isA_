#!/bin/bash
# Vercel Environment Variables Setup Script for isa project
echo "🔧 Setting up Vercel environment variables for project 'isa'..."

# Helper function to add environment variable
add_env() {
    local name=$1
    local value=$2
    echo "Adding $name..."
    echo "$value" | vercel env add "$name" production
}

# Auth0 认证
add_env "REACT_APP_AUTH0_DOMAIN" "dev-47zcqarlxizdkads.us.auth0.com"
add_env "REACT_APP_AUTH0_CLIENT_ID" "Vsm0s23JTKzDrq9bq0foKyYieOCyeoQJ"
add_env "REACT_APP_AUTH0_AUDIENCE" "https://dev-47zcqarlxizdkads.us.auth0.com/api/v2/"

# 应用 URL
add_env "REACT_APP_BASE_URL" "https://app.iapro.ai"

# 微服务架构 URLs
add_env "REACT_APP_AGENT_SERVICE_URL" "https://agent.iapro.ai:8080"
add_env "REACT_APP_MCP_SERVICE_URL" "https://mcp.iapro.ai:8081"
add_env "REACT_APP_MODEL_SERVICE_URL" "https://model.iapro.ai:8082"
add_env "REACT_APP_USER_SERVICE_URL" "https://mcp.iapro.ai:8100"

# 环境设置
add_env "NODE_ENV" "production"

# 应用信息
add_env "REACT_APP_NAME" "isA_"
add_env "REACT_APP_VERSION" "1.0.0"
add_env "REACT_APP_LOG_LEVEL" "warn"

# 功能开关
add_env "REACT_APP_ENABLE_AUTH" "true"
add_env "REACT_APP_ENABLE_FILE_UPLOAD" "true"
add_env "REACT_APP_ENABLE_REAL_TIME_CHAT" "true"
add_env "REACT_APP_ENABLE_WIDGETS" "true"
add_env "REACT_APP_ENABLE_DEBUG_MODE" "false"
add_env "REACT_APP_ENABLE_LOGGING_DASHBOARD" "false"

# API 设置
add_env "REACT_APP_API_TIMEOUT" "30000"
add_env "REACT_APP_API_RETRIES" "3"
add_env "REACT_APP_MAX_FILE_SIZE" "10485760"
add_env "REACT_APP_SUPPORTED_FILE_TYPES" "jpg,jpeg,png,pdf,txt,md,json"

# 外部 API
add_env "REACT_APP_IMAGE_SERVICE_URL" "https://api.replicate.com"
add_env "REACT_APP_CONTENT_SERVICE_URL" "https://api.openai.com"

echo "✅ All environment variables have been configured for production!"
echo "🚀 You can now deploy with 'vercel --prod'"
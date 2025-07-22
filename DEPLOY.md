# Vercel 部署指南

这个应用已针对 Vercel 部署进行优化。

## 🚀 快速部署

### 1. 连接 Git 仓库
将项目推送到 GitHub/GitLab/Bitbucket，然后在 Vercel 中导入。

### 2. 配置环境变量
在 Vercel Dashboard 中设置以下环境变量：

#### 生产环境 (Production)
```
REACT_APP_API_ENDPOINT=https://your-api-domain.com
REACT_APP_LOG_LEVEL=warn
REACT_APP_ENABLE_LOGGING_DASHBOARD=false
REACT_APP_ENABLE_DEBUG_MODE=false
```

#### 预览环境 (Preview)
```
REACT_APP_API_ENDPOINT=https://your-staging-api-domain.com
REACT_APP_LOG_LEVEL=info
REACT_APP_ENABLE_LOGGING_DASHBOARD=true
REACT_APP_ENABLE_DEBUG_MODE=true
```

#### 开发环境 (Development)
```
REACT_APP_API_ENDPOINT=http://localhost:8080
REACT_APP_LOG_LEVEL=debug
REACT_APP_ENABLE_LOGGING_DASHBOARD=true
REACT_APP_ENABLE_DEBUG_MODE=true
```

## 📝 配置说明

### vercel.json 配置
项目包含已优化的 `vercel.json` 配置：

- **缓存优化**: 静态资源缓存1年
- **安全头**: 包含安全相关的HTTP头
- **函数配置**: API路由30秒超时
- **环境变量**: 自动注入构建时变量

### 性能优化
1. **静态资源缓存**: `_next/static/*` 文件缓存1年
2. **安全头**: 包含 XSS、内容类型嗅探保护
3. **日志控制**: 生产环境只输出warn/error级别日志
4. **组件优化**: 使用 React.memo 和 hooks 优化

## 🔧 本地开发

1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

## 🚀 部署流程

### 自动部署
- 推送到 `main` 分支 → 自动部署到生产环境
- 推送到其他分支 → 自动部署到预览环境

### 手动部署
```bash
# 使用 Vercel CLI
npx vercel --prod
```

## 📊 监控和调试

### 生产环境监控
- Vercel 自动提供性能监控
- 错误日志通过 Vercel Functions 收集
- 实时性能指标在 Vercel Dashboard 查看

### 调试模式
在预览环境中启用调试模式：
- 设置 `REACT_APP_ENABLE_DEBUG_MODE=true`
- 设置 `REACT_APP_ENABLE_LOGGING_DASHBOARD=true`

## 🔒 安全注意事项

1. **API端点**: 确保API服务器配置正确的CORS
2. **环境变量**: 敏感信息只在Vercel Dashboard中配置
3. **安全头**: 已配置防XSS、内容类型嗅探等保护

## 📋 检查清单

部署前确保：

- [ ] API服务器已部署并可访问
- [ ] 环境变量已在Vercel中配置
- [ ] CORS已在API服务器中正确配置
- [ ] 静态资源路径正确
- [ ] 生产环境测试通过

## 🔗 相关链接

- [Vercel 文档](https://vercel.com/docs)
- [Next.js 部署](https://nextjs.org/docs/deployment)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)
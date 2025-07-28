/**
 * ============================================================================
 * Component Demo - 演示和测试新的通用组件
 * ============================================================================
 * 
 * 这个组件用于验证新的 ContentRenderer 和 StatusRenderer 组件
 * 可以在开发过程中快速测试各种场景和配置
 */

import React, { useState } from 'react';
import { 
  ContentRenderer, 
  StatusRenderer, 
  Button,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  DangerButton,
  IconButton,
  LinkButton,
  InputGroup,
  TextAreaGroup,
  Modal,
  ConfirmModal,
  ImageModal,
  modal,
  ToastProvider,
  useToast,
  toast
} from '../index';

// 内部组件，使用Toast
const ComponentDemoContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'content' | 'status' | 'button' | 'input' | 'modal' | 'toast'>('content');
  const [contentType, setContentType] = useState<'markdown' | 'text' | 'image' | 'code'>('markdown');
  const [statusType, setStatusType] = useState<'loading' | 'processing' | 'success' | 'error'>('loading');
  const [progress, setProgress] = useState(45);
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  
  // Toast hook
  const { addToast } = useToast();

  // 示例内容
  const sampleContents = {
    markdown: `# Hello World

这是一个 **markdown** 示例，包含：

- 列表项 1
- 列表项 2
- [链接示例](https://example.com)

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

> 这是一个引用块

## 表格示例

| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |
| 数据4 | 数据5 | 数据6 |`,

    text: '这是一段普通文本内容，用于测试文本渲染功能。它包含多行内容，可以测试换行和长文本的处理。',

    image: 'https://picsum.photos/400/300',

    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">组件演示</h1>
        
        {/* 标签切换 */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setCurrentTab('content')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'content' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            ContentRenderer
          </button>
          <button
            onClick={() => setCurrentTab('status')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'status' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            StatusRenderer
          </button>
          <button
            onClick={() => setCurrentTab('button')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'button' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            Button
          </button>
          <button
            onClick={() => setCurrentTab('input')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'input' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            InputGroup
          </button>
          <button
            onClick={() => setCurrentTab('modal')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'modal' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            Modal
          </button>
          <button
            onClick={() => setCurrentTab('toast')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              currentTab === 'toast' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            Toast
          </button>
        </div>

        {/* ContentRenderer 演示 */}
        {currentTab === 'content' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">ContentRenderer 演示</h2>
              
              {/* 控制面板 */}
              <div className="mb-6 flex gap-4">
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value as any)}
                  className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded"
                >
                  <option value="markdown">Markdown</option>
                  <option value="text">Text</option>
                  <option value="image">Image</option>
                  <option value="code">Code</option>
                </select>
              </div>

              {/* 不同变体演示 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chat 变体 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Chat 变体</h3>
                  <div className="bg-gray-700 p-4 rounded">
                    <ContentRenderer
                      content={sampleContents[contentType]}
                      type={contentType}
                      variant="chat"
                      features={{
                        markdown: true,
                        copyButton: true,
                        imagePreview: true,
                        truncate: contentType === 'text' ? 100 : undefined
                      }}
                      onAction={(action, data) => console.log('Chat action:', action, data)}
                    />
                  </div>
                </div>

                {/* Widget 变体 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Widget 变体</h3>
                  <ContentRenderer
                    content={sampleContents[contentType]}
                    type={contentType}
                    variant="widget"
                    features={{
                      markdown: true,
                      copyButton: true,
                      saveButton: contentType === 'image',
                      imagePreview: true
                    }}
                    onAction={(action, data) => console.log('Widget action:', action, data)}
                  />
                </div>

                {/* Artifact 变体 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Artifact 变体</h3>
                  <ContentRenderer
                    content={sampleContents[contentType]}
                    type={contentType}
                    variant="artifact"
                    features={{
                      markdown: true,
                      copyButton: true,
                      saveButton: true,
                      expandButton: true,
                      truncate: 200
                    }}
                    onAction={(action, data) => console.log('Artifact action:', action, data)}
                  />
                </div>

                {/* Inline 变体 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Inline 变体</h3>
                  <div className="bg-gray-700 p-4 rounded">
                    这是一段文本，包含内联内容：
                    <ContentRenderer
                      content={contentType === 'text' ? '内联文本示例' : sampleContents[contentType]}
                      type={contentType}
                      variant="inline"
                      size="sm"
                      features={{
                        markdown: contentType === 'markdown',
                        truncate: 50
                      }}
                    />
                    继续文本。
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* StatusRenderer 演示 */}
        {currentTab === 'status' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">StatusRenderer 演示</h2>
              
              {/* 控制面板 */}
              <div className="mb-6 flex gap-4">
                <select
                  value={statusType}
                  onChange={(e) => setStatusType(e.target.value as any)}
                  className="bg-white/10 border border-white/20 text-white px-3 py-2 rounded"
                >
                  <option value="loading">Loading</option>
                  <option value="processing">Processing</option>
                  <option value="generating">Generating</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-white">{progress}%</span>
              </div>

              {/* 不同变体演示 */}
              <div className="space-y-6">
                {/* Inline 变体 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Inline 变体</h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded flex items-center gap-4">
                    <StatusRenderer
                      status={statusType}
                      message={`This is ${statusType} status`}
                      variant="inline"
                      showProgress={true}
                      progress={progress}
                    />
                  </div>
                </div>

                {/* Avatar-side 变体 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Avatar-side 变体</h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
                      AI
                    </div>
                    <StatusRenderer
                      status={statusType}
                      message={`${statusType.charAt(0).toUpperCase() + statusType.slice(1)}...`}
                      variant="avatar-side"
                      size="sm"
                    />
                  </div>
                </div>

                {/* Widget-header 变体 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Widget-header 变体</h3>
                  <div className="bg-white/5 border border-white/10 rounded">
                    <StatusRenderer
                      status={statusType}
                      message={`Widget is ${statusType}`}
                      variant="widget-header"
                      showProgress={true}
                      progress={progress}
                    />
                    <div className="p-4 text-white">
                      Widget content area...
                    </div>
                  </div>
                </div>

                {/* Minimal 变体 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Minimal 变体</h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded">
                    正在处理您的请求 
                    <StatusRenderer
                      status={statusType}
                      variant="minimal"
                      size="xs"
                    />
                    请稍候...
                  </div>
                </div>

                {/* Floating 变体 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">Floating 变体</h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded relative h-32">
                    <p className="text-white">这是主要内容区域...</p>
                    <StatusRenderer
                      status={statusType}
                      message="Operation in progress"
                      variant="floating"
                      showProgress={true}
                      progress={progress}
                    />
                  </div>
                </div>

                {/* 不同尺寸对比 */}
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-white">尺寸对比</h3>
                  <div className="bg-white/5 border border-white/10 p-4 rounded space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-white w-8">XS:</span>
                      <StatusRenderer status={statusType} variant="inline" size="xs" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white w-8">SM:</span>
                      <StatusRenderer status={statusType} variant="inline" size="sm" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white w-8">MD:</span>
                      <StatusRenderer status={statusType} variant="inline" size="md" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white w-8">LG:</span>
                      <StatusRenderer status={statusType} variant="inline" size="lg" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Button 演示 */}
        {currentTab === 'button' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Button 演示</h2>
              
              {/* 基础按钮变体 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">按钮变体</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton>Primary</PrimaryButton>
                    <SecondaryButton>Secondary</SecondaryButton>
                    <SuccessButton>Success</SuccessButton>
                    <DangerButton>Danger</DangerButton>
                    <Button variant="warning">Warning</Button>
                    <Button variant="ghost">Ghost</Button>
                    <LinkButton>Link</LinkButton>
                  </div>
                </div>

                {/* 按钮尺寸 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">按钮尺寸</h3>
                  <div className="flex items-center gap-4">
                    <PrimaryButton size="xs">Extra Small</PrimaryButton>
                    <PrimaryButton size="sm">Small</PrimaryButton>
                    <PrimaryButton size="md">Medium</PrimaryButton>
                    <PrimaryButton size="lg">Large</PrimaryButton>
                    <PrimaryButton size="xl">Extra Large</PrimaryButton>
                  </div>
                </div>

                {/* 图标按钮 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">图标按钮</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton icon={<span>🔍</span>}>搜索</PrimaryButton>
                    <SecondaryButton icon={<span>📝</span>} iconPosition="right">编辑</SecondaryButton>
                    <IconButton icon={<span>❌</span>} size="sm" />
                    <IconButton icon={<span>✅</span>} size="md" />
                    <IconButton icon={<span>🔄</span>} size="lg" />
                  </div>
                </div>

                {/* 按钮状态 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">按钮状态</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton>正常状态</PrimaryButton>
                    <PrimaryButton loading loadingText="加载中...">加载状态</PrimaryButton>
                    <PrimaryButton disabled>禁用状态</PrimaryButton>
                    <PrimaryButton state="pressed">按下状态</PrimaryButton>
                  </div>
                </div>

                {/* 特殊样式 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">特殊样式</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <PrimaryButton rounded>圆角按钮</PrimaryButton>
                      <SecondaryButton elevated>提升效果</SecondaryButton>
                    </div>
                    <div>
                      <PrimaryButton fullWidth>全宽按钮</PrimaryButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* InputGroup 演示 */}
        {currentTab === 'input' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">InputGroup 演示</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 基础输入框 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white">基础输入框</h3>
                  
                  <InputGroup
                    label="用户名"
                    placeholder="请输入用户名"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    helperText="用户名长度应在3-20个字符之间"
                    clearable
                    onClear={() => setInputValue('')}
                  />

                  <InputGroup
                    label="邮箱地址"
                    type="email"
                    placeholder="example@domain.com"
                    leftIcon={<span>📧</span>}
                    variant="filled"
                  />

                  <InputGroup
                    label="密码"
                    type="password"
                    placeholder="请输入密码"
                    showPasswordToggle
                    rightIcon={<span>🔒</span>}
                    variant="outlined"
                  />

                  <InputGroup
                    label="搜索"
                    placeholder="搜索内容..."
                    leftIcon={<span>🔍</span>}
                    variant="underlined"
                    clearable
                  />
                </div>

                {/* 不同状态和尺寸 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-white">状态和尺寸</h3>
                  
                  <InputGroup
                    label="成功状态"
                    placeholder="输入正确"
                    state="success"
                    helperText="验证通过"
                    size="sm"
                  />

                  <InputGroup
                    label="错误状态"
                    placeholder="输入错误"
                    state="error"
                    errorText="该字段为必填项"
                    size="md"
                  />

                  <InputGroup
                    label="警告状态"
                    placeholder="需要注意"
                    state="warning"
                    helperText="建议修改此内容"
                    size="lg"
                  />

                  <InputGroup
                    label="禁用状态"
                    placeholder="无法输入"
                    disabled
                    value="禁用的输入框"
                  />
                </div>

                {/* 文本域 */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-lg font-medium text-white">文本域</h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TextAreaGroup
                      label="普通文本域"
                      placeholder="请输入多行文本..."
                      value={textAreaValue}
                      onChange={(e) => setTextAreaValue(e.target.value)}
                      helperText="最多输入500个字符"
                      rows={4}
                    />

                    <TextAreaGroup
                      label="自动调整高度"
                      placeholder="文本域会自动调整高度..."
                      autoResize
                      variant="filled"
                      rows={2}
                    />

                    <TextAreaGroup
                      label="圆角文本域"
                      placeholder="圆角样式..."
                      variant="outlined"
                      rounded
                      resize="none"
                      rows={3}
                    />

                    <TextAreaGroup
                      label="下划线样式"
                      placeholder="下划线样式文本域..."
                      variant="underlined"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal 演示 */}
        {currentTab === 'modal' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Modal 演示</h2>
              
              <div className="space-y-6">
                {/* 基础弹窗 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">基础弹窗</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton onClick={() => setShowModal(true)}>
                      基础弹窗
                    </PrimaryButton>
                    <SecondaryButton onClick={() => setShowConfirmModal(true)}>
                      确认弹窗
                    </SecondaryButton>
                    <SuccessButton onClick={() => setShowImageModal(true)}>
                      图片预览
                    </SuccessButton>
                  </div>
                </div>

                {/* 不同尺寸 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">不同尺寸</h3>
                  <div className="flex flex-wrap gap-4">
                    {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => (
                      <Button
                        key={size}
                        variant="secondary"
                        onClick={() => {
                          setShowModal(true);
                        }}
                      >
                        {size.toUpperCase()} 尺寸
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 预设弹窗类型 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">快捷方法</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      variant="ghost" 
                      onClick={() => addToast(toast.info('这是一个信息提示'))}
                    >
                      信息弹窗
                    </Button>
                    <SuccessButton 
                      onClick={() => addToast(toast.success('操作成功！'))}
                    >
                      成功弹窗
                    </SuccessButton>
                    <Button 
                      variant="warning" 
                      onClick={() => addToast(toast.warning('请注意这个警告'))}
                    >
                      警告弹窗
                    </Button>
                    <DangerButton 
                      onClick={() => addToast(toast.error('发生了错误'))}
                    >
                      错误弹窗
                    </DangerButton>
                  </div>
                </div>
              </div>

              {/* 基础Modal */}
              <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="示例弹窗"
                footer={
                  <div className="flex gap-3 justify-end">
                    <SecondaryButton onClick={() => setShowModal(false)}>
                      取消
                    </SecondaryButton>
                    <PrimaryButton onClick={() => setShowModal(false)}>
                      确认
                    </PrimaryButton>
                  </div>
                }
              >
                <div className="space-y-4">
                  <p className="text-white/90">
                    这是一个基础的Modal弹窗示例。您可以在这里放置任何内容。
                  </p>
                  <InputGroup
                    label="示例输入"
                    placeholder="在弹窗中输入内容..."
                    fullWidth
                  />
                </div>
              </Modal>

              {/* 确认Modal */}
              <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                title="确认操作"
                content="您确定要执行这个操作吗？此操作不可撤销。"
                onOk={async () => {
                  // 模拟异步操作
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  addToast(toast.success('操作成功完成！'));
                }}
                onCancel={() => {
                  addToast(toast.info('操作已取消'));
                }}
              />

              {/* 图片预览Modal */}
              <ImageModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                src="https://picsum.photos/800/600"
                alt="示例图片"
              />
            </div>
          </div>
        )}

        {/* Toast 演示 */}
        {currentTab === 'toast' && (
          <div className="space-y-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Toast 演示</h2>
              
              <div className="space-y-6">
                {/* 基础通知 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">基础通知</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton 
                      onClick={() => addToast(toast.info('这是一个信息通知'))}
                    >
                      信息通知
                    </PrimaryButton>
                    <SuccessButton 
                      onClick={() => addToast(toast.success('操作成功完成！'))}
                    >
                      成功通知
                    </SuccessButton>
                    <Button 
                      variant="warning"
                      onClick={() => addToast(toast.warning('请注意这个警告信息'))}
                    >
                      警告通知
                    </Button>
                    <DangerButton 
                      onClick={() => addToast(toast.error('发生了一个错误'))}
                    >
                      错误通知
                    </DangerButton>
                    <Button 
                      variant="ghost"
                      onClick={() => addToast(toast.loading('正在处理中...'))}
                    >
                      加载通知
                    </Button>
                  </div>
                </div>

                {/* 带标题的通知 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">带标题通知</h3>
                  <div className="flex flex-wrap gap-4">
                    <PrimaryButton 
                      onClick={() => addToast({
                        type: 'success',
                        title: '文件上传成功',
                        message: '您的文件已成功上传到服务器。'
                      })}
                    >
                      带标题
                    </PrimaryButton>
                    <SecondaryButton 
                      onClick={() => addToast({
                        type: 'info',
                        title: '系统更新',
                        message: '新版本已发布，建议您尽快更新。',
                        action: {
                          label: '立即更新',
                          onClick: () => addToast(toast.success('开始更新...'))
                        }
                      })}
                    >
                      带操作按钮
                    </SecondaryButton>
                  </div>
                </div>

                {/* 不同位置 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">不同位置</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'] as const).map(position => (
                      <Button
                        key={position}
                        variant="secondary"
                        size="sm"
                        onClick={() => addToast({
                          type: 'info',
                          message: `${position} 位置通知`,
                          position
                        })}
                      >
                        {position}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 自定义持续时间 */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4">自定义持续时间</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => addToast({
                        type: 'info',
                        message: '1秒后消失',
                        duration: 1000
                      })}
                    >
                      1秒
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => addToast({
                        type: 'warning',
                        message: '5秒后消失',
                        duration: 5000
                      })}
                    >
                      5秒
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => addToast({
                        type: 'error',
                        message: '不会自动消失',
                        duration: 0
                      })}
                    >
                      持久显示
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 外层组件，提供Toast Provider
export const ComponentDemo: React.FC = () => {
  return (
    <ToastProvider>
      <ComponentDemoContent />
    </ToastProvider>
  );
};

export default ComponentDemo;
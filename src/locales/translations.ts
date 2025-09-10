/**
 * ============================================================================
 * Translations (translations.ts) - 多语言文本配置
 * ============================================================================
 * 
 * Core Responsibilities:
 * - 定义所有支持语言的文本翻译
 * - 提供类型安全的翻译键
 * - 支持嵌套的翻译结构
 * - 支持变量插值
 */

import { SupportedLanguage } from '../stores/useLanguageStore';

// ================================================================================
// Translation Types
// ================================================================================

export interface Translations {
  // Common UI elements
  common: {
    save: string;
    cancel: string;
    ok: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    retry: string;
    refresh: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    clear: string;
    select: string;
    create: string;
    delete: string;
    edit: string;
    update: string;
    submit: string;
    confirm: string;
    dismiss: string;
    enable: string;
    disable: string;
    send: string;
    upload: string;
    download: string;
  };
  
  // Navigation and menu items
  navigation: {
    account: string;
    billing: string;
    usage: string;
    organizations: string;
    preferences: string;
  };
  
  // User profile and authentication
  user: {
    profile: string;
    signIn: string;
    signOut: string;
    signUp: string;
    refreshAccount: string;
    upgradePlan: string;
    credits: string;
    plan: string;
    noCreditsRemaining: string;
    upgradeTocontinue: string;
    unknownUser: string;
    noEmail: string;
    accountInformation: string;
    userId: string;
    email: string;
    name: string;
    refreshing: string;
    refreshAccountData: string;
  };
  
  // Preferences page
  preferences: {
    title: string;
    subtitle: string;
    
    // Language settings section
    language: {
      title: string;
      description: string;
      current: string;
      selectLanguage: string;
    };
    
    // Theme settings (future expansion)
    theme: {
      title: string;
      description: string;
      light: string;
      dark: string;
      system: string;
    };
    
    // Notification settings (future expansion)
    notifications: {
      title: string;
      description: string;
      email: string;
      push: string;
      sms: string;
    };
  };

  // Credits and billing
  credits: {
    creditsLeft: string;
    totalCredits: string;
    creditsUsed: string;
    creditsRemaining: string;
    usageRate: string;
    usageProgress: string;
    comingSoon: string;
  };

  // Login and authentication
  auth: {
    signIn: string;
    signOut: string;
    signUp: string;
    signInToContinue: string;
    secureAuthentication: string;
    welcomeBack: string;
    loginRequired: string;
  };

  // Chat and messaging
  chat: {
    welcome: string;
    startConversation: string;
    typeMessage: string;
    sendMessage: string;
    newChat: string;
    clearChat: string;
    chatHistory: string;
    noMessages: string;
    thinking: string;
    generating: string;
    
    // Welcome page
    welcomeTitle: string;
    welcomeSubtitle: string;
    tipText: string;
    
    // Example prompts
    examplePrompts: {
      createLogo: string;
      debugCode: string;
      analyzeData: string;
      explainQuantum: string;
    };
    
    // Widget descriptions
    widgetDescriptions: {
      creative: string;
      search: string;
      image: string;
      knowledge: string;
    };
    
    // Widget prompts
    widgetPrompts: {
      creative: string;
      search: string;
      image: string;
      knowledge: string;
    };
  };

  // Widgets and AI features
  widgets: {
    dreamforge: string;
    huntai: string;
    omnicontent: string;
    datawise: string;
    knowledgehub: string;
    assistant: string;
    selectWidget: string;
    widgetSelector: string;
    availableWidgets: string;
  };

  // Tasks and progress
  tasks: {
    tasks: string;
    taskProgress: string;
    completed: string;
    inProgress: string;
    pending: string;
    failed: string;
    taskList: string;
    noTasks: string;
  };

  // Organizations
  organizations: {
    createOrganization: string;
    inviteMember: string;
    organizationName: string;
    memberRole: string;
    owner: string;
    admin: string;
    member: string;
    switchToPersonal: string;
    switchToOrganization: string;
    yourOrganizations: string;
    noOrganizations: string;
  };

  // App features
  app: {
    appName: string;
    tagline: string;
    description: string;
    features: {
      imageGeneration: string;
      smartChat: string;
      dataAnalysis: string;
      aiSearch: string;
    };
  };
  
  // Error messages
  errors: {
    generic: string;
    networkError: string;
    authenticationRequired: string;
    unauthorized: string;
    notFound: string;
    serverError: string;
  };
  
  // Widget selector
  widgetSelector: {
    title: string;
    defaultTab: string;
    customTab: string;
    noWidgetsTitle: string;
    noDefaultWidgets: string;
    noCustomWidgets: string;
    tipText: string;
    modeSelector: {
      chooseMode: string;
      halfScreen: string;
      fullScreen: string;
      chatPluginMode: string;
      standaloneMode: string;
      cancel: string;
    };
  };
  
  // Widget names and descriptions
  widgetInfo: {
    dream: {
      name: string;
      description: string;
    };
    hunt: {
      name: string;
      description: string;
    };
    omni: {
      name: string;
      description: string;
    };
    dataScientist: {
      name: string;
      description: string;
    };
    knowledge: {
      name: string;
      description: string;
    };
    automation: {
      name: string;
      description: string;
    };
    customAutomation: {
      name: string;
      description: string;
    };
  };

  // Widget specific translations
  dreamWidget: {
    modes: {
      textToImage: {
        name: string;
        description: string;
        useCase: string;
      };
      imageToImage: {
        name: string;
        description: string;
        useCase: string;
      };
      styleTransfer: {
        name: string;
        description: string;
        useCase: string;
      };
      stickerGeneration: {
        name: string;
        description: string;
        useCase: string;
      };
      faceSwap: {
        name: string;
        description: string;
        useCase: string;
      };
      professionalHeadshot: {
        name: string;
        description: string;
        useCase: string;
      };
      photoInpainting: {
        name: string;
        description: string;
        useCase: string;
      };
      photoOutpainting: {
        name: string;
        description: string;
        useCase: string;
      };
      emojiGeneration: {
        name: string;
        description: string;
        useCase: string;
      };
    };
    ui: {
      uploadImage: string;
      selectMode: string;
      generateImage: string;
      clearImage: string;
      downloadImage: string;
      shareImage: string;
      noImageSelected: string;
      generateButton: string;
      placeholderText: string;
      placeholderImage: string;
    };
  };

  // Custom Automation Widget translations
  customAutomationWidget: {
    ui: {
      title: string;
      selectTemplate: string;
      templateSelection: string;
      templateSelectionDesc: string;
      configuration: string;
      processSteps: string;
      parameterConfig: string;
      modernView: string;
      classicForm: string;
      startAutomation: string;
      backToSelection: string;
      automationRunning: string;
      automationRunningDesc: string;
      automationCompleted: string;
      automationCompletedDesc: string;
      interventionAllowed: string;
      complexity: {
        simple: string;
        moderate: string;
        complex: string;
      };
      status: {
        pending: string;
        running: string;
        completed: string;
        error: string;
        manual_review: string;
      };
      templates: {
        dataEtl: {
          name: string;
          description: string;
          steps: {
            extract: string;
            transform: string;
            load: string;
          };
          inputs: {
            sourceDb: string;
            targetFormat: string;
            batchSize: string;
          };
        };
        contentWorkflow: {
          name: string;
          description: string;
          steps: {
            create: string;
            review: string;
            publish: string;
          };
          inputs: {
            contentType: string;
            targetChannels: string;
            autoSchedule: string;
          };
        };
        apiIntegration: {
          name: string;
          description: string;
          steps: {
            configure: string;
            map: string;
            test: string;
            sync: string;
          };
          inputs: {
            apiEndpoint: string;
            authMethod: string;
            syncFrequency: string;
          };
        };
      };
      validation: {
        required: string;
        minValue: string;
        maxValue: string;
        invalidFormat: string;
      };
      actions: {
        copy: string;
        download: string;
        share: string;
        refresh: string;
        clear: string;
        manageTemplates: string;
      };
    };
  };
  
  // Task management
  tasks: {
    management: string;
    total: string;
    active: string;
    completed: string;
    failed: string;
    pauseAll: string;
    cancelAll: string;
    filters: {
      all: string;
      active: string;
      completed: string;
      failedCancelled: string;
    };
    sorting: {
      created: string;
      updated: string;
      priority: string;
      status: string;
    };
    showingTasks: string;
    noTasks: string;
    statuses: {
      pending: string;
      starting: string;
      running: string;
      paused: string;
      resuming: string;
      completed: string;
      failed: string;
      cancelled: string;
      interrupted: string;
    };
    actions: {
      start: string;
      pause: string;
      resume: string;
      cancel: string;
      retry: string;
      delete: string;
    };
    progress: {
      step: string;
      of: string;
      estimated: string;
      remaining: string;
    };
  };
  
  // Organization management
  organization: {
    title: string;
    create: string;
    createNew: string;
    name: string;
    description: string;
    domain: string;
    domainOptional: string;
    billingEmail: string;
    plan: string;
    plans: {
      startup: string;
      business: string;
      enterprise: string;
    };
    members: string;
    settings: string;
    inviteMembers: string;
    memberCount: string;
    role: string;
    roles: {
      owner: string;
      admin: string;
      member: string;
      viewer: string;
    };
    actions: {
      invite: string;
      remove: string;
      changeRole: string;
      resendInvite: string;
    };
    validation: {
      nameRequired: string;
      emailInvalid: string;
      domainInvalid: string;
    };
  };
  
  // Session management
  sessions: {
    title: string;
    newChat: string;
    new: string;
    newSession: string;
    deleteSession: string;
    renameSession: string;
    confirmDelete: string;
    enterNewName: string;
    noSessions: string;
    loadingSessions: string;
    currentSession: string;
    sessionCount: string;
    untitledSession: string;
    noMessages: string;
    errorLoadingMessage: string;
    today: string;
    yesterday: string;
    daysAgo: string;
    messageCount: string;
    newSession: string;
  };
  
  // Header and navigation
  header: {
    menu: string;
    search: string;
    notifications: string;
    profile: string;
    settings: string;
    help: string;
    logout: string;
    toggleSidebar: string;
    toggleTheme: string;
    connectionStatus: {
      connected: string;
      connecting: string;
      disconnected: string;
      unknown: string;
    };
  };
  
  // General UI elements  
  ui: {
    loading: string;
    saving: string;
    saved: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    confirm: string;
    cancel: string;
    delete: string;
    edit: string;
    save: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    continue: string;
    finish: string;
    skip: string;
    retry: string;
    refresh: string;
    reset: string;
    clear: string;
    apply: string;
    discard: string;
    upload: string;
    download: string;
    copy: string;
    paste: string;
    cut: string;
    undo: string;
    redo: string;
    search: string;
    filter: string;
    sort: string;
    view: string;
    hide: string;
    show: string;
    expand: string;
    collapse: string;
    maximize: string;
    minimize: string;
    fullscreen: string;
    exitFullscreen: string;
  };
  
  // Placeholders and form inputs
  placeholders: {
    typeMessage: string;
    messageAssistant: string;
    addTask: string;
    typeRequest: string;
    email: string;
    organizationName: string;
    domain: string;
    description: string;
    billingEmail: string;
    welcomeMessage: string;
  };
}

// ================================================================================
// Chinese Translations (Default)
// ================================================================================

const zhCN: Translations = {
  common: {
    save: '保存',
    cancel: '取消',
    ok: '确定',
    close: '关闭',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    retry: '重试',
    refresh: '刷新',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    search: '搜索',
    clear: '清空',
    select: '选择',
    create: '创建',
    delete: '删除',
    edit: '编辑',
    update: '更新',
    submit: '提交',
    confirm: '确认',
    dismiss: '关闭',
    enable: '启用',
    disable: '禁用',
    send: '发送',
    upload: '上传',
    download: '下载'
  },
  
  navigation: {
    account: '账户',
    billing: '账单',
    usage: '使用情况',
    organizations: '组织',
    preferences: '偏好设置'
  },
  
  user: {
    profile: '个人资料',
    signIn: '登录',
    signOut: '退出登录',
    signUp: '注册',
    refreshAccount: '刷新账户',
    upgradePlan: '升级套餐',
    credits: '积分',
    plan: '套餐',
    noCreditsRemaining: '积分已用完',
    upgradeTocontinue: '升级套餐以继续使用',
    unknownUser: '未知用户',
    noEmail: '无邮箱',
    accountInformation: '账户信息',
    userId: '用户ID',
    email: '邮箱',
    name: '姓名',
    refreshing: '刷新中...',
    refreshAccountData: '刷新账户数据'
  },
  
  preferences: {
    title: '偏好设置',
    subtitle: '个性化您的应用体验',
    
    language: {
      title: '语言设置',
      description: '选择您的首选语言',
      current: '当前语言',
      selectLanguage: '选择语言'
    },
    
    theme: {
      title: '主题设置',
      description: '选择您的首选主题',
      light: '浅色主题',
      dark: '深色主题',
      system: '跟随系统'
    },
    
    notifications: {
      title: '通知设置',
      description: '管理您的通知偏好',
      email: '邮件通知',
      push: '推送通知',
      sms: '短信通知'
    }
  },

  // Credits and billing
  credits: {
    creditsLeft: '剩余积分',
    totalCredits: '总积分',
    creditsUsed: '已使用积分',
    creditsRemaining: '剩余积分',
    usageRate: '使用率',
    usageProgress: '使用进度',
    comingSoon: '即将推出'
  },

  // Login and authentication
  auth: {
    signIn: '登录',
    signOut: '退出登录',
    signUp: '注册',
    signInToContinue: '登录以继续',
    secureAuthentication: '安全认证由 Auth0 提供支持',
    welcomeBack: '欢迎回来',
    loginRequired: '需要登录'
  },

  // Chat and messaging
  chat: {
    welcome: '欢迎使用',
    startConversation: '开始对话',
    typeMessage: '输入消息...',
    sendMessage: '发送消息',
    newChat: '新对话',
    clearChat: '清空对话',
    chatHistory: '对话历史',
    noMessages: '暂无消息',
    thinking: '思考中...',
    generating: '生成中...',
    
    // Welcome page
    welcomeTitle: '欢迎使用 AI 智能助手',
    welcomeSubtitle: '选择下方任一工具开始您的AI之旅，或直接在下方输入您的需求',
    tipText: '点击上方任一工具开始使用，或在下方输入您的消息',
    
    // Example prompts
    examplePrompts: {
      createLogo: '为我的初创公司创建一个logo',
      debugCode: '帮我调试这段代码',
      analyzeData: '分析这个数据趋势',
      explainQuantum: '解释一下量子计算'
    },
    
    // Widget descriptions
    widgetDescriptions: {
      creative: '生成内容、撰写故事或头脑风暴创意',
      search: '搜索和比较产品，寻找最优惠的价格',
      image: '生成图像、创作艺术品或可视化想法',
      knowledge: '分析文档、研究主题或获取解释'
    },
    
    // Widget prompts
    widgetPrompts: {
      creative: '帮我创造一些令人惊叹的内容！我需要创意内容生成方面的帮助。',
      search: '帮我搜索和比较产品。您在寻找什么？',
      image: '为我创建一个美丽的图像。描述一下您想要生成的内容。',
      knowledge: '分析这个内容或帮我研究一个主题。您想探索什么？'
    }
  },

  // Widgets and AI features
  widgets: {
    dreamforge: '梦想工坊 AI',
    huntai: '搜索 AI',
    omnicontent: '万能内容',
    datawise: '数据智能',
    knowledgehub: '知识中心',
    assistant: 'AI 助手',
    selectWidget: '选择工具',
    widgetSelector: '工具选择器',
    availableWidgets: '可用工具'
  },

  // Tasks and progress
  tasks: {
    tasks: '任务',
    taskProgress: '任务进度',
    completed: '已完成',
    inProgress: '进行中',
    pending: '待处理',
    failed: '失败',
    taskList: '任务列表',
    noTasks: '暂无任务'
  },

  // Organizations
  organizations: {
    createOrganization: '创建组织',
    inviteMember: '邀请成员',
    organizationName: '组织名称',
    memberRole: '成员角色',
    owner: '拥有者',
    admin: '管理员',
    member: '成员',
    switchToPersonal: '切换到个人模式',
    switchToOrganization: '切换到组织模式',
    yourOrganizations: '您的组织',
    noOrganizations: '暂无组织'
  },

  // App features
  app: {
    appName: 'AI 智能助手 SDK',
    tagline: '您的智能助手',
    description: '在一个平台上释放 AI 的力量\n多个专业智能体助您聊天、创作、分析等更多功能',
    features: {
      imageGeneration: '图像生成',
      smartChat: '智能对话',
      dataAnalysis: '数据分析',
      aiSearch: 'AI 搜索'
    }
  },
  
  errors: {
    generic: '发生了未知错误',
    networkError: '网络连接错误',
    authenticationRequired: '需要登录',
    unauthorized: '无权限访问',
    notFound: '未找到资源',
    serverError: '服务器错误'
  },
  
  // Widget selector
  widgetSelector: {
    title: '智能Widget选择器',
    defaultTab: '默认Widgets',
    customTab: '自定义Widgets',
    noWidgetsTitle: '没有{type} widgets可用',
    noDefaultWidgets: '默认widgets应该是可用的',
    noCustomWidgets: '自定义widgets可用时将在这里显示',
    tipText: '💡 提示：点击任何widget在聊天旁边以插件模式打开它',
    modeSelector: {
      chooseMode: '选择显示模式',
      halfScreen: '半屏',
      fullScreen: '全屏',
      chatPluginMode: '聊天插件模式',
      standaloneMode: 'Widget独立模式',
      cancel: '取消'
    }
  },
  
  // Widget names and descriptions
  widgetInfo: {
    dream: {
      name: 'DreamForge AI',
      description: 'AI驱动的图像生成和创意视觉内容'
    },
    hunt: {
      name: 'HuntAI',
      description: '产品搜索、比较和购物助手'
    },
    omni: {
      name: 'Omni内容',
      description: '多用途内容创建和写作助手'
    },
    dataScientist: {
      name: 'DataWise分析',
      description: '高级数据分析和可视化工具'
    },
    knowledge: {
      name: '知识中心',
      description: '文档分析与向量图谱RAG'
    },
    automation: {
      name: '智能自动化',
      description: '数据驱动的业务流程自动化与AI工作流'
    },
    customAutomation: {
      name: '自定义自动化',
      description: '可配置的智能业务流程自动化工具'
    }
  },

  // Widget specific translations
  dreamWidget: {
    modes: {
      textToImage: {
        name: '文本生图',
        description: '从文字描述生成全新图像',
        useCase: '完美适用于：艺术作品、概念图、创意想法'
      },
      imageToImage: {
        name: '图像转换',
        description: '基于描述修改现有图像',
        useCase: '完美适用于：编辑、变化、改进'
      },
      styleTransfer: {
        name: '风格迁移',
        description: '为图像应用艺术风格',
        useCase: '完美适用于：艺术效果、风格匹配'
      },
      stickerGeneration: {
        name: '制作贴纸',
        description: '从图像或文本创建有趣的贴纸',
        useCase: '完美适用于：聊天贴纸、表情符号、有趣图形'
      },
      faceSwap: {
        name: '换脸',
        description: '自然地替换图像中的面部',
        useCase: '完美适用于：有趣照片、角色变换'
      },
      professionalHeadshot: {
        name: '专业头像',
        description: '从日常照片创建专业头像',
        useCase: '完美适用于：LinkedIn、简历、名片'
      },
      photoInpainting: {
        name: '移除物体',
        description: '移除不需要的物体或填补缺失部分',
        useCase: '完美适用于：照片清理、物体移除'
      },
      photoOutpainting: {
        name: '扩展图像',
        description: '用AI生成内容扩展图像边界',
        useCase: '完美适用于：扩展场景、更改宽高比'
      },
      emojiGeneration: {
        name: '自定义表情',
        description: '生成自定义表情符号风格的图像',
        useCase: '完美适用于：自定义反应、品牌表情'
      }
    },
    ui: {
      uploadImage: '上传图像',
      selectMode: '选择模式',
      generateImage: '生成图像',
      clearImage: '清除图像',
      downloadImage: '下载图像',
      shareImage: '分享图像',
      noImageSelected: '需要上传图像。请先上传图像。',
      generateButton: '生成',
      placeholderText: '描述你想要创建的图像...',
      placeholderImage: '上传图像进行处理...'
    }
  },

  // Custom Automation Widget Chinese translations
  customAutomationWidget: {
    ui: {
      title: '智能自动化',
      selectTemplate: '选择自动化模板',
      templateSelection: '选择自动化模板',
      templateSelectionDesc: '选择适合您业务需求的自动化模板',
      configuration: '参数配置',
      processSteps: '流程步骤',
      parameterConfig: '参数配置',
      modernView: '💳 现代视图',
      classicForm: '📋 经典表单',
      startAutomation: '开始自动化',
      backToSelection: '返回',
      automationRunning: '自动化运行中',
      automationRunningDesc: '正在执行您的自动化流程，请耐心等待',
      automationCompleted: '自动化完成',
      automationCompletedDesc: '您的自动化流程已成功完成',
      interventionAllowed: '可人工干预',
      complexity: {
        simple: '简单',
        moderate: '中等',
        complex: '复杂'
      },
      status: {
        pending: '等待中',
        running: '运行中',
        completed: '已完成',
        error: '错误',
        manual_review: '需人工审核'
      },
      templates: {
        dataEtl: {
          name: '数据ETL流水线',
          description: '自动化数据提取、转换和加载流程',
          steps: {
            extract: '数据提取',
            transform: '数据转换',
            load: '数据加载'
          },
          inputs: {
            sourceDb: '源数据库',
            targetFormat: '目标格式',
            batchSize: '批次大小'
          }
        },
        contentWorkflow: {
          name: '内容工作流程',
          description: '自动化内容创建、审核和发布流程',
          steps: {
            create: '内容创建',
            review: '内容审核',
            publish: '内容发布'
          },
          inputs: {
            contentType: '内容类型',
            targetChannels: '发布渠道',
            autoSchedule: '自动定时发布'
          }
        },
        apiIntegration: {
          name: 'API集成同步',
          description: '自动化第三方API集成和数据同步',
          steps: {
            configure: 'API配置',
            map: '数据映射',
            test: '同步测试',
            sync: '完整同步'
          },
          inputs: {
            apiEndpoint: 'API端点',
            authMethod: '认证方式',
            syncFrequency: '同步频率'
          }
        }
      },
      validation: {
        required: '是必填项',
        minValue: '最小值为',
        maxValue: '最大值为',
        invalidFormat: '格式不正确'
      },
      actions: {
        copy: '复制',
        download: '下载',
        share: '分享',
        refresh: '刷新',
        clear: '清除',
        manageTemplates: '管理模板'
      }
    }
  },
  
  // Task management
  tasks: {
    management: '任务管理',
    total: '总计',
    active: '活跃',
    completed: '完成',
    failed: '失败',
    pauseAll: '暂停全部',
    cancelAll: '取消全部',
    filters: {
      all: '全部任务',
      active: '活跃任务',
      completed: '已完成',
      failedCancelled: '失败/取消'
    },
    sorting: {
      created: '创建时间',
      updated: '更新时间',
      priority: '优先级',
      status: '状态'
    },
    showingTasks: '显示 {showing} / {total} 个任务',
    noTasks: '暂无任务',
    statuses: {
      pending: '等待中',
      starting: '启动中',
      running: '运行中',
      paused: '已暂停',
      resuming: '恢复中',
      completed: '已完成',
      failed: '失败',
      cancelled: '已取消',
      interrupted: '已中断'
    },
    actions: {
      start: '开始',
      pause: '暂停',
      resume: '继续',
      cancel: '取消',
      retry: '重试',
      delete: '删除'
    },
    progress: {
      step: '步骤',
      of: '共',
      estimated: '预计',
      remaining: '剩余'
    }
  },
  
  // Organization management
  organization: {
    title: '组织管理',
    create: '创建组织',
    createNew: '创建新组织',
    name: '组织名称',
    description: '组织描述',
    domain: '域名',
    domainOptional: '域名（可选）',
    billingEmail: '账单邮箱',
    plan: '计划',
    plans: {
      startup: '创业版',
      business: '商业版',
      enterprise: '企业版'
    },
    members: '成员',
    settings: '设置',
    inviteMembers: '邀请成员',
    memberCount: '{count} 个成员',
    role: '角色',
    roles: {
      owner: '拥有者',
      admin: '管理员',
      member: '成员',
      viewer: '观察者'
    },
    actions: {
      invite: '邀请',
      remove: '移除',
      changeRole: '更改角色',
      resendInvite: '重新发送邀请'
    },
    validation: {
      nameRequired: '组织名称为必填项',
      emailInvalid: '邮箱格式无效',
      domainInvalid: '域名格式无效'
    }
  },
  
  // Session management
  sessions: {
    title: '会话管理',
    newChat: '新聊天',
    new: '新建',
    newSession: '新建会话',
    deleteSession: '删除会话',
    renameSession: '重命名会话',
    confirmDelete: '确认删除？',
    enterNewName: '输入新名称',
    noSessions: '暂无会话',
    loadingSessions: '加载中...',
    currentSession: '当前会话',
    sessionCount: '{count} 个会话',
    untitledSession: '未命名会话',
    noMessages: '暂无消息',
    errorLoadingMessage: '消息加载错误',
    today: '今天',
    yesterday: '昨天',
    daysAgo: '{days} 天前',
    messageCount: '{count} 条消息',
    newSession: '新会话'
  },
  
  // Header and navigation
  header: {
    menu: '菜单',
    search: '搜索',
    notifications: '通知',
    profile: '个人资料',
    settings: '设置',
    help: '帮助',
    logout: '退出登录',
    toggleSidebar: '切换侧边栏',
    toggleTheme: '切换主题',
    connectionStatus: {
      connected: '在线',
      connecting: '连接中...',
      disconnected: '离线',
      unknown: '未知'
    }
  },
  
  // General UI elements
  ui: {
    loading: '加载中',
    saving: '保存中',
    saved: '已保存',
    error: '错误',
    success: '成功',
    warning: '警告',
    info: '信息',
    confirm: '确认',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    close: '关闭',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    continue: '继续',
    finish: '完成',
    skip: '跳过',
    retry: '重试',
    refresh: '刷新',
    reset: '重置',
    clear: '清除',
    apply: '应用',
    discard: '丢弃',
    upload: '上传',
    download: '下载',
    copy: '复制',
    paste: '粘贴',
    cut: '剪切',
    undo: '撤销',
    redo: '重做',
    search: '搜索',
    filter: '筛选',
    sort: '排序',
    view: '查看',
    hide: '隐藏',
    show: '显示',
    expand: '展开',
    collapse: '折叠',
    maximize: '最大化',
    minimize: '最小化',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏'
  },
  
  // Placeholders and form inputs
  placeholders: {
    typeMessage: '输入您的消息...',
    messageAssistant: '与AI助手对话...',
    addTask: '添加新任务...',
    typeRequest: '输入您的请求...（例如："监控我的GitHub仓库的新问题"）',
    email: 'colleague@company.com',
    organizationName: '输入组织名称',
    domain: 'company.com',
    description: '简要描述您的组织',
    billingEmail: 'billing@company.com',
    welcomeMessage: '欢迎加入我们的团队！我们很高兴您能加入我们。'
  }
};

// ================================================================================
// English Translations
// ================================================================================

const enUS: Translations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    ok: 'OK',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    retry: 'Retry',
    refresh: 'Refresh',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    clear: 'Clear',
    select: 'Select',
    create: 'Create',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    submit: 'Submit',
    confirm: 'Confirm',
    dismiss: 'Dismiss',
    enable: 'Enable',
    disable: 'Disable',
    send: 'Send',
    upload: 'Upload',
    download: 'Download'
  },
  
  navigation: {
    account: 'Account',
    billing: 'Billing',
    usage: 'Usage',
    organizations: 'Organizations',
    preferences: 'Preferences'
  },
  
  user: {
    profile: 'Profile',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    refreshAccount: 'Refresh Account',
    upgradePlan: 'Upgrade Plan',
    credits: 'Credits',
    plan: 'Plan',
    noCreditsRemaining: 'No credits remaining',
    upgradeTocontinue: 'Upgrade your plan to continue',
    unknownUser: 'Unknown User',
    noEmail: 'No email',
    accountInformation: 'Account Information',
    userId: 'User ID',
    email: 'Email',
    name: 'Name',
    refreshing: 'Refreshing...',
    refreshAccountData: 'Refresh Account Data'
  },
  
  preferences: {
    title: 'Preferences',
    subtitle: 'Customize your app experience',
    
    language: {
      title: 'Language Settings',
      description: 'Select your preferred language',
      current: 'Current Language',
      selectLanguage: 'Select Language'
    },
    
    theme: {
      title: 'Theme Settings',
      description: 'Choose your preferred theme',
      light: 'Light Theme',
      dark: 'Dark Theme',
      system: 'System Default'
    },
    
    notifications: {
      title: 'Notification Settings',
      description: 'Manage your notification preferences',
      email: 'Email Notifications',
      push: 'Push Notifications',
      sms: 'SMS Notifications'
    }
  },

  // Credits and billing
  credits: {
    creditsLeft: 'Credits Left',
    totalCredits: 'Total Credits',
    creditsUsed: 'Credits Used',
    creditsRemaining: 'Credits Remaining',
    usageRate: 'Usage Rate',
    usageProgress: 'Usage Progress',
    comingSoon: 'Coming Soon'
  },

  // Login and authentication
  auth: {
    signIn: 'Sign In',
    signOut: 'Sign Out',
    signUp: 'Sign Up',
    signInToContinue: 'Sign In to Continue',
    secureAuthentication: 'Secure authentication powered by Auth0',
    welcomeBack: 'Welcome Back',
    loginRequired: 'Login Required'
  },

  // Chat and messaging
  chat: {
    welcome: 'Welcome',
    startConversation: 'Start Conversation',
    typeMessage: 'Type a message...',
    sendMessage: 'Send Message',
    newChat: 'New Chat',
    clearChat: 'Clear Chat',
    chatHistory: 'Chat History',
    noMessages: 'No messages',
    thinking: 'Thinking...',
    generating: 'Generating...',
    
    // Welcome page
    welcomeTitle: 'Welcome to AI Assistant',
    welcomeSubtitle: 'Choose any tool below to start your AI journey, or type your request directly below',
    tipText: 'Click any widget above to get started, or type your message below',
    
    // Example prompts
    examplePrompts: {
      createLogo: 'Create a logo for my startup',
      debugCode: 'Help me debug this code',
      analyzeData: 'Analyze this data trend',
      explainQuantum: 'Explain quantum computing'
    },
    
    // Widget descriptions
    widgetDescriptions: {
      creative: 'Generate content, write stories, or brainstorm ideas',
      search: 'Search and compare products, find the best deals',
      image: 'Generate images, create artwork, or visualize ideas',
      knowledge: 'Analyze documents, research topics, or get explanations'
    },
    
    // Widget prompts
    widgetPrompts: {
      creative: 'Help me create something amazing! I need assistance with creative content generation.',
      search: 'Help me find and compare products. What are you looking for?',
      image: 'Create a beautiful image for me. Describe what you want to see generated.',
      knowledge: 'Analyze this content or help me research a topic. What would you like to explore?'
    }
  },

  // Widgets and AI features
  widgets: {
    dreamforge: 'DreamForge AI',
    huntai: 'HuntAI',
    omnicontent: 'Omni Content',
    datawise: 'DataWise Analytics',
    knowledgehub: 'Knowledge Hub',
    assistant: 'AI Assistant',
    selectWidget: 'Select Widget',
    widgetSelector: 'Widget Selector',
    availableWidgets: 'Available Widgets'
  },

  // Tasks and progress
  tasks: {
    tasks: 'Tasks',
    taskProgress: 'Task Progress',
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    failed: 'Failed',
    taskList: 'Task List',
    noTasks: 'No tasks'
  },

  // Organizations
  organizations: {
    createOrganization: 'Create Organization',
    inviteMember: 'Invite Member',
    organizationName: 'Organization Name',
    memberRole: 'Member Role',
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    switchToPersonal: 'Switch to Personal',
    switchToOrganization: 'Switch to Organization',
    yourOrganizations: 'Your Organizations',
    noOrganizations: 'No organizations'
  },

  // App features
  app: {
    appName: 'AI Agent SDK',
    tagline: 'Your Intelligent Assistant',
    description: 'Unlock the power of AI with multiple specialized agents.\nChat, create, analyze, and more - all in one place.',
    features: {
      imageGeneration: 'Image Generation',
      smartChat: 'Smart Chat',
      dataAnalysis: 'Data Analysis',
      aiSearch: 'AI Search'
    }
  },
  
  errors: {
    generic: 'An unexpected error occurred',
    networkError: 'Network connection error',
    authenticationRequired: 'Authentication required',
    unauthorized: 'Unauthorized access',
    notFound: 'Resource not found',
    serverError: 'Server error'
  },
  
  // Widget selector
  widgetSelector: {
    title: 'Smart Widget Selector',
    defaultTab: 'Default Widgets',
    customTab: 'Custom Widgets',
    noWidgetsTitle: 'No {type} widgets available',
    noDefaultWidgets: 'Default widgets should be available',
    noCustomWidgets: 'Custom widgets will appear here when available',
    tipText: '💡 Tip: Click any widget to open it in plugin mode alongside your chat',
    modeSelector: {
      chooseMode: 'Choose display mode',
      halfScreen: 'Half Screen',
      fullScreen: 'Full Screen',
      chatPluginMode: 'Chat plugin mode',
      standaloneMode: 'Widget standalone mode',
      cancel: 'Cancel'
    }
  },
  
  // Widget names and descriptions
  widgetInfo: {
    dream: {
      name: 'DreamForge AI',
      description: 'AI-powered image generation and creative visual content'
    },
    hunt: {
      name: 'HuntAI',
      description: 'Product search, comparison and shopping assistance'
    },
    omni: {
      name: 'Omni Content',
      description: 'Multi-purpose content creation and writing assistant'
    },
    dataScientist: {
      name: 'DataWise Analytics',
      description: 'Advanced data analysis and visualization tools'
    },
    knowledge: {
      name: 'Knowledge Hub',
      description: 'Document analysis with vector and graph RAG'
    },
    automation: {
      name: 'Smart Automation',
      description: 'Data-driven business process automation with AI workflows'
    },
    customAutomation: {
      name: 'Custom Automation',
      description: 'Configurable intelligent business process automation tools'
    }
  },

  // Widget specific translations
  dreamWidget: {
    modes: {
      textToImage: {
        name: 'Create from Text',
        description: 'Generate entirely new images from your description',
        useCase: 'Perfect for: Artwork, concepts, creative ideas'
      },
      imageToImage: {
        name: 'Transform Image',
        description: 'Modify an existing image based on your description',
        useCase: 'Perfect for: Editing, variations, improvements'
      },
      styleTransfer: {
        name: 'Change Style',
        description: 'Apply artistic styles to your images',
        useCase: 'Perfect for: Artistic effects, style matching'
      },
      stickerGeneration: {
        name: 'Make Stickers',
        description: 'Create fun stickers from images or text',
        useCase: 'Perfect for: Chat stickers, emojis, fun graphics'
      },
      faceSwap: {
        name: 'Swap Faces',
        description: 'Replace faces in images naturally',
        useCase: 'Perfect for: Fun photos, character changes'
      },
      professionalHeadshot: {
        name: 'Pro Headshots',
        description: 'Create professional headshots from casual photos',
        useCase: 'Perfect for: LinkedIn, resumes, business cards'
      },
      photoInpainting: {
        name: 'Remove Objects',
        description: 'Remove unwanted objects or fill in missing parts',
        useCase: 'Perfect for: Photo cleanup, object removal'
      },
      photoOutpainting: {
        name: 'Extend Images',
        description: 'Expand image boundaries with AI-generated content',
        useCase: 'Perfect for: Expanding scenes, changing aspect ratios'
      },
      emojiGeneration: {
        name: 'Custom Emojis',
        description: 'Generate custom emoji-style images',
        useCase: 'Perfect for: Custom reactions, brand emojis'
      }
    },
    ui: {
      uploadImage: 'Upload Image',
      selectMode: 'Select Mode',
      generateImage: 'Generate Image',
      clearImage: 'Clear Image',
      downloadImage: 'Download Image',
      shareImage: 'Share Image',
      noImageSelected: 'requires an uploaded image. Please upload an image first.',
      generateButton: 'Generate',
      placeholderText: 'Describe the image you want to create...',
      placeholderImage: 'Upload an image for processing...'
    }
  },

  // Custom Automation Widget English translations
  customAutomationWidget: {
    ui: {
      title: 'Smart Automation',
      selectTemplate: 'Select Automation Template',
      templateSelection: 'Select Automation Template',
      templateSelectionDesc: 'Choose an automation template that suits your business needs',
      configuration: 'Parameter Configuration',
      processSteps: 'Process Steps',
      parameterConfig: 'Parameter Configuration',
      modernView: '💳 Modern View',
      classicForm: '📋 Classic Form',
      startAutomation: 'Start Automation',
      backToSelection: 'Back',
      automationRunning: 'Automation Running',
      automationRunningDesc: 'Your automation process is running, please wait patiently',
      automationCompleted: 'Automation Completed',
      automationCompletedDesc: 'Your automation process has been completed successfully',
      interventionAllowed: 'Manual intervention allowed',
      complexity: {
        simple: 'Simple',
        moderate: 'Moderate',
        complex: 'Complex'
      },
      status: {
        pending: 'Pending',
        running: 'Running',
        completed: 'Completed',
        error: 'Error',
        manual_review: 'Manual Review Required'
      },
      templates: {
        dataEtl: {
          name: 'Data ETL Pipeline',
          description: 'Automated data extraction, transformation, and loading process',
          steps: {
            extract: 'Data Extraction',
            transform: 'Data Transformation',
            load: 'Data Loading'
          },
          inputs: {
            sourceDb: 'Source Database',
            targetFormat: 'Target Format',
            batchSize: 'Batch Size'
          }
        },
        contentWorkflow: {
          name: 'Content Workflow',
          description: 'Automated content creation, review, and publishing process',
          steps: {
            create: 'Content Creation',
            review: 'Content Review',
            publish: 'Content Publishing'
          },
          inputs: {
            contentType: 'Content Type',
            targetChannels: 'Target Channels',
            autoSchedule: 'Auto Schedule Publishing'
          }
        },
        apiIntegration: {
          name: 'API Integration Sync',
          description: 'Automated third-party API integration and data synchronization',
          steps: {
            configure: 'API Configuration',
            map: 'Data Mapping',
            test: 'Sync Testing',
            sync: 'Full Synchronization'
          },
          inputs: {
            apiEndpoint: 'API Endpoint',
            authMethod: 'Authentication Method',
            syncFrequency: 'Sync Frequency'
          }
        }
      },
      validation: {
        required: 'is required',
        minValue: 'minimum value is',
        maxValue: 'maximum value is',
        invalidFormat: 'invalid format'
      },
      actions: {
        copy: 'Copy',
        download: 'Download',
        share: 'Share',
        refresh: 'Refresh',
        clear: 'Clear',
        manageTemplates: 'Manage Templates'
      }
    }
  },
  
  // Task management
  tasks: {
    management: 'Task Management',
    total: 'Total',
    active: 'Active',
    completed: 'Completed',
    failed: 'Failed',
    pauseAll: 'Pause All',
    cancelAll: 'Cancel All',
    filters: {
      all: 'All Tasks',
      active: 'Active Tasks',
      completed: 'Completed',
      failedCancelled: 'Failed/Cancelled'
    },
    sorting: {
      created: 'Created Time',
      updated: 'Updated Time',
      priority: 'Priority',
      status: 'Status'
    },
    showingTasks: 'Showing {showing} / {total} tasks',
    noTasks: 'No tasks',
    statuses: {
      pending: 'Pending',
      starting: 'Starting',
      running: 'Running',
      paused: 'Paused',
      resuming: 'Resuming',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      interrupted: 'Interrupted'
    },
    actions: {
      start: 'Start',
      pause: 'Pause',
      resume: 'Resume',
      cancel: 'Cancel',
      retry: 'Retry',
      delete: 'Delete'
    },
    progress: {
      step: 'Step',
      of: 'of',
      estimated: 'Estimated',
      remaining: 'Remaining'
    }
  },
  
  // Organization management
  organization: {
    title: 'Organization Management',
    create: 'Create Organization',
    createNew: 'Create New Organization',
    name: 'Organization Name',
    description: 'Description',
    domain: 'Domain',
    domainOptional: 'Domain (optional)',
    billingEmail: 'Billing Email',
    plan: 'Plan',
    plans: {
      startup: 'Startup',
      business: 'Business',
      enterprise: 'Enterprise'
    },
    members: 'Members',
    settings: 'Settings',
    inviteMembers: 'Invite Members',
    memberCount: '{count} members',
    role: 'Role',
    roles: {
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      viewer: 'Viewer'
    },
    actions: {
      invite: 'Invite',
      remove: 'Remove',
      changeRole: 'Change Role',
      resendInvite: 'Resend Invite'
    },
    validation: {
      nameRequired: 'Organization name is required',
      emailInvalid: 'Invalid email format',
      domainInvalid: 'Invalid domain format'
    }
  },
  
  // Session management
  sessions: {
    title: 'Session Management',
    newChat: 'New Chat',
    new: 'New',
    newSession: 'New Session',
    deleteSession: 'Delete Session',
    renameSession: 'Rename Session',
    confirmDelete: 'Confirm deletion?',
    enterNewName: 'Enter new name',
    noSessions: 'No sessions',
    loadingSessions: 'Loading...',
    currentSession: 'Current Session',
    sessionCount: '{count} sessions',
    untitledSession: 'Untitled Session',
    noMessages: 'No messages yet',
    errorLoadingMessage: 'Error loading message',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    messageCount: '{count} messages',
    newSession: 'New Session'
  },
  
  // Header and navigation
  header: {
    menu: 'Menu',
    search: 'Search',
    notifications: 'Notifications',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    logout: 'Logout',
    toggleSidebar: 'Toggle Sidebar',
    toggleTheme: 'Toggle Theme',
    connectionStatus: {
      connected: 'Online',
      connecting: 'Connecting...',
      disconnected: 'Offline',
      unknown: 'Unknown'
    }
  },
  
  // General UI elements
  ui: {
    loading: 'Loading',
    saving: 'Saving',
    saved: 'Saved',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    continue: 'Continue',
    finish: 'Finish',
    skip: 'Skip',
    retry: 'Retry',
    refresh: 'Refresh',
    reset: 'Reset',
    clear: 'Clear',
    apply: 'Apply',
    discard: 'Discard',
    upload: 'Upload',
    download: 'Download',
    copy: 'Copy',
    paste: 'Paste',
    cut: 'Cut',
    undo: 'Undo',
    redo: 'Redo',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    view: 'View',
    hide: 'Hide',
    show: 'Show',
    expand: 'Expand',
    collapse: 'Collapse',
    maximize: 'Maximize',
    minimize: 'Minimize',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen'
  },
  
  // Placeholders and form inputs
  placeholders: {
    typeMessage: 'Type your message...',
    messageAssistant: 'Message AI Assistant...',
    addTask: 'Add a new task...',
    typeRequest: 'Type your request... (e.g., "Monitor my GitHub repo for new issues")',
    email: 'colleague@company.com',
    organizationName: 'Enter organization name',
    domain: 'company.com',
    description: 'Brief description of your organization',
    billingEmail: 'billing@company.com',
    welcomeMessage: 'Welcome to our team! We\'re excited to have you join us.'
  }
};

// ================================================================================
// Translation Map
// ================================================================================

export const translations: Record<SupportedLanguage, Translations> = {
  'zh-CN': zhCN,
  'en-US': enUS
};

// ================================================================================
// Utility Types
// ================================================================================

export type TranslationKey = keyof Translations;
export type NestedTranslationKey<T> = T extends object 
  ? { [K in keyof T]: `${string & K}${T[K] extends object ? `.${NestedTranslationKey<T[K]>}` : ''}` }[keyof T]
  : never;

// Export specific translation keys for type safety
export type AllTranslationKeys = NestedTranslationKey<Translations>;

// ================================================================================
// Translation Utility Function
// ================================================================================

/**
 * Get a translation value by key and language
 * @param key - The translation key (supports nested keys like 'chat.welcomeTitle')
 * @param language - The target language
 * @param variables - Optional variables for string interpolation
 * @returns The translated string
 */
export const getTranslation = (
  key: string, 
  language: SupportedLanguage = 'zh-CN', 
  variables?: Record<string, string | number>
): string => {
  try {
    const translation = translations[language];
    if (!translation) {
      console.warn(`Translation for language "${language}" not found, falling back to zh-CN`);
      return getTranslation(key, 'zh-CN', variables);
    }

    // Navigate through nested keys
    const keys = key.split('.');
    let value: any = translation;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key "${key}" not found in language "${language}"`);
        return key; // Return the key as fallback
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation value for key "${key}" is not a string`);
      return key;
    }

    // Apply variable interpolation
    if (variables) {
      return value.replace(/\{(\w+)\}/g, (match, varName) => {
        return variables[varName]?.toString() || match;
      });
    }

    return value;
  } catch (error) {
    console.error(`Error getting translation for key "${key}":`, error);
    return key; // Return the key as fallback
  }
};
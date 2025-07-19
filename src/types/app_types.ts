/**
 * 应用类型定义
 */

export interface AppArtifact {
  id: string;
  appId: string;
  appName: string;
  appIcon: string;
  title: string;
  userInput: string;
  createdAt: string;
  isOpen: boolean;
  generatedContent?: {
    type: 'image' | 'text' | 'file' | 'data';
    content: string;
    thumbnail?: string;
    metadata?: Record<string, any>;
  };
}

export interface AvailableApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  triggers: string[];
  category: string;
}

export interface AppTriggerParams {
  message: string;
  setCurrentApp: (app: string | null) => void;
  setShowRightSidebar: (show: boolean) => void;
  setTriggeredAppInput: (input: string) => void;
}

export interface MessageHandlerParams {
  message: any;
  currentApp: string | null;
  showRightSidebar: boolean;
  triggeredAppInput: string;
  artifacts: AppArtifact[];
  setPendingArtifact: (artifact: any) => void;
}

export interface MessageRendererParams {
  message: any;
  artifacts: AppArtifact[];
  reopenApp: (artifactId: string) => void;
}
/**
 * ============================================================================
 * 工件状态管理 (useArtifactStore.ts) - 专注于生成内容工件的状态管理
 * ============================================================================
 * 
 * 【核心职责】
 * - 管理生成的内容工件（图片、文本、代码等）
 * - 处理工件的创建、存储、查看状态
 * - 管理待生成工件的状态
 * - 提供工件相关的操作接口
 * 
 * 【关注点分离】
 * ✅ 负责：
 *   - 工件数据的存储和管理
 *   - 工件的CRUD操作
 *   - 待生成工件状态管理
 *   - 工件打开/关闭状态
 *   - 工件元数据管理
 * 
 * ❌ 不负责：
 *   - 聊天消息管理（由useChatStore处理）
 *   - 会话管理（由useSessionStore处理）
 *   - 应用导航（由useAppStore处理）
 *   - UI界面状态（由useAppStore处理）
 *   - 小部件业务逻辑（由useWidgetStores处理）
 * 
 * 【工件结构】
 * AppArtifact {
 *   id: string
 *   appId: string
 *   appName: string
 *   appIcon: string
 *   title: string
 *   userInput: string
 *   createdAt: string
 *   isOpen: boolean
 *   generatedContent: object
 * }
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AppArtifact, PendingArtifact } from '../types/appTypes';
import { logger, LogCategory } from '../utils/logger';

interface ArtifactState {
  // 工件数据
  artifacts: AppArtifact[];
  pendingArtifact: PendingArtifact | null;
}

interface ArtifactActions {
  // 工件操作
  addArtifact: (artifact: AppArtifact) => void;
  setArtifacts: (artifacts: AppArtifact[] | ((prev: AppArtifact[]) => AppArtifact[])) => void;
  updateArtifact: (artifactId: string, updates: Partial<AppArtifact>) => void;
  deleteArtifact: (artifactId: string) => void;
  
  // 工件状态管理
  openArtifact: (artifactId: string) => void;
  closeArtifact: (artifactId: string) => void;
  closeAllArtifacts: () => void;
  
  // 待生成工件
  setPendingArtifact: (artifact: PendingArtifact | null) => void;
  
  // 批量操作
  clearArtifacts: () => void;
}

export type ArtifactStore = ArtifactState & ArtifactActions;

export const useArtifactStore = create<ArtifactStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    artifacts: [],
    pendingArtifact: null,
    
    // 工件操作
    addArtifact: (artifact) => {
      set((state) => {
        // Check if artifact with same ID already exists
        const existingIndex = state.artifacts.findIndex(a => a.id === artifact.id);
        if (existingIndex >= 0) {
          // Update existing artifact
          const newArtifacts = [...state.artifacts];
          newArtifacts[existingIndex] = artifact;
          return { artifacts: newArtifacts };
        } else {
          // Add new artifact
          return { artifacts: [...state.artifacts, artifact] };
        }
      });
      logger.trackArtifactCreation(artifact);
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifact added/updated in artifact store', { 
        artifactId: artifact.id,
        appId: artifact.appId,
        title: artifact.title
      });
    },
    
    setArtifacts: (artifacts) => {
      const newArtifacts = typeof artifacts === 'function' ? artifacts(get().artifacts) : artifacts;
      set({ artifacts: newArtifacts });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifacts set in artifact store', { 
        count: Array.isArray(newArtifacts) ? newArtifacts.length : 'function' 
      });
    },
    
    updateArtifact: (artifactId, updates) => {
      set((state) => ({
        artifacts: state.artifacts.map(artifact =>
          artifact.id === artifactId ? { ...artifact, ...updates } : artifact
        )
      }));
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifact updated in artifact store', { 
        artifactId, 
        updates 
      });
    },
    
    deleteArtifact: (artifactId) => {
      set((state) => ({
        artifacts: state.artifacts.filter(artifact => artifact.id !== artifactId)
      }));
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifact deleted from artifact store', { 
        artifactId 
      });
    },
    
    // 工件状态管理
    openArtifact: (artifactId) => {
      set((state) => ({
        artifacts: state.artifacts.map(artifact => ({
          ...artifact,
          isOpen: artifact.id === artifactId ? true : artifact.isOpen
        }))
      }));
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifact opened in artifact store', { 
        artifactId 
      });
    },
    
    closeArtifact: (artifactId) => {
      set((state) => ({
        artifacts: state.artifacts.map(artifact => ({
          ...artifact,
          isOpen: artifact.id === artifactId ? false : artifact.isOpen
        }))
      }));
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Artifact closed in artifact store', { 
        artifactId 
      });
    },
    
    closeAllArtifacts: () => {
      set((state) => ({
        artifacts: state.artifacts.map(artifact => ({ ...artifact, isOpen: false }))
      }));
      logger.debug(LogCategory.ARTIFACT_CREATION, 'All artifacts closed in artifact store');
    },
    
    // 待生成工件
    setPendingArtifact: (artifact) => {
      set({ pendingArtifact: artifact });
      if (artifact) {
        logger.debug(LogCategory.ARTIFACT_CREATION, 'Pending artifact set in artifact store', { 
          type: artifact.imageUrl ? 'image' : 'text',
          messageId: artifact.messageId,
          userInput: artifact.userInput?.substring(0, 50)
        });
      } else {
        logger.debug(LogCategory.ARTIFACT_CREATION, 'Pending artifact cleared in artifact store');
      }
    },
    
    // 批量操作
    clearArtifacts: () => {
      set({ artifacts: [], pendingArtifact: null });
      logger.debug(LogCategory.ARTIFACT_CREATION, 'All artifacts cleared from artifact store');
    }
  }))
);

// Artifact选择器
export const useArtifacts = () => useArtifactStore(state => state.artifacts);
export const usePendingArtifact = () => useArtifactStore(state => state.pendingArtifact);

// 派生状态选择器
export const useOpenArtifacts = () => {
  const artifacts = useArtifacts();
  return artifacts.filter(artifact => artifact.isOpen);
};

export const useArtifactsByApp = (appId: string) => {
  const artifacts = useArtifacts();
  return artifacts.filter(artifact => artifact.appId === appId);
};

export const useArtifactCount = () => {
  const artifacts = useArtifacts();
  return artifacts.length;
};

export const useHasArtifacts = () => {
  const artifactCount = useArtifactCount();
  return artifactCount > 0;
};

export const useLatestArtifact = () => {
  const artifacts = useArtifacts();
  return artifacts.length > 0 ? artifacts[artifacts.length - 1] : null;
};

// Artifact操作
export const useArtifactActions = () => useArtifactStore(state => ({
  addArtifact: state.addArtifact,
  setArtifacts: state.setArtifacts,
  updateArtifact: state.updateArtifact,
  deleteArtifact: state.deleteArtifact,
  openArtifact: state.openArtifact,
  closeArtifact: state.closeArtifact,
  closeAllArtifacts: state.closeAllArtifacts,
  setPendingArtifact: state.setPendingArtifact,
  clearArtifacts: state.clearArtifacts
}));
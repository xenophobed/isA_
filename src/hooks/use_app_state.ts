import { useState, useCallback } from 'react';
import { AppArtifact } from '../types/app_types';
import { logger, LogCategory } from '../utils/logger';

/**
 * 应用状态管理 Hook
 */
export const useAppState = () => {
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [artifacts, setArtifacts] = useState<AppArtifact[]>([]);
  const [triggeredAppInput, setTriggeredAppInput] = useState<string>('');
  const [dreamGeneratedImage, setDreamGeneratedImage] = useState<string | null>(null);
  const [pendingArtifact, setPendingArtifact] = useState<{
    imageUrl?: string;
    textContent?: string;
    userInput: string;
    timestamp: number;
    aiResponse?: string;
    messageId?: string;
  } | null>(null);

  // Wrapped setters with logging
  const setCurrentAppWithLogging = useCallback((app: string | null) => {
    const oldValue = currentApp;
    logger.trackStateChange('currentApp', oldValue, app, 'useAppState');
    setCurrentApp(app);
  }, [currentApp]);

  const setShowRightSidebarWithLogging = useCallback((show: boolean) => {
    const oldValue = showRightSidebar;
    logger.trackStateChange('showRightSidebar', oldValue, show, 'useAppState');
    logger.trackSidebarInteraction(show ? 'opened' : 'closed', currentApp || undefined);
    setShowRightSidebar(show);
  }, [showRightSidebar, currentApp]);

  const setArtifactsWithLogging = useCallback((artifacts: AppArtifact[] | ((prev: AppArtifact[]) => AppArtifact[])) => {
    const newArtifacts = typeof artifacts === 'function' ? artifacts : artifacts;
    logger.trackStateChange('artifacts', undefined, Array.isArray(newArtifacts) ? newArtifacts.length : 'function', 'useAppState');
    setArtifacts(artifacts);
  }, []);

  const setTriggeredAppInputWithLogging = useCallback((input: string) => {
    const oldValue = triggeredAppInput;
    logger.trackStateChange('triggeredAppInput', oldValue, input, 'useAppState');
    if (input) {
      logger.trackUserInput(input, { source: 'app_trigger', currentApp });
    }
    setTriggeredAppInput(input);
  }, [triggeredAppInput, currentApp]);

  const setDreamGeneratedImageWithLogging = useCallback((image: string | null) => {
    const oldValue = dreamGeneratedImage;
    logger.trackStateChange('dreamGeneratedImage', oldValue, image, 'useAppState');
    if (image) {
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Dream image generated', { imageUrl: image });
    }
    setDreamGeneratedImage(image);
  }, [dreamGeneratedImage]);

  const setPendingArtifactWithLogging = useCallback((artifact: any) => {
    const oldValue = pendingArtifact;
    logger.trackStateChange('pendingArtifact', oldValue?.messageId, artifact?.messageId, 'useAppState');
    if (artifact) {
      logger.debug(LogCategory.ARTIFACT_CREATION, 'Pending artifact set', { 
        type: artifact.imageUrl ? 'image' : 'text',
        messageId: artifact.messageId,
        userInput: artifact.userInput?.substring(0, 50)
      });
    }
    setPendingArtifact(artifact);
  }, [pendingArtifact]);

  return {
    currentApp,
    setCurrentApp: setCurrentAppWithLogging,
    showRightSidebar,
    setShowRightSidebar: setShowRightSidebarWithLogging,
    artifacts,
    setArtifacts: setArtifactsWithLogging,
    triggeredAppInput,
    setTriggeredAppInput: setTriggeredAppInputWithLogging,
    dreamGeneratedImage,
    setDreamGeneratedImage: setDreamGeneratedImageWithLogging,
    pendingArtifact,
    setPendingArtifact: setPendingArtifactWithLogging
  };
};
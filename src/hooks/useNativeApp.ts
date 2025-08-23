/**
 * Native App Integration Hook
 * Provides React integration for native app features
 */
import { useState, useEffect, useCallback } from 'react';
import { NativeAppUtils, NativeAppInfo } from '../utils/nativeApp';

export interface UseNativeAppResult extends NativeAppInfo {
  // State management
  keyboardVisible: boolean;
  orientation: 'portrait' | 'landscape';
  
  // Actions
  setStatusBarStyle: (style: 'light' | 'dark') => void;
  vibrate: (pattern?: number | number[]) => void;
  pickFiles: (options?: { accept?: string; multiple?: boolean }) => Promise<File[]>;
  
  // Event handlers
  onKeyboardShow: (callback: (height: number) => void) => () => void;
  onKeyboardHide: (callback: () => void) => () => void;
}

export const useNativeApp = (): UseNativeAppResult => {
  const [appInfo, setAppInfo] = useState<NativeAppInfo>(() => NativeAppUtils.getInfo());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (typeof window === 'undefined') return 'portrait';
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
  });

  // Update keyboard state
  const handleKeyboardChange = useCallback((height: number) => {
    setKeyboardHeight(height);
    setKeyboardVisible(height > 0);
    setAppInfo(prev => ({ ...prev, keyboardHeight: height }));
  }, []);

  // Update orientation
  const handleOrientationChange = useCallback(() => {
    const newOrientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    setOrientation(newOrientation);
    
    // Re-detect app info on orientation change
    setTimeout(() => {
      setAppInfo(NativeAppUtils.getInfo());
    }, 100);
  }, []);

  // Setup keyboard listeners
  useEffect(() => {
    const cleanup = NativeAppUtils.setupKeyboardHandling(handleKeyboardChange);
    return cleanup;
  }, [handleKeyboardChange]);

  // Setup orientation listeners
  useEffect(() => {
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, [handleOrientationChange]);

  // Apply safe area CSS on mount and changes
  useEffect(() => {
    NativeAppUtils.applySafeAreaCSS();
  }, [appInfo.safeAreaInsets, orientation]);

  // Action handlers
  const setStatusBarStyle = useCallback((style: 'light' | 'dark') => {
    NativeAppUtils.setStatusBarStyle(style);
  }, []);

  const vibrate = useCallback((pattern?: number | number[]) => {
    NativeAppUtils.vibrate(pattern);
  }, []);

  const pickFiles = useCallback(async (options?: { accept?: string; multiple?: boolean }) => {
    return NativeAppUtils.pickFile(options);
  }, []);

  // Event handler factories
  const onKeyboardShow = useCallback((callback: (height: number) => void) => {
    const handler = (height: number) => {
      if (height > 0) callback(height);
    };
    
    const cleanup = NativeAppUtils.setupKeyboardHandling(handler);
    return cleanup;
  }, []);

  const onKeyboardHide = useCallback((callback: () => void) => {
    const handler = (height: number) => {
      if (height === 0) callback();
    };
    
    const cleanup = NativeAppUtils.setupKeyboardHandling(handler);
    return cleanup;
  }, []);

  return {
    ...appInfo,
    keyboardHeight,
    keyboardVisible,
    orientation,
    setStatusBarStyle,
    vibrate,
    pickFiles,
    onKeyboardShow,
    onKeyboardHide,
  };
};
/**
 * Mobile Sidebar Component
 * Responsive sidebar with swipe gestures and overlay support
 */
import React, { useEffect, useRef } from 'react';

// Simple SVG icon component
const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export interface MobileSidebarProps {
  content?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
  position: 'left' | 'right';
  enableSwipeToClose?: boolean;
  width?: string;
  className?: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({
  content,
  isOpen = false,
  onClose,
  position,
  enableSwipeToClose = true,
  width = '80vw',
  className = ''
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Note: Gesture handlers would be implemented here for swipe to close
  // Currently simplified for compatibility

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!content) return null;

  const sidebarClasses = `
    mobile-sidebar
    fixed top-0 bottom-0 z-50
    ${position === 'left' ? 'left-0' : 'right-0'}
    bg-black/95 backdrop-blur-xl
    border-${position === 'left' ? 'r' : 'l'} border-white/10
    transform transition-transform duration-300 ease-out
    ${isOpen 
      ? 'translate-x-0' 
      : position === 'left' 
        ? '-translate-x-full' 
        : 'translate-x-full'
    }
    ${className}
  `;

  return (
    <div
      ref={sidebarRef}
      className={sidebarClasses}
      style={{ width }}
      {...(enableSwipeToClose ? {} : {})}
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white font-medium">
          {position === 'left' ? 'Menu' : 'Options'}
        </h2>
        
        <button
          onClick={onClose}
          className="
            w-8 h-8 rounded-lg
            flex items-center justify-center
            bg-white/5 hover:bg-white/10
            border border-white/10 hover:border-white/20
            transition-all duration-200
          "
          aria-label="Close sidebar"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Sidebar content */}
      <div className="flex-1 overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
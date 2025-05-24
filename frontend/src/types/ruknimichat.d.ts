// Type definitions for RukminiChat components

// React types
declare module 'react' {
  export * from '@types/react';
}

// Framer Motion types
declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    style?: React.CSSProperties;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
    whileHover?: any;
    whileTap?: any;
    layout?: boolean | 'position' | 'size' | 'preserve-aspect';
    custom?: any;
    onAnimationStart?: () => void;
    onAnimationComplete?: () => void;
    onHoverStart?: (e: MouseEvent) => void;
    onHoverEnd?: (e: MouseEvent) => void;
    onDragStart?: () => void;
    onDragEnd?: () => void;
    onViewportEnter?: () => void;
    onViewportLeave?: () => void;
    viewport?: { once?: boolean; amount?: 'some' | 'all' | number; margin?: string };
    inherit?: boolean;
  }
  
  export const motion: {
    [key: string]: React.ForwardRefExoticComponent<MotionProps>;
  };
  
  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    onExitComplete?: () => void;
    initial?: boolean;
  }>;
  
  export const motionValue: any;
  export const useAnimation: any;
  export const useCycle: any;
  export const useInView: any;
  export const useReducedMotion: any;
  export const useTransform: any;
  export const useViewportScroll: any;
  export const AnimateSharedLayout: any;
  export const LayoutGroup: any;
}

// React Icons types
declare module 'react-icons/fi' {
  import { IconType } from 'react-icons';
  
  export const FiSend: IconType;
  export const FiMic: IconType;
  export const FiImage: IconType;
  export const FiSmile: IconType;
  export const FiX: IconType;
  export const FiMinimize2: IconType;
  export const FiMaximize2: IconType;
}

// UUID types
declare module 'uuid' {
  export function v4(): string;
}

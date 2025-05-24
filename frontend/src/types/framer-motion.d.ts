// Minimal type declarations for framer-motion
declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    children?: any;
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    style?: any;
    className?: string;
    onHoverStart?: (e: any) => void;
    onHoverEnd?: (e: any) => void;
    onTap?: () => void;
    onAnimationComplete?: () => void;
  }

  export const motion: any;
  export const AnimatePresence: React.FC<{
    children?: any;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
  }>;
}

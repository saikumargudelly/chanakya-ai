// Global type declarations for the project

// Declare Node.js core modules
declare module 'stream';
declare module 'http';
declare module 'https';
declare module 'zlib';
declare module 'crypto';

// Extend the Window interface to include any global variables
interface Window {
  // Add any global variables that might be needed
}

// Type definitions for React 18.x
declare namespace React {
  // React Elements
  type ReactElement = any;
  type ReactNode = any;
  type ReactPortal = any;
  type Key = string | number;
  type Ref<T> = any;
  type ComponentType<P = {}> = any;
  type ComponentClass<P = {}, S = any> = any;
  type FunctionComponent<P = {}> = any;
  type FC<P = {}> = FunctionComponent<P>;
  
  // Hooks
  type DependencyList = ReadonlyArray<any>;
  
  function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
  function useState<S = undefined>(): [S | undefined, (newState: S | ((prevState: S | undefined) => S | undefined) | undefined) => void];
  
  function useEffect(effect: () => void | (() => void), deps?: DependencyList): void;
  function useLayoutEffect(effect: () => void | (() => void), deps?: DependencyList): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
  function useMemo<T>(factory: () => T, deps: DependencyList): T;
  
  function useContext<T>(context: Context<T>): T;
  function useRef<T>(initialValue: T): { current: T };
  function useRef<T = undefined>(): { current: T | undefined };
  
  // Context
  interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
    displayName?: string;
  }
  
  function createContext<T>(defaultValue: T): Context<T>;
  
  // Other types needed for your application
  type CSSProperties = any;
  type Dispatch<A> = (action: A) => void;
  type SetStateAction<S> = S | ((prevState: S) => S);
  type MutableRefObject<T> = { current: T };
  type ForwardedRef<T> = ((instance: T | null) => void) | MutableRefObject<T | null> | null;
  type ForwardRefExoticComponent<P> = any;
  type ForwardRefRenderFunction<T, P = {}> = (props: P, ref: ForwardedRef<T>) => ReactElement | null;
  
  // React.FC with children
  interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: any;
    displayName?: string;
  }
}

// Make React available globally
declare const React: typeof import('react');

// Add type definitions for modules without types
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

// Add any other missing type declarations here

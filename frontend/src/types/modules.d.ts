// Type declarations for modules without types

declare namespace React {
  type ReactNode = any;
  type FC<P = {}> = (props: P) => ReactNode;
  type PropsWithChildren<P = unknown> = P & { children?: ReactNode };
  type DependencyList = ReadonlyArray<any>;
  type EffectCallback = () => (void | (() => void | undefined));
  
  interface MutableRefObject<T> {
    current: T;
  }
  
  interface RefObject<T> {
    readonly current: T | null;
  }
  
  function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  function useEffect(effect: EffectCallback, deps?: DependencyList): void;
  function useRef<T>(initialValue: T): MutableRefObject<T>;
  function useRef<T>(initialValue: T | null): RefObject<T>;
  function useRef<T = undefined>(): MutableRefObject<T | undefined>;
  function createContext<T>(defaultValue: T): React.Context<T>;
  function useContext<T>(context: React.Context<T>): T;
  
  interface Context<T> {
    Provider: React.Provider<T>;
    Consumer: React.Consumer<T>;
  }
  
  interface ProviderProps<T> {
    value: T;
    children?: ReactNode;
  }
  
  interface ConsumerProps<T> {
    children: (value: T) => ReactNode;
  }
  
  interface FunctionComponent<P = {}> {
    (props: P, context?: any): ReactElement<any, any> | null;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: any;
    displayName?: string;
  }
  
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  type JSXElementConstructor<P> = (props: P) => ReactElement | null;
  type Key = string | number;
}

declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react-dom' {
  import * as ReactDOM from 'react-dom';
  export = ReactDOM;
  export as namespace ReactDOM;
}

declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    children?: React.ReactNode;
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    style?: React.CSSProperties;
    className?: string;
    onHoverStart?: (e: any) => void;
    onHoverEnd?: (e: any) => void;
    onTap?: () => void;
    onAnimationComplete?: () => void;
    whileHover?: any;
    whileTap?: any;
    layout?: boolean | "position" | "size" | "preserve-aspect" | undefined;
    custom?: any;
    ref?: React.Ref<any>;
  }

  export const motion: {
    [key: string]: React.ForwardRefExoticComponent<MotionProps>;
    div: React.FC<MotionProps>;
    button: React.FC<MotionProps>;
    span: React.FC<MotionProps>;
    // Add other HTML elements as needed
  };

  export const useAnimation: () => {
    start: (animation: any) => Promise<any>;
    set: (values: any) => void;
    stop: () => void;
    isRunning: () => boolean;
  };

  export const useInView: (options?: {
    root?: React.RefObject<Element> | Window;
    margin?: string;
    amount?: 'some' | 'all' | number;
    once?: boolean;
  }) => [
    (node?: Element | null) => void,
    boolean,
    Element | undefined
  ];

  export const motionValue: <T>(value: T) => { get: () => T; set: (value: T) => void };
  export const useMotionValue: <T>(value: T) => { get: () => T; set: (value: T) => void };
  export const useTransform: <Input, Output>(
    input: { get: () => Input } | Input[],
    inputRange: Input[],
    outputRange: Output[],
    options?: {
      clamp?: boolean;
      ease?: any[] | ((t: number) => number);
    }
  ) => { get: () => Output };

  export const animate: (
    from: any,
    to: any,
    options?: {
      duration?: number;
      ease?: any[] | ((t: number) => number);
      [key: string]: any;
    }
  ) => {
    stop: () => void;
  };

  export const useAnimationControls: () => {
    start: (definition: any, transitionOverride?: any) => Promise<any>;
    set: (values: any) => void;
    stop: () => void;
    isRunning: () => boolean;
  };

  export const useCycle: <T>(...items: T[]) => [T, (nextValue?: any) => void];
  export const useReducedMotion: () => boolean;
  export const useSpring: (value: any, config?: any) => any;
  export const AnimateSharedLayout: React.FC<{ children?: React.ReactNode }>;
  export const LayoutGroup: React.FC<{ children?: React.ReactNode }>;
  export const useMotionTemplate: (strings: TemplateStringsArray, ...values: any[]) => string;
  export const usePresence: () => [boolean, () => void, () => void];
  export const useTime: (options?: { duration?: number }) => { get: () => number };
  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    initial?: boolean;
    onExitComplete?: () => void;
    exitBeforeEnter?: boolean;
  }>;
}

// Declare module for react-icons/fi
declare module 'react-icons/fi' {
  import * as React from 'react';
  
  export const FiSend: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMic: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiImage: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiSmile: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiX: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMinimize2: React.FC<React.SVGProps<SVGSVGElement>>;
  export const FiMaximize2: React.FC<React.SVGProps<SVGSVGElement>>;
  // Add other Fi icons as needed
}

// Declare Node.js core modules that might be used in the browser
declare module 'stream';
declare module 'http';
declare module 'https';
declare module 'zlib';
declare module 'crypto';
declare module 'path';
declare module 'os';

// Extend the Window interface to include any global variables
interface Window {
  // Add any global variables that might be needed
}

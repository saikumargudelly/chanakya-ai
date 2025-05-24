// Type definitions for framer-motion

declare module 'framer-motion' {
  import * as React from 'react';

  export interface MotionProps {
    children?: React.ReactNode;
    initial?: boolean | string | any;
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
    inherit?: boolean;
    ref?: React.Ref<any>;
  }

  export interface MotionAdvancedProps extends MotionProps {
    custom?: any;
    inherit?: boolean;
  }

  export type HTMLMotionProps<TagName extends keyof React.ReactHTML> = MotionProps &
    React.ComponentPropsWithoutRef<TagName>;

  export type ForwardRefComponent<T, P> = React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<T>
  >;

  export type HTMLMotionComponents = {
    [K in keyof React.ReactHTML]: ForwardRefComponent<
      React.ElementRef<K>,
      HTMLMotionProps<K> & { [key: string]: any }
    >;
  };

  export const motion: HTMLMotionComponents & {
    [key: string]: ForwardRefComponent<any, any>;
  };

  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    initial?: boolean;
    exitBeforeEnter?: boolean;
    onExitComplete?: () => void;
  }>;

  export const useAnimation: () => {
    start: (definition: any, transitionOverride?: any) => Promise<any>;
    set: (values: any) => void;
    stop: () => void;
    isRunning: () => boolean;
  };

  export const useInView: (options?: {
    root?: React.RefObject<Element>;
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
  export const useScroll: (options?: {
    target?: React.RefObject<Element> | Window;
    offset?: [string | number, string | number];
    layoutEffect?: boolean;
  }) => {
    scrollX: { get: () => number };
    scrollY: { get: () => number };
    scrollXProgress: { get: () => number };
    scrollYProgress: { get: () => number };
  };

  export const useSpring: (value: any, config?: any) => any;
  export const AnimateSharedLayout: React.FC<{ children?: React.ReactNode }>;
  export const LayoutGroup: React.FC<{ children?: React.ReactNode }>;
  export const motionValue: <T>(value: T) => { get: () => T; set: (value: T) => void };
  export const useMotionTemplate: (strings: TemplateStringsArray, ...values: any[]) => string;
  export const usePresence: () => [boolean, () => void, () => void];
  export const useTime: (options?: { duration?: number }) => { get: () => number };
  export const useViewportScroll: typeof useScroll;
}

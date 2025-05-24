// This file extends the React type definitions
import 'react';

// Import the base React types
import * as React from 'react';

declare module 'react' {
  // Re-export all types from @types/react
  export * from 'react';
  
  // Add any missing type declarations here
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
  export function useState<S = undefined>(): [S | undefined, (newState: S | ((prevState: S | undefined) => S | undefined)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = undefined>(): { current: T | undefined };
  export function useContext<T>(context: React.Context<T>): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  export function useMemo<T>(factory: () => T, deps: any[]): T;
  
  // Add any other missing React types here
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    propTypes?: any;
    contextTypes?: any;
    defaultProps?: any;
    displayName?: string;
  }
  
  export interface FC<P = {}> extends FunctionComponent<P> {}
}

export = React;
export as namespace React;

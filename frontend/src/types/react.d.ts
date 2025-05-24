import * as React from 'react';

declare global {
  namespace React {
    export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
    export function useEffect(effect: React.EffectCallback, deps?: React.DependencyList): void;
    export function useContext<T>(context: React.Context<T>): T;
    export function useRef<T>(initialValue: T): React.MutableRefObject<T>;
    export function useRef<T>(initialValue: T | null): React.RefObject<T>;
    export function useRef<T = undefined>(): React.MutableRefObject<T | undefined>;
  }
}

export {};

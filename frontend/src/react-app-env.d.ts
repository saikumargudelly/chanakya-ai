/// <reference types="react-scripts" />

// Type definitions for React and other modules
import * as React from 'react';

declare global {
  namespace React {
    // Basic types
    type ReactNode = React.ReactNode;
    type ReactElement = React.ReactElement;
    type ReactChild = React.ReactChild;
    type ReactFragment = React.ReactFragment;
    type ReactPortal = React.ReactPortal;
    type ReactText = React.ReactText;
    type ReactNodeArray = React.ReactNodeArray;
    type ReactElementProps<T> = React.ComponentPropsWithRef<T>;
    type ComponentType<P = {}> = React.ComponentType<P>;
    
    // Hooks
    type DependencyList = React.DependencyList;
    type SetStateAction<S> = React.SetStateAction<S>;
    type Dispatch<A> = React.Dispatch<A>;
    
    // FC with children
    type FC<P = {}> = React.FunctionComponent<P>;
    
    interface FunctionComponent<P = {}> {
      (props: React.PropsWithChildren<P>, context?: any): ReactElement<any, any> | null;
    }
    type Key = React.Key;
    type JSXElementConstructor<P> = React.JSXElementConstructor<P>;
  }
  
  interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }
  
  type ReactNode = ReactElement | string | number | ReactFragment | ReactPortal | boolean | null | undefined;
  
  // Add other React types as needed
}

// Add global type declarations as needed

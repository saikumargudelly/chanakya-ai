// Custom type declarations for the project

// Ensure TypeScript treats .css files as modules
// This allows importing CSS files in TypeScript files
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Ensure TypeScript treats .scss files as modules
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Ensure TypeScript treats .sass files as modules
declare module '*.sass' {
  const content: { [className: string]: string };
  export default content;
}

// Ensure TypeScript treats .less files as modules
declare module '*.less' {
  const content: { [className: string]: string };
  export default content;
}

// Image files
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Other asset files
declare module '*.webp';
declare module '*.json';

// Global type for environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    // Add other environment variables as needed
  }
}

// Extend the Window interface to include any global variables
interface Window {
  // Add any global variables that might be needed
  __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: Function;
}

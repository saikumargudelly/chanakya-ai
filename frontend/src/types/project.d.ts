// Project-specific type declarations

// Declare module for CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.less' {
  const classes: { [key: string]: string };
  export default classes;
}

// Declare module for image files
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

// Declare module for other asset files
declare module '*.webp';
declare module '*.json';

// Declare global types for the application
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

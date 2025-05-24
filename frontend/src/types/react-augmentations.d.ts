import 'react';

declare module 'react' {
  // Add any missing React types here if needed
  export * from '@types/react';
}

declare module 'framer-motion' {
  // This helps TypeScript understand framer-motion types
  export * from 'framer-motion';
}

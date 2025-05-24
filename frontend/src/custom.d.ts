// This file helps TypeScript understand the types used in the project

// Extend the Window interface to include any global variables
declare global {
  interface Window {
    // Add any global variables here if needed
  }
}

// Declare modules that don't have type definitions
declare module 'framer-motion';
declare module 'react-icons/fi';
declare module 'uuid';
// Add any other modules that need type declarations here

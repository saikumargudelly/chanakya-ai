declare module 'context/ThemeContext' {
  import * as React from 'react';

  type Theme = 'light' | 'dark';

  interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
  }

  export const ThemeContext: React.Context<ThemeContextType>;
  export const useTheme: () => ThemeContextType;
  export const ThemeProvider: React.FC<{ children: React.ReactNode }>;
}

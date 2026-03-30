import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Always dark mode
    const root = window.document.documentElement;
    root.classList.add('dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0a0b0d');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

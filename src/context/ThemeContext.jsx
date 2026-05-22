import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  useEffect(() => {
    // Always light mode for academic design
    const root = window.document.documentElement;
    root.classList.remove('dark');
    root.classList.add('light');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#1E3A8A');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
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

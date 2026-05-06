import { createContext, useContext, ReactNode } from 'react';

const ThemeContext = createContext<{ theme: 'light'; toggleTheme?: () => void } | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeContext.Provider value={{ theme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
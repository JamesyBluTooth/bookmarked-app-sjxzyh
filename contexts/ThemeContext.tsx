
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useAppStore } from '@/stores/appStore';

type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const themeModeFromStore = useAppStore((state) => state.themeMode);
  const setThemeModeInStore = useAppStore((state) => state.setThemeMode);
  
  // Initialize with light mode if no preference is stored
  const [themeMode, setThemeModeState] = useState<ThemeMode>(themeModeFromStore || 'light');

  useEffect(() => {
    // Sync with store on mount
    if (themeModeFromStore) {
      setThemeModeState(themeModeFromStore);
    } else {
      // Set default to light mode in store
      setThemeModeInStore('light');
    }
  }, [themeModeFromStore, setThemeModeInStore]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setThemeModeInStore(mode);
  };

  const isDark = themeMode === 'auto' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
}

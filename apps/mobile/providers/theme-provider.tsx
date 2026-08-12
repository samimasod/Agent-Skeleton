import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { colorScheme as nativeWindColorScheme, vars } from 'nativewind';

type Theme = 'light' | 'dark';

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const themeColors = {
  light: {
    foreground: '#241b10',
    mutedForeground: '#8b7857',
    primary: '#b98222',
    primaryForeground: '#fbf7ec',
    destructive: '#ad4f3f',
  },
  dark: {
    foreground: '#f8efd8',
    mutedForeground: '#a89a7b',
    primary: '#d6a84f',
    primaryForeground: '#1a150f',
    destructive: '#c65f4d',
  },
} as const;

type ThemeColors = (typeof themeColors)[Theme];

const themeVars = {
  light: {
    '--background': '42 58% 95%',
    '--foreground': '35 38% 10%',
    '--card': '45 67% 98%',
    '--card-foreground': '35 38% 10%',
    '--popover': '45 67% 98%',
    '--popover-foreground': '35 38% 10%',
    '--primary': '40 69% 43%',
    '--primary-foreground': '45 67% 98%',
    '--secondary': '42 38% 88%',
    '--secondary-foreground': '36 38% 16%',
    '--muted': '42 32% 88%',
    '--muted-foreground': '38 22% 45%',
    '--accent': '39 46% 80%',
    '--accent-foreground': '36 38% 16%',
    '--destructive': '8 50% 48%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '41 30% 78%',
    '--input': '41 32% 82%',
    '--ring': '40 69% 43%',
    '--radius': '12px',
    '--radius-xl': '16px',
    '--radius-2xl': '20px',
  },
  dark: {
    '--background': '40 16% 4%',
    '--foreground': '43 64% 91%',
    '--card': '40 20% 7%',
    '--card-foreground': '43 64% 91%',
    '--popover': '40 20% 7%',
    '--popover-foreground': '43 64% 91%',
    '--primary': '42 62% 57%',
    '--primary-foreground': '40 20% 8%',
    '--secondary': '42 24% 14%',
    '--secondary-foreground': '43 50% 84%',
    '--muted': '42 16% 12%',
    '--muted-foreground': '42 22% 58%',
    '--accent': '36 34% 20%',
    '--accent-foreground': '43 58% 88%',
    '--destructive': '8 50% 54%',
    '--destructive-foreground': '43 60% 92%',
    '--border': '41 23% 21%',
    '--input': '41 20% 18%',
    '--ring': '42 62% 57%',
    '--radius': '12px',
    '--radius-xl': '16px',
    '--radius-2xl': '20px',
  },
} as const;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  const setTheme = (nextTheme: Theme) => {
    setThemeState(nextTheme);
    nativeWindColorScheme.set(nextTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    nativeWindColorScheme.set(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      colors: themeColors[theme],
      setTheme,
      toggleTheme,
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>
      <View className="flex-1 bg-background" style={vars(themeVars[theme])}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return value;
}

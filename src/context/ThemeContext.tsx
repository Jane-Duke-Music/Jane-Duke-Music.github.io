import React, { createContext, useContext, useState, useEffect } from 'react';
import { CustomTheme } from '../types';
import { getStoredTheme, saveStoredTheme } from '../utils/indexedDB';

interface ThemeContextType {
  theme: CustomTheme;
  updateTheme: (updates: Partial<CustomTheme>) => void;
  resetTheme: () => void;
}

const defaultTheme: CustomTheme = {
  accentColor: '#d4af37',
  fontFamily: 'serif',
  backgroundVibe: 'blood-noir',
  visualizerType: 'bars',
  uiDensity: 'comfortable',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<CustomTheme>(defaultTheme);

  useEffect(() => {
    getStoredTheme().then((stored) => {
      if (stored) setTheme(stored);
    });
  }, []);

  const updateTheme = (updates: Partial<CustomTheme>) => {
    setTheme((prev) => {
      const next = { ...prev, ...updates };
      saveStoredTheme(next);
      return next;
    });
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
    saveStoredTheme(defaultTheme);
  };

  // Dynamically apply background style class/variable to document body
  useEffect(() => {
    const body = document.body;
    if (theme.backgroundVibe === 'obsidian') {
      body.style.background = 'radial-gradient(ellipse at center, #1a0505 0%, #100202 35%, #050101 70%, #000000 100%)';
    } else if (theme.backgroundVibe === 'crimson-abyss') {
      body.style.background = 'radial-gradient(ellipse at center, #4d0505 0%, #300202 30%, #180000 60%, #000000 100%)';
    } else {
      // Default from reference style.css
      body.style.background = 'radial-gradient(ellipse at center, #3a0000 0%, #2a0000 25%, #1a0000 45%, #0f0000 65%, #000000 100%)';
    }

    if (theme.fontFamily === 'serif') {
      body.style.fontFamily = "'Libre Baskerville', Georgia, serif";
    } else if (theme.fontFamily === 'cinzel') {
      body.style.fontFamily = "'Cinzel', serif";
    } else {
      body.style.fontFamily = "'Inter', system-ui, sans-serif";
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

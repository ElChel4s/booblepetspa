import { createContext, useState, useContext } from 'react';
import { THEMES } from '../utils/themes';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('menta');

  const themeVars = THEMES[currentTheme].vars;

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, themeVars, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

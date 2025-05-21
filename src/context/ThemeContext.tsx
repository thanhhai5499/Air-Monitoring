"use client";

import type React from "react";
import { createContext, useState, useContext, useEffect } from "react";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Luôn sử dụng theme light
  const [theme, setTheme] = useState<Theme>("light");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Always use light theme
    setTheme("light");
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      // Always remove dark class to ensure light theme
      document.documentElement.classList.remove("dark");
    }
  }, [isInitialized]);

  // Giữ lại hàm này để tránh lỗi khi có component gọi đến
  const toggleTheme = () => {
    // Do nothing, always light theme
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

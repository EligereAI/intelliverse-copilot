"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  isDark: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export const themeScript = `
(function(){
  try{
    var t=localStorage.getItem('copilot-theme');
    if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
    document.documentElement.setAttribute('data-theme',t);
  }catch(e){}
})();
`;

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export default function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme;

    try {
      const saved = localStorage.getItem("copilot-theme") as Theme | null;
      const systemDark = window.matchMedia("(prefers-color-scheme:dark)").matches;
      return saved ?? (systemDark ? "dark" : "light");
    } catch {
      return defaultTheme;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("copilot-theme", next);
      } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, isDark: theme === "dark" }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";
// Add chat interface theme type
type ChatTheme = "default" | "bubble" | "elegant" | "minimal";

type ThemeProviderProps = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  chatTheme: ChatTheme;
  setChatTheme: (theme: ChatTheme) => void;
};

const ThemeContext = createContext<ThemeProviderProps>({
  theme: "system",
  setTheme: () => null,
  chatTheme: "default",
  setChatTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultChatTheme = "default",
  ...props
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultChatTheme?: ChatTheme;
  [key: string]: any;
}) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("theme") as Theme) || defaultTheme
  );
  
  const [chatTheme, setChatTheme] = useState<ChatTheme>(
    () => (localStorage.getItem("chatTheme") as ChatTheme) || defaultChatTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-default", "theme-bubble", "theme-elegant", "theme-minimal");
    root.classList.add(`theme-${chatTheme}`);
    
    localStorage.setItem("chatTheme", chatTheme);
  }, [chatTheme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem("theme", theme);
      setTheme(theme);
    },
    chatTheme,
    setChatTheme: (theme: ChatTheme) => {
      localStorage.setItem("chatTheme", theme);
      setChatTheme(theme);
    },
  };

  return (
    <ThemeContext.Provider {...props} value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

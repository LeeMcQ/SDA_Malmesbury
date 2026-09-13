"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

export function ThemeRoot({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("night", theme === "night");
    document.documentElement.style.colorScheme = theme === "night" ? "dark" : "light";
  }, [theme]);

  return children;
}

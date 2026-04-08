import { useState, useEffect } from "react";

export function useSettings() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("tennisgrid_theme");
    if (saved) return saved;
    return "dark";
  });

  const [units, setUnits] = useState(() => {
    return localStorage.getItem("tennisgrid_units") || "imperial";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("tennisgrid_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("tennisgrid_units", units);
  }, [units]);

  return { theme, setTheme, units, setUnits };
}

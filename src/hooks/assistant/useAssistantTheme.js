import { useState } from "react";
import { ASSISTANT_THEMES } from "../../constants/assistantThemes";

export const useAssistantTheme = () => {
  const [activeThemeId, setActiveThemeId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("ai_theme_id") || "rose";
    }
    return "rose";
  });

  const activeTheme =
    ASSISTANT_THEMES[activeThemeId] || ASSISTANT_THEMES["rose"];

  const handleCycleTheme = () => {
    const themeIds = Object.keys(ASSISTANT_THEMES);
    const currentIndex = themeIds.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const newThemeId = themeIds[nextIndex];
    setActiveThemeId(newThemeId);
    localStorage.setItem("ai_theme_id", newThemeId);
  };

  return { activeTheme, handleCycleTheme };
};

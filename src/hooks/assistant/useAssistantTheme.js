import { ASSISTANT_THEMES } from "../../constants/assistantThemes";

export const useAssistantTheme = (currentThemeId, onThemeChange) => {
  // Use passed props or default fallback
  const activeThemeId = currentThemeId || "rose";
  const activeTheme =
    ASSISTANT_THEMES[activeThemeId] || ASSISTANT_THEMES["rose"];

  const handleCycleTheme = () => {
    const themeIds = Object.keys(ASSISTANT_THEMES);
    const currentIndex = themeIds.indexOf(activeThemeId);
    const nextIndex = (currentIndex + 1) % themeIds.length;
    const newThemeId = themeIds[nextIndex];

    // Call the callback prop to update state in parent (App.jsx)
    if (onThemeChange) {
      onThemeChange(newThemeId);
    }
  };

  return { activeTheme, handleCycleTheme };
};

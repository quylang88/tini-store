import { useEffect } from "react";

const useThemeColor = (color) => {
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    const originalColor = metaThemeColor
      ? metaThemeColor.getAttribute("content")
      : null;

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color);
    } else {
      const newMeta = document.createElement("meta");
      newMeta.name = "theme-color";
      newMeta.content = color;
      document.head.appendChild(newMeta);
    }

    return () => {
      if (metaThemeColor && originalColor) {
        metaThemeColor.setAttribute("content", originalColor);
      }
    };
  }, [color]);
};

export default useThemeColor;

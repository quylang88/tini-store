import { useState, useCallback } from "react";
import useImagePreloader from "../ui/useImagePreloader";

const useAppInit = (isAuthenticated) => {
  const {
    isLoaded: appReady,
    showWarning,
    handleForceContinue: originalHandleForceContinue,
  } = useImagePreloader("/tiny-shop-transparent.png", isAuthenticated);

  const [offlineAcknowledged, setOfflineAcknowledged] = useState(false);

  const handleForceContinue = useCallback(() => {
    if (showWarning) {
      setOfflineAcknowledged(true);
    }
    originalHandleForceContinue();
  }, [showWarning, originalHandleForceContinue]);

  return {
    appReady,
    showWarning,
    offlineAcknowledged,
    handleForceContinue,
  };
};

export default useAppInit;

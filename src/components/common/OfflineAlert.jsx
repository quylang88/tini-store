import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NetworkWarning from "./NetworkWarning";

const OfflineAlert = ({ initialAcknowledged = false }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  // Check sessionStorage on mount (for page refreshes or route changes)
  const [isDismissed, setIsDismissed] = useState(() => {
    return (
      (!navigator.onLine && initialAcknowledged) ||
      sessionStorage.getItem("offline_dismissed") === "true"
    );
  });

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // We do NOT reset dismissed state when back online, because the user said "once logged in, it doesn't appear again".
      // If we clear it here, a momentary network blip would re-enable the warning for the next drop.
      // But maybe "only show once" means "once per session"?
      // If I clear it here, then if network drops again 5 mins later, it shows again.
      // If the user wants "Show once per session", I should NOT clear it here.
      // Let's assume "only show once" means strictly once per session.
      // sessionStorage.removeItem("offline_dismissed");
    };

    const handleOffline = () => {
      setIsOffline(true);
      // If previously dismissed in this session, don't show again unless we want to be strict
      // The requirement says "only show once", so we respect session storage.
      if (sessionStorage.getItem("offline_dismissed") === "true") {
        setIsDismissed(true);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleConfirm = () => {
    setIsDismissed(true);
    sessionStorage.setItem("offline_dismissed", "true");
  };

  const showOverlay = isOffline && !isDismissed;

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100]"
        >
          <NetworkWarning onConfirm={handleConfirm} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineAlert;

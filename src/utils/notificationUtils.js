export const checkNotificationSupport = () => {
  return "Notification" in window;
};

export const requestNotificationPermission = async () => {
  if (!checkNotificationSupport()) return "unsupported";
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
};

export const sendNotification = (title, options = {}) => {
  if (!checkNotificationSupport()) return;

  if (Notification.permission === "granted") {
    try {
      // iOS PWA support for Service Worker based notifications is complex,
      // but standard local Notification API works in standalone mode on newer iOS
      // if permission is granted.
      // Note: For iOS Safari PWA, sometimes a Service Worker registration is required
      // even for local notifications to function reliably in background,
      // but simple foreground/launch notifications work with the standard API.
      const notification = new Notification(title, {
        icon: "/tiny-shop-192.png", // Assuming this exists or similar
        badge: "/tiny-shop-192.png",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error("Notification sending failed", e);
    }
  }
};
